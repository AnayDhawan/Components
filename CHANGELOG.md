# Changelog

All notable changes to this project are documented here. Format based on
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/); this project aims to
follow [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Planned
- Dogfood on real React + Tailwind sites; confirm live-fetch + registry commands resolve.
- Demo: hero GIF + hosted gallery; vendored-snapshot fallback; curate Cult UI / ReactBits / 21st.dev.
- See the [open issues](https://github.com/AnayDhawan/components/issues) for the full v1.0.0 → v2.0.0 roadmap.

## [0.4.0] - 2026-06-18

First public release. Jump from 0.2.0 covers repo extraction + presentation + attribution
(no 0.3.0 was tagged).

### Added
- Extracted into a standalone public repo with the skill payload (`SKILL.md`, `components.json`,
  `references/`) shipped alongside the community/meta files — the README install command now works.
- `ATTRIBUTION.md` crediting every upstream library + license link; resolved the Aceternity
  "free for personal + commercial" license and flagged 21st.dev as per-component verify.
- Impeccable-style README: tagline, quick start, "Why", rendered showpiece + fallback tables,
  usage examples, sources & licenses, supported tools, community.
- `SKILL.md` troubleshooting section (fetch-fail recovery: registry → WebFetch → Playwright →
  graceful fallback) + snapshot note.

### Changed
- `components.json` bumped to `0.4.0` (2026-06-18).

## [0.2.0] - 2026-06-14

### Changed (scope pivot)
- **Primary purpose is now live-fetch of flashy showpiece components**, not curated plain ones. The user wants distinctive animated components (laptop-open-on-scroll, 3D card, beams, globe) pulled live at build time from code libraries.
- `components.json` restructured: `code_libraries`, `galleries_visual_ref_only`, `showpiece` index (~18 effects), and `fallback_basic` (the original 12).
- `SKILL.md` rewritten around the live-fetch decision flow + registry-CLI/WebFetch/Playwright methods.

### Added
- `references/live-fetch.md` — registry CLI, WebFetch, and Playwright fetch methods + safety.
- Motion section in `references/adaptation.md` (prefers-reduced-motion, one-showpiece-per-view, perf).
- Showpiece sources: Aceternity, Magic UI, Cult UI, ReactBits, 21st.dev (with registry command patterns + licenses).

### Clarified
- Inspiration galleries (Dribbble, godly.website, Awwwards) are **visual reference only** — they contain no code and are never fetched from.

## [0.1.0] - 2026-06-14

### Added
- Initial `components` Claude Code skill.
- `SKILL.md` with trigger, decision logic, and handoff to quality skills.
- `components.json` with 12 curated React + Tailwind component entries
  (button, navbar, hero, pricing-table, feature-grid, form, modal, tabs,
  data-table, dashboard-stat-cards, toast, empty-state).
- `references/adaptation.md` shared brand-token / dark-mode / responsive / a11y rules.
- OSS scaffolding: README, MIT LICENSE, CONTRIBUTING, CODE_OF_CONDUCT, SECURITY,
  `.github/` issue + PR templates, dependabot, and a JSON-validation workflow.

[Unreleased]: https://github.com/AnayDhawan/components/compare/v0.4.0...HEAD
[0.4.0]: https://github.com/AnayDhawan/components/releases/tag/v0.4.0
[0.2.0]: https://github.com/AnayDhawan/components/releases/tag/v0.2.0
[0.1.0]: https://github.com/AnayDhawan/components/releases/tag/v0.1.0
