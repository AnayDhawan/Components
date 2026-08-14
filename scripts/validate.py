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


def check_entries(entries, kind, errors):
    """Required fields + duplicate names, for one array."""
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
