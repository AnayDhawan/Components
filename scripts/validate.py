#!/usr/bin/env python3
"""Validate components.json against the rules in CONTRIBUTING.md.

This is the same check CI runs. Run it before opening a PR:

    python3 scripts/validate.py

Exit code is 0 when the file is valid, 1 when it is not. Every problem found is
printed, not just the first, so one run tells you everything to fix.
"""

import json
import sys

from _registry import COMPONENTS_JSON, load

# CONTRIBUTING.md requires the same fields of both arrays. effect is showpiece-only:
# it's the live-fetch match surface's descriptive half, and fallback_basic entries
# never carried it.
REQUIRED = ("aliases", "ref", "library", "license")
SHOWPIECE_ONLY_REQUIRED = ("effect",)

# A license field that is present but says nothing is worse than a missing one:
# it passes the required-field check while still leaving the legal status unknown.
LICENSE_PLACEHOLDERS = {"", "tbd", "todo", "verify", "unknown", "n/a", "none", "?"}

# The structured half of a showpiece's fetch surface. `ref` is the human- and
# agent-facing command string; `fetch` is what tooling reads.
#
# Why both exist: three separate consumers (smoke-test.mjs, health-check.py,
# gallery/scripts/fetch-showpieces.mjs) each used to re-derive a URL and a CLI by
# regex-parsing `ref`. That made `exec(entry.ref)` the obvious way to "run the
# ref" for anyone writing a fourth consumer, which is the footgun #47 is about.
# With `fetch` present, the obvious move is reading two fields, and the checks
# below guarantee the string can never disagree with them.
FETCH_METHODS = {"registry_cli", "webfetch", "playwright"}
# Only these CLIs may appear in fetch.cli. Consumers map them to a project setup,
# so an unknown one is a data error, not something to accommodate at runtime.
KNOWN_CLIS = {"shadcn", "shadcn-vue"}


def canonical_ref(fetch):
    """The one `ref` string a registry_cli fetch is allowed to have."""
    return 'npx %s@latest add "%s"' % (fetch.get("cli"), fetch.get("url"))


def check_fetch(label, entry, errors):
    """Validate one entry's `fetch` object and its agreement with `ref`."""
    fetch = entry.get("fetch")
    if fetch is None:
        errors.append(f"{label}: fetch missing (structured registry_url + method, see CONTRIBUTING.md)")
        return
    if not isinstance(fetch, dict):
        errors.append(f"{label}: fetch must be an object, got {type(fetch).__name__}")
        return

    method = fetch.get("method")
    if method not in FETCH_METHODS:
        errors.append(f"{label}: fetch.method must be one of {sorted(FETCH_METHODS)}, got {method!r}")

    url = fetch.get("url")
    if not isinstance(url, str) or not url:
        errors.append(f"{label}: fetch.url missing")
        return
    # https only. A registry command is executed and a page fetch is read, so
    # neither has any business being plaintext.
    if not url.startswith("https://"):
        errors.append(f"{label}: fetch.url must be https, got {url!r}")

    ref = entry.get("ref") or ""
    if method == "registry_cli":
        cli = fetch.get("cli")
        if cli not in KNOWN_CLIS:
            errors.append(f"{label}: fetch.cli must be one of {sorted(KNOWN_CLIS)}, got {cli!r}")
        elif ref.strip() != canonical_ref(fetch):
            # Drift between the two is the whole failure mode this pairing has to
            # rule out, so it is an error rather than a warning.
            errors.append(
                f"{label}: ref does not match fetch. "
                f"ref is {ref.strip()!r}, fetch renders to {canonical_ref(fetch)!r}"
            )
    else:
        if "cli" in fetch:
            errors.append(f"{label}: fetch.cli is only meaningful for method 'registry_cli'")
        if url not in ref:
            errors.append(f"{label}: fetch.url {url!r} does not appear in ref {ref.strip()!r}")


def check_entries(entries, kind, errors):
    """Required fields, duplicate names, and field shapes, for one array."""
    names = set()
    required = REQUIRED + SHOWPIECE_ONLY_REQUIRED if kind == "showpiece" else REQUIRED
    for c in entries:
        n = c.get("name")
        if not n:
            errors.append(f"{kind} entry missing 'name'")
            continue
        if n in names:
            errors.append(f"duplicate {kind} name: {n}")
        names.add(n)
        for key in required:
            if not c.get(key):
                errors.append(f"{n}: {key} missing")

        # aliases are the match surface, so an empty or scalar one silently makes
        # the entry unreachable by description.
        aliases = c.get("aliases")
        if aliases is not None:
            if not isinstance(aliases, list):
                errors.append(
                    f"{n}: aliases must be a list, got {type(aliases).__name__}"
                )
            elif not aliases:
                errors.append(f"{n}: aliases is empty")
            elif not all(isinstance(a, str) and a.strip() for a in aliases):
                errors.append(f"{n}: aliases must be non-empty strings")

        # deps as a bare string is the easy mistake: "motion" iterates as
        # characters, so anything consuming it installs garbage.
        deps = c.get("deps")
        if deps is not None and not isinstance(deps, list):
            errors.append(
                f"{n}: deps must be a list, got {type(deps).__name__} "
                f"({deps!r} - wrap it in [])"
            )

        lic = c.get("license")
        if isinstance(lic, str) and lic.strip().lower() in LICENSE_PLACEHOLDERS:
            errors.append(f"{n}: license is a placeholder ({lic!r}), not a real license")
        elif lic is not None and not isinstance(lic, str):
            errors.append(f"{n}: license must be a string, got {type(lic).__name__}")


def check_framework_variants(showpiece, known_libs, errors):
    """Optional per-entry `frameworks` object: an alternate ref/library/license/deps
    for a non-React port of the same effect (e.g. `frameworks.vue`).

    A variant inherits name/aliases/effect from its parent entry - only the
    fetch/license surface differs per framework, so it only needs the fields that
    actually change: ref, library, license, and optionally deps.
    """
    required = ("ref", "library", "license")
    for c in showpiece:
        name = c.get("name")
        frameworks = c.get("frameworks")
        if frameworks is None:
            continue
        if not isinstance(frameworks, dict):
            errors.append(f"{name}: frameworks must be an object, got {type(frameworks).__name__}")
            continue

        for fw, variant in frameworks.items():
            label = f"{name}.frameworks.{fw}"
            if not isinstance(variant, dict):
                errors.append(f"{label}: must be an object, got {type(variant).__name__}")
                continue

            for key in required:
                if not variant.get(key):
                    errors.append(f"{label}: {key} missing")

            deps = variant.get("deps")
            if deps is not None and not isinstance(deps, list):
                errors.append(
                    f"{label}: deps must be a list, got {type(deps).__name__} ({deps!r} - wrap it in [])"
                )

            lic = variant.get("license")
            if isinstance(lic, str) and lic.strip().lower() in LICENSE_PLACEHOLDERS:
                errors.append(f"{label}: license is a placeholder ({lic!r}), not a real license")
            elif lic is not None and not isinstance(lic, str):
                errors.append(f"{label}: license must be a string, got {type(lic).__name__}")

            lib = variant.get("library")
            if lib and lib not in known_libs:
                errors.append(
                    f"{label}: library '{lib}' is not in code_libraries[] ({', '.join(sorted(known_libs))})"
                )


def check_layouts(layouts, showpiece_names, errors):
    """layouts[] compose showpiece[] entries (web) or document external vidstudio
    patterns (video, unenforceable here - see TASTE.md for that asymmetry).
    """
    required = ("name", "description", "composedFrom")
    valid_kinds = {"web", "video"}
    names = set()
    for entry in layouts:
        n = entry.get("name")
        if not n:
            errors.append("layouts entry missing 'name'")
            continue
        if n in names:
            errors.append(f"duplicate layouts name: {n}")
        names.add(n)

        for key in required:
            if not entry.get(key):
                errors.append(f"layouts.{n}: {key} missing")

        kind = entry.get("kind")
        if kind not in valid_kinds:
            errors.append(f"layouts.{n}: kind must be one of {sorted(valid_kinds)}, got {kind!r}")

        composed = entry.get("composedFrom")
        if composed is not None and not isinstance(composed, list):
            errors.append(f"layouts.{n}: composedFrom must be a list")
        elif kind == "web" and isinstance(composed, list):
            for ref in composed:
                if ref not in showpiece_names:
                    errors.append(
                        f"layouts.{n}: composedFrom references '{ref}', not a showpiece[] name"
                    )


def check_alias_collisions(showpiece, errors):
    """No alias may point at two different showpieces.

    Aliases drive matching, so a string claimed by two entries makes the match
    ambiguous and whichever entry happens to be first silently wins.
    """
    owners = {}
    for c in showpiece:
        name = c.get("name")
        aliases = c.get("aliases")
        if not name or not isinstance(aliases, list):
            continue
        for alias in aliases:
            if not isinstance(alias, str):
                continue
            key = alias.strip().lower()
            if not key:
                continue
            owners.setdefault(key, []).append(name)

    for alias, holders in sorted(owners.items()):
        unique = sorted(set(holders))
        if len(unique) > 1:
            errors.append(
                f"alias {alias!r} is claimed by {len(unique)} showpieces: "
                f"{', '.join(unique)}"
            )


def validate(data):
    """Return a list of problems. Empty list means valid."""
    errors = []

    libs = data.get("code_libraries", [])
    if not libs:
        return ["no code_libraries found"]
    known_libs = {l.get("name") for l in libs}

    showpiece = data.get("showpiece", [])
    if not showpiece:
        errors.append("no showpiece entries found")

    fb = data.get("fallback_basic", {}).get("components", [])
    if not fb:
        errors.append("no fallback_basic components found")

    check_entries(showpiece, "showpiece", errors)
    check_entries(fb, "fallback", errors)

    # showpiece[] only. fallback_basic refs are shadcn shorthand ("npx shadcn@latest
    # add button") or prose compose instructions with no URL at all, and no consumer
    # executes or fetches them, so there is nothing for a structured form to protect.
    for c in showpiece:
        check_fetch(c.get("name"), c, errors)
        for fw, variant in (c.get("frameworks") or {}).items():
            if isinstance(variant, dict):
                check_fetch(f"{c.get('name')}.frameworks.{fw}", variant, errors)
    check_alias_collisions(showpiece, errors)
    check_framework_variants(showpiece, known_libs, errors)

    layouts = data.get("layouts", [])
    showpiece_names = {c.get("name") for c in showpiece}
    check_layouts(layouts, showpiece_names, errors)

    # Showpieces are live-fetched, so their library must be a real registry we
    # document. Fallbacks intentionally point at shadcn/tremor, which are not
    # code_libraries entries, so they are exempt from this check.
    for c in showpiece:
        lib = c.get("library")
        if lib and lib not in known_libs:
            errors.append(
                f"{c.get('name')}: library '{lib}' is not in code_libraries[] "
                f"({', '.join(sorted(known_libs))})"
            )

    return errors


def main():
    try:
        data = load()
    except FileNotFoundError:
        print(f"components.json not found at {COMPONENTS_JSON}")
        return 1
    except json.JSONDecodeError as e:
        print(f"components.json is not valid JSON: {e}")
        return 1

    errors = validate(data)
    if errors:
        print(f"{len(errors)} problem(s) in components.json:\n")
        print("\n".join(f"  - {e}" for e in errors))
        return 1

    showpiece = data.get("showpiece", [])
    fb = data.get("fallback_basic", {}).get("components", [])
    libs = data.get("code_libraries", [])
    layouts = data.get("layouts", [])
    print(
        f"OK: {len(showpiece)} showpiece + {len(fb)} fallback + {len(libs)} libraries "
        f"+ {len(layouts)} layouts"
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
