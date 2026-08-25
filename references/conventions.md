# Per-entry file-path and export-shape conventions

Fetched components land in a different path, and export differently, per
library. None of this is visible from `components.json` itself - you'd
otherwise have to fetch first just to find out. Verified by hand
(`node scripts/smoke-test.mjs --only <name> --keep`, then inspecting the
kept temp project) against a real fetch per library, 2026-08-25.

| Library | Path (from a fresh project's `src/`) | Export |
|---|---|---|
| aceternity | `components/ui/<kebab-name>.tsx` | named (`export function <PascalCase>`) |
| magicui | `components/ui/<kebab-name>.tsx` | named (`export function <PascalCase>`) |
| reactbits | `components/<PascalCase>.tsx` (root of `components/`, no subfolder) | default (`export default <PascalCase>`) |
| 21st.dev (kokonutui mirror) | `components/kokonutui/<kebab-name>.tsx` | default (`export default <PascalCase>`) |
| cult-ui | unverified - the registry is challenge-blocked for automated fetches ([#31](https://github.com/AnayDhawan/Components/issues/31)); confirm by hand via the Playwright method in `references/live-fetch.md` before relying on a path/export assumption |

Notes:

- **aceternity and magicui share `components/ui/`** - the same directory
  shadcn's own components land in. A component from either library can collide
  on filename with a plain shadcn component of the same name; there is no
  namespacing.
- **reactbits drops the `ui/` nesting entirely** and uses the registry item's
  own PascalCase name as the filename directly under `components/`.
- **21st.dev entries fetched via the kokonutui mirror get their own
  `kokonutui/` subfolder** - distinct from both patterns above.
- Import accordingly: `import BlurText from "@/components/BlurText"` (default,
  reactbits) vs `import { Marquee } from "@/components/ui/marquee"` (named,
  magicui/aceternity) vs `import MatrixText from "@/components/kokonutui/matrix-text"`
  (default, 21st.dev/kokonutui).
- This table covers the five `code_libraries[]` entries as fetched today.
  Registries can restructure their output without warning - if a library
  changes its layout, re-verify with the command above and update this file.
