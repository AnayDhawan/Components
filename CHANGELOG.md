# Changelog

All notable changes to this project are documented here. Format based on
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/); this project follows
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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

[1.0.0]: https://github.com/AnayDhawan/Components/releases/tag/v1.0.0
