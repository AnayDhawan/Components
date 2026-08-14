# Live Fetch - how to pull a showpiece component at build time

The skill stores *pointers*, not code. The real component is fetched when you build, so it stays current. Three methods, most→least reliable.

## 1. Registry CLI (preferred)

Most code libraries publish a shadcn registry. Run the entry's `ref` - always the full registry URL form, not the namespaced short form (`@aceternity/<name>` etc. requires the namespace to be pre-registered in the user's project `components.json`, which fails cold on a fresh project - see [#14](https://github.com/AnayDhawan/Components/issues/14)):

```bash
npx shadcn@latest add "https://ui.aceternity.com/registry/macbook-scroll.json"
npx shadcn@latest add "https://magicui.design/r/marquee.json"
npx shadcn@latest add "https://www.cult-ui.com/r/<name>.json"
# community registry by full URL:
npx shadcn@latest add "https://21st.dev/r/<author>/<name>"
```

- Resolves files + registry deps automatically into the project's components dir.
- **Show the user the command first** - it writes files and may install packages.
- Requires the project to be shadcn-initialised (`components.json` at project root, `cn()` util). If not, run `npx shadcn@latest init` first.
- If a URL 404s, the library may have renamed the slug - open the library `site`, copy the current command, retry.

## 2. WebFetch the component page (fallback)

When there's no registry, or you only need to read code:

1. `WebFetch` the component's docs page (the `site` + component slug).
2. Extract the code block(s) - usually a single `.tsx` plus a Tailwind snippet.
3. Write the file(s) into the project; install the `deps` listed in the entry.
4. Wire any required Tailwind config (keyframes/animations some components need).

Limit: JS-heavy pages may hide code behind tabs; WebFetch (markdown conversion) can miss it. Then use method 3.

## 3. Playwright (last resort)

Use the `playwright` skill to open the page, click the code tab / copy button, and read the rendered source. Heavier; only when WebFetch fails to surface the code.

## Known registry issues

Upstream registries break in ways that are not this repo's data going stale. The
entries below stay in `components.json` as-is (this repo is pointer-only and never
vendors code); this section records the workaround so an agent hitting the failure
knows it is expected and what to do instead.

### cult-ui.com: HTTP 429 to every non-browser client (since ~2026-07-31)

All six cult-ui showpieces plus the docs site return **HTTP 429** to `npx shadcn`,
`curl`, and WebFetch. It is **not** rate limiting and the components are **not**
gone: the body is a `Vercel Security Checkpoint` page, i.e. Vercel's Attack
Challenge Mode is enabled on the domain, and it answers every client that cannot
run its JS challenge with a 429. Verified 2026-08-14 from multiple IPs, and
verified that a **real browser passes the challenge and receives valid
registry-item JSON**.

- Method 1 (registry CLI) and method 2 (WebFetch) both fail. Do not retry them; the
  429 is not transient and backing off will not clear it.
- **Use method 3 (Playwright).** A real browser clears the checkpoint, so open the
  `ref` URL directly and read the returned registry JSON, then write the `files[]`
  entries into the project and install `dependencies[]` by hand.
- `scripts/health-check.py` will keep reporting these six as `rate-limited` until
  the domain's challenge mode is turned off. That is a known false alarm, not rot.
- Re-check periodically: if `curl -sI https://www.cult-ui.com/r/dynamic-island.json`
  returns 200, the challenge is off and this note should be deleted.

Tracked in [#31](https://github.com/AnayDhawan/Components/issues/31).

## After fetching (always)

- Install deps: most need `motion` (framer-motion). Note: many libs migrated import from `framer-motion` to `motion/react` - match what the fetched code imports. See `references/dependencies.md` for the full React/Tailwind/shadcn CLI/peer-dep version matrix.
- Tailwind: some components need custom keyframes/animation in `tailwind.config` - the registry adds these automatically; manual copy does not, so add them.
- Adapt: brand tokens + `prefers-reduced-motion` + responsive (see `adaptation.md`).
- Verify: component compiles and renders in the live app before handing off.

## Safety

- Registry installs execute package installs and write code. Show the command, prefer official registry URLs (`magicui.design`, `ui.aceternity.com`, `cult-ui.com`, `reactbits.dev`, `kokonutui.com`) - every first-party host in `components.json`'s `code_libraries[]`.
- Treat arbitrary `https://<unknown>/r/...` registry URLs as untrusted - review the source before running.
- Verify license for anything that will ship publicly (21st.dev is per-component).
