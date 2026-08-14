# Publishing `components-skill`

Everything here is automated except the publish itself, which needs npm credentials that intentionally do not exist in CI or in any agent's environment.

## The one manual step

```bash
cd cli
npm adduser              # once per machine; opens a browser to authenticate
npm publish --access public
```

`--access public` is required: the package is unscoped, but passing it explicitly avoids any surprise if the package is ever moved under a scope.

## What runs automatically first

`npm publish` triggers `prepublishOnly`, which will abort the publish if anything is off:

1. **`scripts/check-version-sync.js`** - fails if `cli/package.json`'s `version` disagrees with `components.json`'s `meta.version`. The package embeds a snapshot of the registry, so a version claiming to be 1.2.0 while shipping 1.1.1 data is a lie nobody can spot from outside.
2. **`npm run build`** - regenerates `dist/` from `scripts/build-agent-dirs.sh`, so the published bundles always match the current `SKILL.md` / `components.json` / `references/`.
3. **The test suite** - `add` writes the expected files, `update` refuses to clobber locally-edited ones.

`prepack` runs the build too, so `npm pack` and CI's `npm pack --dry-run` also exercise it.

## Release checklist

1. Land the change and update `components.json`'s `meta.version`.
2. Set `cli/package.json`'s `version` to match.
3. Update the root `CHANGELOG.md`.
4. `cd cli && npm pack --dry-run` - confirm the file list and size look sane (~25 kB, ~36 files).
5. `npm publish --access public`.
6. Verify: `npx components-skill@latest --version` in a clean directory.
7. Tag the repo release as usual.

## Notes

- **Zero dependencies**, by design. `package-lock.json` exists so `npm ci` works in CI, and should stay effectively empty.
- **`dist/` is gitignored** and generated at pack time. Never commit it.
- The name `components-skill` was confirmed available. If it is ever taken, the fallback is a scoped `@anaydhawan/components-skill`, which changes the `--access public` line's significance (scoped packages default to restricted).
- CI (`.github/workflows/cli-ci.yml`) runs the tests and `npm pack --dry-run` on every change under `cli/`. It deliberately never publishes: releases are a human decision.
