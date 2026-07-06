# Dependency version matrix

`components` has no build or test pipeline of its own - it only emits pointers, fetched live
by the shadcn CLI at build time. So "tested" here means: verified against each package's
current published version and peer-dependency declarations on npm, not an automated
compatibility suite run by this repo. Re-check at major bumps of React, Tailwind, or shadcn.

| Dependency | Required by | Minimum / verified version | Notes |
|------------|-------------|-----------------------------|-------|
| shadcn CLI | every `ref` command | `shadcn@latest` (currently v4.x) | Always use `@latest`, never pin an old major - the CLI detects your project's Tailwind version and adapts the generated file accordingly. |
| React | every showpiece | 18.0+ (19.x also supported) | Matches `motion`'s peer range (`^18.0.0 \|\| ^19.0.0`). |
| Tailwind CSS | every showpiece | 3.4+ or 4.x | The shadcn CLI detects your installed Tailwind major and writes Tailwind-version-appropriate output; no manual config needed on your end. |
| `motion` (was `framer-motion`) | most showpieces | 11.0+ (verified against 12.x current) | Renamed from `framer-motion` to `motion` in 2024. Install `motion`; if fetched code still imports from the old `framer-motion` path, update the import to `motion/react` (see `references/live-fetch.md`). |
| `cobe` | `globe` (magicui) | 0.6+ (verified against 2.x current) | WebGL globe renderer, no React-version coupling of its own. |
| `simplex-noise` | `wavy-background` (aceternity) | 3.0+ (verified against 4.x current) | ESM-only since v3. If your project is CommonJS-only, pin to `2.x` or convert the import to ESM. |

## How this was verified

Checked each package's `latest` dist-tag on the npm registry and its declared
`peerDependencies` on 2026-07-06, plus the shadcn CLI's current major version. This is a
point-in-time compatibility baseline, not a CI-enforced test matrix - `components` ships
markdown and a JSON pointer file, so there is nothing here to run in CI against real
component code.
