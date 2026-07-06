# Changelog

All notable changes to this project are documented here. Format based on
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/); this project follows
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.4.2] - 2026-07-06

### Fixed
- All Magic UI, Aceternity, and Cult UI `ref` commands now use the full registry URL form
  instead of the namespaced shorthand (`@aceternity/<name>`), which requires the namespace
  to be pre-registered in the user's `components.json` and can fail to resolve on a fresh
  shadcn project ([#14](https://github.com/AnayDhawan/Components/issues/14)).
- Resolved the Aceternity license marker: replaced the `free (verify)` placeholder with the
  confirmed Aceternity License terms (free to use in end products, no redistribution of the
  component/source itself), verified against ui.aceternity.com/licence
  ([#8](https://github.com/AnayDhawan/Components/issues/8)).

### Added
- `references/handoff.md` documenting the `impeccable`/`frontend-design` polish handoff as
  optional, with explicit graceful-degradation behavior when neither is installed
  ([#10](https://github.com/AnayDhawan/Components/issues/10)).

[0.4.2]: https://github.com/AnayDhawan/Components/releases/tag/v0.4.2
