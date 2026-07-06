# Contributing

Thanks for improving **components**. The skill stores *pointers* to live-fetchable components - contributions are almost always *new or updated entries in `components.json`*.

By participating you agree to the [Code of Conduct](./CODE_OF_CONDUCT.md).

## Add a showpiece entry (the main thing)

1. Find a distinctive/animated component with a **proven, maintained, clearly-licensed** React + Tailwind source that is **live-fetchable** (registry command preferred). Code libraries: Aceternity, Magic UI, Cult UI, ReactBits, 21st.dev.
2. Add an object to `showpiece[]` in `components.json`:

```jsonc
{
  "name": "kebab-case-name",          // unique
  "aliases": ["laptop opening", "..."], // how a user might DESCRIBE the effect - drives matching
  "effect": "one-line description of what it does",
  "library": "aceternity",            // must exist in code_libraries[]
  "ref": "npx shadcn@latest add \"https://ui.aceternity.com/registry/<name>.json\"",  // the live-fetch command - REQUIRED, full registry URL (not namespaced shorthand, see #14)
  "license": "MIT",                   // upstream license - REQUIRED
  "deps": ["motion"]                  // peer deps to install (framer-motion, cobe, ...)
}
```

### Rules

- **`ref` must fetch live** - a registry command (preferred) or a resolvable component-page URL. No pasted code in this repo.
- **`ref` must use the full registry URL form**, not a namespaced shorthand (`@aceternity/<name>` etc.) - shorthand requires the namespace pre-registered in the user's project `components.json` and fails cold on a fresh project.
- **`aliases` are the match surface** - list how users phrase the effect, not just the canonical name.
- **`library` must be listed in `code_libraries[]`** (add it there if new, with registry pattern + license).
- **`license` is required.** Verify it (Aceternity = free/verify, 21st.dev = per-component).
- **Galleries are not sources.** Dribbble / godly.website / Awwwards go in `galleries_visual_ref_only[]` - visual reference only, never `ref`.
- **Adaptation is mandatory** at use time (brand tokens + `prefers-reduced-motion`); see `references/adaptation.md`.
- Keep scope React + Tailwind. Other stacks need a separate discussion (open an issue).

Plain (non-flashy) components go in `fallback_basic.components[]` with just `name`, `aliases`, `ref`, `library`, `license`.

## Before you open a PR

- `components.json` is valid JSON (CI checks this - see `.github/workflows/validate.yml`).
- Every `source.ref` link/command resolves and works on a fresh project.
- New component genuinely lacks a good existing entry (no duplicates by alias).
- Fill out the PR template.

## Workflow

1. Fork + branch (`feat/<component>` or `fix/<entry>-link`).
2. Make your change to `components.json` (and `references/` if adding a shared rule).
3. Run a JSON lint locally (e.g. `python -m json.tool components.json > /dev/null`).
4. Open a PR using the template. Link any related issue.

## Maintenance / removal

Quarterly review prunes entries with broken sources or no use for 2 quarters. Flagging a dead link is a valid, welcome PR.
