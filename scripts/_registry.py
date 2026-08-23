#!/usr/bin/env python3
"""Shared components.json loader for scripts/*.

validate.py, health-check.py, and their consumers each independently resolved
the repo root, joined components.json, and opened it with the same encoding.
Import load() here instead of adding a fifth copy.
"""

import json
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
COMPONENTS_JSON = os.path.join(ROOT, "components.json")


def load(path=COMPONENTS_JSON):
    """Parse and return components.json.

    Raises FileNotFoundError or json.JSONDecodeError on failure - callers
    decide how to report those.
    """
    with open(path, encoding="utf-8") as f:
        return json.load(f)
