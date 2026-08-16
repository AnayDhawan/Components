# Changelog

All notable changes to this project are documented here. Format based on
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/); this project follows
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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

### Fixed
- `reactbits`' `code_libraries[]` entry still said plain `MIT`; the per-entry
  license fix below only touched the 9 showpiece entries, not this row.

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

[1.1.0]: https://github.com/AnayDhawan/Components/releases/tag/v1.1.0
[1.0.0]: https://github.com/AnayDhawan/Components/releases/tag/v1.0.0
