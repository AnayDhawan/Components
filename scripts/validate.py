#!/usr/bin/env python3
"""Validate components.json against the rules in CONTRIBUTING.md.

This is the same check CI runs. Run it before opening a PR:

    python3 scripts/validate.py

Exit code is 0 when the file is valid, 1 when it is not. Every problem found is
printed, not just the first, so one run tells you everything to fix.
"""

import json
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
COMPONENTS_JSON = os.path.join(ROOT, "components.json")

# CONTRIBUTING.md requires the same fields of both arrays.
REQUIRED = ("aliases", "ref", "library", "license")

# A license field that is present but says nothing is worse than a missing one:
# it passes the required-field check while still leaving the legal status unknown.
LICENSE_PLACEHOLDERS = {"", "tbd", "todo", "verify", "unknown", "n/a", "none", "?"}


def check_entries(entries, kind, errors):
    """Required fields, duplicate names, and field shapes, for one array."""
    names = set()
    for c in entries:
        n = c.get("name")
        if not n:
            errors.append(f"{kind} entry missing 'name'")
            continue
        if n in names:
            errors.append(f"duplicate {kind} name: {n}")
        names.add(n)
        for key in REQUIRED:
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
    check_alias_collisions(showpiece, errors)

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
        with open(COMPONENTS_JSON, encoding="utf-8") as f:
            data = json.load(f)
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
    print(
        f"OK: {len(showpiece)} showpiece + {len(fb)} fallback + {len(libs)} libraries"
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
