# Contributing

Thanks for improving **components**. The skill stores *pointers* to live-fetchable components - contributions are almost always *new or updated entries in `components.json`*.

By participating you agree to the [Code of Conduct](./CODE_OF_CONDUCT.md).

## Repo layout

- **`SKILL.md`** - what the agent actually reads: the decision flow and the rules it follows when matching a request to a component.
- **`components.json`** - the registry of pointers. Every entry names a component and how to fetch it live; this is what almost every PR touches.
- **`references/`** - the shared rules that apply to every fetched component: `live-fetch.md` (how to fetch, plus known upstream issues), `adaptation.md` (brand tokens, dark mode, responsive, reduced motion), `dependencies.md`, `handoff.md`.
- **`scripts/`** - maintenance tooling. `validate.py` checks `components.json` and is what CI runs; `health-check.py` pings every ref and library site on a schedule.
- **`.github/`** - issue and PR templates plus the workflows that run the scripts above.

No component source code lives here. The repo stores pointers, and the real code is fetched from upstream at build time.

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
- **`aliases` must be a non-empty list of non-empty strings.** An entry with no aliases is unreachable by description, which is the only way users find it.
- **No alias may be reused across two showpieces.** Aliases drive matching, so a duplicated string makes the match ambiguous and whichever entry sits first silently wins. Compared case- and whitespace-insensitively.
- **`deps` must be a list**, never a bare string. `"motion"` iterates as characters, so anything consuming it installs garbage; write `["motion"]`.
- **`library` must be listed in `code_libraries[]`** (add it there if new, with registry pattern + license). Showpieces only - `fallback_basic` points at shadcn/tremor on purpose and is exempt.
- **`license` is required**, and must be a real license, not a placeholder. `TBD`, `todo`, `verify`, `unknown`, `n/a`, `none`, `?` and empty strings are rejected: a license field that is present but says nothing passes a required-field check while leaving the legal status just as unknown. Verify it (Aceternity = free/verify, 21st.dev = per-component).
- **Galleries are not sources.** Dribbble / godly.website / Awwwards go in `galleries_visual_ref_only[]` - visual reference only, never `ref`.
- **Adaptation is mandatory** at use time (brand tokens + `prefers-reduced-motion`); see `references/adaptation.md`.
- Keep scope React + Tailwind. Other stacks need a separate discussion (open an issue).

Plain (non-flashy) components go in `fallback_basic.components[]` with just `name`, `aliases`, `ref`, `library`, `license`.

## Before you open a PR

- Run `python3 scripts/validate.py` locally before opening a PR. It is the exact check CI runs, and it prints every problem it finds rather than stopping at the first.
- `components.json` is valid JSON (`validate.py` checks this, as does CI - see `.github/workflows/validate.yml`).
- Every `ref` link/command resolves and works on a fresh project. **PRs touching `components.json` run a real Vite + Tailwind smoke test**: CI scaffolds a throwaway React + TS project, runs the registry command for a curated sample (one entry per library), and fails if the fetched code does not build. Run it yourself with `node scripts/smoke-test.mjs --only <entry-name>`.
- New component genuinely lacks a good existing entry (no duplicates by alias).
- Fill out the PR template.

## Workflow

1. Fork + branch (`feat/<component>` or `fix/<entry>-link`).
2. Make your change to `components.json` (and `references/` if adding a shared rule).
3. Run `python3 scripts/validate.py`.
4. Open a PR using the template. Link any related issue.

## Maintenance / removal

Quarterly review prunes entries with broken sources or no use for 2 quarters. Flagging a dead link is a valid, welcome PR.
