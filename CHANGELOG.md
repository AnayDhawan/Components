# Changelog

All notable changes to this project are documented here. Format based on
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/); this project follows
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Multi-framework rollout, completing #13's pilot (#55). 31 framework variants across
  three new sources, every one verified individually rather than mapped by pattern:
  - **Svelte**, via **Svelte Bits** (official ReactBits port, same author): all 9
    ReactBits entries.
  - **Vue**, via **Vue Bits**: the 8 remaining ReactBits entries, joining the
    `split-text` pilot.
  - **Vue**, via **Inspira UI** (MIT; its README records Aceternity's permission to
    adapt the designs): 4 of 9 Aceternity entries and all 9 Magic UI entries. The
    Magic UI half was not in #55's plan, which recorded no viable Vue path for that
    library; Inspira UI ports both, so the same verification pass covered both.
- Structured `fetch` object (`method`, `cli`, `url`) on every showpiece entry and
  framework variant (#47). `ref` stays as the human- and agent-facing command string,
  but `smoke-test.mjs`, `health-check.py` and `gallery/scripts/fetch-showpieces.mjs`
  now read named fields instead of each re-deriving a URL and CLI by regex, and
  `validate.py` fails the build if the two ever disagree.
- `health-check.py` probes framework-variant refs. They point at entirely different
  registries, so a healthy React ref said nothing about them; with 31 variants that
  was a blind spot the size of the rollout.

### Changed
- `smoke-test.mjs` installs an entry's declared `deps` before building, so `deps` is
  now proven rather than asserted. Inspira UI forced this: every component imports
  `@inspira-ui/plugins` for `cn()` and its registry items declare no dependencies at
  all, so the build fails without the curated entry. Package names are validated
  against a strict pattern first, since `deps` is contributor-editable data on a job
  that runs on `pull_request`.
- A declared dep absent from the registry's own `dependencies` no longer warns as
  drift. Now that the build installs and compiles it, its presence is proven
  necessary; only deps that could not be installed as written (free-text like
  `"varies per component"`) are reported as unverifiable.
- `--diff` selects entries whose `fetch` **or** `deps` changed, not just `ref`, since
  a dep change now changes what the job proves.
- A framework variant whose project setup does not exist yet (`svelte`) reports SKIP
  before installing anything, instead of being built in the wrong framework's
  template and failing for an unrelated reason.

## [1.2.0] - 2026-08-30

### Added
- `components-skill search <query>`: offline lookup of showpiece/fallback entries by
  name, alias, effect, or library, plus `--library` to narrow it. Reads the same
  bundled `components.json` as `add` (#11).
- `component-smoke-test.yml` now also smoke-tests the showpiece entries a PR itself
  adds or changes (`scripts/smoke-test.mjs --diff`), not just the fixed curated
  sample, and posts the combined results as a sticky PR comment instead of leaving
  them in the CI log only (#12).
- Multi-framework pilot (#13): showpiece entries may now carry an optional
  `frameworks` object for a non-React port of the same effect. One real entry,
  `split-text` -> `frameworks.vue` -> Vue Bits' `SplitText`, verified end-to-end
  (live `npx shadcn-vue@latest add`, real `vue-tsc -b && vite build`).
  `validate.py` and `scripts/smoke-test.mjs --framework <name>` both understand
  the new field; the weekly schedule run smoke-tests the pilot entry. Still a
  React + Tailwind registry otherwise - see README "Framework variants".

- `scripts/health-check.py`: HEAD requests instead of full GETs where possible, per-host
  concurrency instead of one fixed delay serializing all 45+ targets (#36). A 429's body
  is now sniffed for Vercel's Attack Challenge Mode markers and reported as its own
  `challenged` status, distinct from a real `rate-limited` (#34). 21st.dev page-fetch
  entries' hand-typed URLs are now auto-derived from the registry's own 403 body and
  diffed against what's stored (#40).
- `components.json`'s new `known_issues[]` array centralizes the cult-ui workaround that
  `health-check.py`, `smoke-test.mjs`, and `gallery/scripts/fetch-showpieces.mjs` each used
  to hand-maintain separately (#45).
- `scripts/smoke-test.mjs`: TS strictness relaxation scoped to only the entries that need
  it instead of repo-wide (#44). Declared `deps` are now cross-checked against the
  registry item's own `dependencies` array as a soft warning (#53).
- `.github/`: `CODEOWNERS` + path-based PR auto-labeling (#51). CI guard on `docs/media`
  binary size (#42).
- `references/adaptation.md`: explicit checklist, leading with `prefers-reduced-motion`
  (#43). New `references/conventions.md` documents per-library fetched file-path and
  export-shape conventions, verified against a real fetch per library (#48).
- 3 showpiece aliases sharpened where token-overlap analysis found genuine matching
  ambiguity, not just shared generic words (#39).
- **Layout browsing layer**: new `layouts[]` array composing existing `showpiece[]` entries (or, for
  video, patterns proven in the separate `vidstudio`/`openvidstudio` pipeline) into full page/scene
  arrangements an agent can browse and pick, instead of one effect at a time. Two web layouts, five video
  layouts. `TASTE.md` (new, repo root) is the required-reading curation standard for picking or composing
  one, with a pointer table to compatible third-party Claude Code skills - no third-party content
  reproduced, pointer-only. Wired into `gallery/` as a new "Layouts" tab alongside the existing showpiece
  grid, and into every `dist/` agent bundle via `scripts/build-agent-dirs.sh`.

### Fixed
- `code_libraries[]`'s `reactbits` entry still declared plain `MIT`; the earlier per-entry license
  correction only touched the 9 showpiece entries, not this row (closed alongside the multi-framework
  pilot work).

## [1.1.1] - 2026-07-31

### Fixed
- LICENSE: stripped a stray trailing note that broke GitHub's license auto-detector
  (was showing "Other" instead of Apache-2.0); the info already lives in
  ATTRIBUTION.md/README.
- `validate.yml` only checked `name` and `ref` on `fallback_basic` entries, so a
  fallback could ship with no license and pass CI; both arrays now get the same
  required-field check (#26).
- `validate.yml` never checked an entry's `library` against `code_libraries[]`, so a
  typo like `aceternety` passed silently. Showpieces are now checked; fallbacks stay
  exempt, since `shadcn`/`tremor` are deliberately not `code_libraries` entries (#27).
- `new_component.yml`'s library dropdown offered 4 options and was missing Magic UI,
  Cult UI, ReactBits and 21st.dev, forcing the common case into "other" (#24).
- `bug_report.yml` referenced `adapt_rules`, a field the flat schema no longer has (#25).
- `SECURITY.md` still declared `v0.x` as the supported line (#22).

### Added
- SKILL.md: explicit Limitations section (stack constraints, no vendoring, per-source
  license verification, design-quality handoff).
- README: link SECURITY.md from the contributing section, add stars/last-commit badges.
- `.editorconfig` (flagged optional in OSS audits).
- README: PowerShell install commands alongside the bash ones (#28).
- `references/live-fetch.md`: `reactbits.dev` and `kokonutui.com` added to the official
  registry allowlist; both are first-party hosts in `code_libraries[]` (#29).

### Changed
- README demo refreshed to the current workflow clip, with the source mp4 alongside it.

## [1.1.0] - 2026-07-20

### Added
- **ReactBits `splash-cursor`** showpiece entry: interactive WebGL fluid-simulation that
  splashes flowing color trails following the cursor. Self-contained WebGL2, zero npm deps,
  MIT. Registry: `npx shadcn@latest add "https://reactbits.dev/r/SplashCursor-TS-TW"`.

### Changed
- CI: bump `actions/checkout` from v6 to v7
  ([#15](https://github.com/AnayDhawan/Components/pull/15)).

## [1.0.0] - 2026-07-16

All five wired source libraries are now curated - the v1.0.0 milestone. The registry grows
from 18 to 38 showpiece entries, every one with a verified fetch path, license, and exact
dependency list.

### Added
- **ReactBits curation** (8 entries): split-text, blur-text, decrypted-text, count-up,
  aurora, particles-webgl, hyperspeed, letter-glitch
  ([#6](https://github.com/AnayDhawan/Components/issues/6)).
- **Cult UI curation** (6 entries): dynamic-island, shader-lens-blur, canvas-fractal-grid,
  texture-card, typewriter, animated-number
  ([#5](https://github.com/AnayDhawan/Components/issues/5)).
- **21st.dev curation + per-component license tracking** (6 entries): shape-landing-hero,
  matrix-text, beams-background, background-paths, v0-ai-chat (KokonutUI), and
  cobe-globe-interactive (shuding). 21st.dev has no blanket license, so each entry carries
  its own license verified against the upstream source repo
  ([#7](https://github.com/AnayDhawan/Components/issues/7)).
- KokonutUI and cobe upstream attribution rows in `ATTRIBUTION.md`.

### Changed
- ReactBits source row corrected: ReactBits now ships a shadcn registry
  (`reactbits.dev/r/<Name>-TS-TW`), replacing the stale jsrepo-only note. Invalid names
  return HTTP 200 HTML, so validation checks the response body, not the status code.
- 21st.dev source row documents that the registry endpoint now requires an account/API key;
  curated entries use the author's open registry mirror (kokonutui.com) or the public
  component page via WebFetch/Playwright.

[1.2.0]: https://github.com/AnayDhawan/Components/releases/tag/v1.2.0
[1.1.0]: https://github.com/AnayDhawan/Components/releases/tag/v1.1.0
[1.0.0]: https://github.com/AnayDhawan/Components/releases/tag/v1.0.0
