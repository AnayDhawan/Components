#!/usr/bin/env python3
"""Soft-fail registry health check.

Pings every showpiece ref and every code-library site, then writes a markdown
report. It never decides what to do about failures; the workflow does that. Run
it locally with no arguments to see the current state of the registry:

    python3 scripts/health-check.py

Exit code is 0 unless the check itself could not run. A dead upstream registry
is data, not a script failure, which is what makes this safe to schedule.
"""

import os
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from collections import Counter

from _registry import ROOT, load

TIMEOUT = 25
DELAY = 0.4  # be a polite guest on other people's registries
UA = "components-skill-health-check/1.1.1 (+https://github.com/AnayDhawan/Components)"

# Upstream breakage that is already diagnosed and written up in
# references/live-fetch.md § Known registry issues. These still get probed and
# still appear in the report, but they do NOT count toward the failure total,
# because the failure total is what opens and re-opens the weekly tracking issue.
# Without this, a permanent upstream condition re-files an issue every Monday
# forever and the signal stops meaning anything.
#
# Sourced from components.json's own `known_issues[]` (host, status, why, issue)
# instead of a hand-maintained copy here - scripts/smoke-test.mjs and
# gallery/scripts/fetch-showpieces.mjs read the same array. A host only gets
# excused for the exact status documented; anything else about it is still a
# real, countable failure.
def _known_issues_by_host(data):
    return {rec["host"]: rec for rec in data.get("known_issues", [])}


def known_issue(known_issues, url, status):
    """Return the known_issues record if this exact failure is already documented."""
    if not url:
        return None
    host = urllib.parse.urlparse(url).hostname
    record = known_issues.get(host)
    if record and record["status"] == status:
        return record
    return None

# `npx shadcn@latest add "<url>"` and `fetch page <url> via webfetch/playwright`
URL_RE = re.compile(r'https?://[^\s"\'<>)]+')


def extract_url(ref):
    m = URL_RE.search(ref or "")
    return m.group(0) if m else None


# A 429 body containing any of these is Vercel's Attack Challenge Mode (a bot
# fingerprint check), not real throttling: it never clears on its own, unlike
# a rate limit, which is transient by definition. Conflating the two makes the
# weekly report imply "retry later" for a condition retrying will never fix.
CHALLENGE_MARKERS = ("Attack Challenge Mode", "_vercel_challenge", "Vercel Security Checkpoint")


def probe(url):
    """Return (status, detail). status is one of ok / rate-limited / challenged / dead / error."""
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    try:
        with urllib.request.urlopen(req, timeout=TIMEOUT) as r:
            return "ok", f"HTTP {r.status}"
    except urllib.error.HTTPError as e:
        if e.code == 429:
            body = ""
            try:
                body = e.read(8192).decode("utf-8", errors="replace")
            except Exception:  # noqa: BLE001 - body read is best-effort
                pass
            if any(marker in body for marker in CHALLENGE_MARKERS):
                return "challenged", "HTTP 429 (bot-challenge page, not throttling)"
            # 429 with no challenge markers is upstream throttling, not a
            # missing component. Worth reporting, but a different problem from
            # a ref that no longer exists.
            return "rate-limited", "HTTP 429"
        return "dead", f"HTTP {e.code}"
    except urllib.error.URLError as e:
        return "dead", f"{type(e.reason).__name__}: {e.reason}"
    except Exception as e:  # noqa: BLE001 - a check that crashes is a broken check
        return "error", f"{type(e).__name__}: {e}"


def main():
    data = load()
    known_issues = _known_issues_by_host(data)

    targets = []
    for entry in data.get("showpiece", []):
        url = extract_url(entry.get("ref"))
        if url:
            targets.append(("showpiece", f"{entry['library']}/{entry['name']}", url))
        else:
            targets.append(("showpiece", f"{entry['library']}/{entry['name']}", None))
    for lib in data.get("code_libraries", []):
        if lib.get("site"):
            targets.append(("library site", lib["name"], lib["site"]))
        # A mirror is the host that curated entries actually resolve through when
        # the library's own registry is gated (21st.dev -> kokonutui.com). Probing
        # only the gated site would report the library healthy while the host doing
        # the real work is down, so mirrors get their own target.
        if lib.get("mirror_site"):
            targets.append(("library mirror", f"{lib['name']} mirror", lib["mirror_site"]))

    results = []
    for kind, name, url in targets:
        if url is None:
            results.append((kind, name, "-", "error", "no URL found in ref"))
            continue
        status, detail = probe(url)
        results.append((kind, name, url, status, detail))
        flag = " (known issue)" if known_issue(known_issues, url, status) else ""
        print(f"{status:<13} {name:<40} {detail}{flag}", flush=True)
        time.sleep(DELAY)

    counts = Counter(r[3] for r in results)
    failing = [r for r in results if r[3] != "ok"]
    known = [r for r in failing if known_issue(known_issues, r[2], r[3])]
    bad = [r for r in failing if not known_issue(known_issues, r[2], r[3])]

    lines = [
        "# Registry health check",
        "",
        f"Checked **{len(results)}** targets: "
        f"{counts.get('ok', 0)} ok, {counts.get('rate-limited', 0)} rate-limited, "
        f"{counts.get('challenged', 0)} challenged, "
        f"{counts.get('dead', 0)} dead, {counts.get('error', 0)} error.",
        "",
        f"**{len(bad)}** need attention. "
        f"{len(known)} are already-documented upstream issues and are not counted.",
        "",
    ]
    if bad:
        lines += [
            "## Needs attention",
            "",
            "| Kind | Entry | Status | Detail | URL |",
            "|---|---|---|---|---|",
        ]
        for kind, name, url, status, detail in bad:
            lines.append(f"| {kind} | `{name}` | **{status}** | {detail} | {url} |")
        lines += [
            "",
            "`rate-limited` may be transient; `challenged` is a bot-detection page "
            "(e.g. Vercel Attack Challenge Mode) and will not clear on retry; `dead` "
            "means the ref no longer resolves and any user asking for that showpiece "
            "gets a failure.",
            "",
        ]
    else:
        lines += ["Every showpiece ref and library site resolved, or is a known issue.", ""]

    if known:
        lines += [
            "## Known upstream issues (expected, not counted)",
            "",
            "Documented in `references/live-fetch.md` § Known registry issues.",
            "",
            "| Entry | Status | Tracking | Why |",
            "|---|---|---|---|",
        ]
        seen = set()
        for kind, name, url, status, detail in known:
            rec = known_issue(known_issues, url, status)
            why, issue = rec["why"], rec["issue"]
            lines.append(f"| `{name}` | {status} | #{issue} | {why if issue not in seen else 'as above'} |")
            seen.add(issue)
        lines.append("")

    report = "\n".join(lines) + "\n"
    with open(os.path.join(ROOT, "health-report.md"), "w", encoding="utf-8") as f:
        f.write(report)

    summary = os.environ.get("GITHUB_STEP_SUMMARY")
    if summary:
        with open(summary, "a", encoding="utf-8") as f:
            f.write(report)

    out = os.environ.get("GITHUB_OUTPUT")
    if out:
        with open(out, "a", encoding="utf-8") as f:
            f.write(f"failures={len(bad)}\n")

    print(f"\n{len(bad)} failing target(s).")
    return 0


if __name__ == "__main__":
    sys.exit(main())
