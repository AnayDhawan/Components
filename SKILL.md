---
name: components
description: Use when building a frontend and the user wants a distinctive / animated / "wow" UI element in React + Tailwind - e.g. a laptop-opening-on-scroll, 3D tilt card, spotlight hero, animated beams/background, marquee, bento grid, interactive globe, meteor/particle background, shimmer button, or scroll/reveal motion. Fetches the showpiece component LIVE at build time from code libraries (Aceternity, Magic UI, Cult UI, ReactBits, 21st.dev) via their shadcn registry command (or WebFetch fallback), then adapts it to brand tokens. Also covers plain components (button, form, modal, table, etc.) as a fallback. Triggers on "make it pop", "something flashy", "animated [X]", "like [cool site]", "build a [showpiece] section". NOT for non-React stacks. Inspiration galleries (Dribbble/godly) are visual reference only - never code.
---

# components

**Fetch flashy, proven, animated React+Tailwind components LIVE from code libraries instead of hand-writing complex motion.** User describes an effect → match it → pull the real component at build time → adapt to brand.

## What this is

- **PRIMARY: showpiece live-fetch.** Distinctive/animated components (laptop scroll, 3D card, beams, globe, marquee...) fetched live from code libraries via registry CLI / WebFetch.
- **FALLBACK: plain components.** Standard button/form/modal/table when no "wow" is asked.
- **SOURCE layer only.** After placing the component, hand off final polish/distinctiveness to `impeccable` / `frontend-design`.
- **Galleries ≠ code.** Dribbble, godly.website, Awwwards = visual reference ONLY. Never fetch components from them.

## Decision flow

```
user wants a UI component (React + Tailwind)?
├─ is it a distinctive / animated / "wow" effect?
│   ├─ YES (primary path):
│   │   1. match the described effect → showpiece[] entry (name or aliases)
│   │   2. no direct match → search code_libraries[] live for the effect
│   │      (WebFetch the library's components page, find the closest)
│   │   3. FETCH LIVE (see references/live-fetch.md):
│   │      - preferred: run the entry's `ref` registry command
│   │        e.g. `npx shadcn@latest add "https://ui.aceternity.com/registry/macbook-scroll.json"`
│   │      - fallback: WebFetch / Playwright the page, extract the code
│   │   4. install listed `deps` (usually `motion` = framer-motion)
│   │   5. ADAPT: brand tokens + prefers-reduced-motion + responsive
│   │      (references/adaptation.md)
│   │   6. hand off polish → impeccable / frontend-design
│   └─ NO → fallback_basic[]: standard component, adapt to tokens.
```

## How to fetch live

1. Read `components.json`. Find the `showpiece` entry by name/alias, else pick a `code_libraries` source and search it live.
2. **Show the user the registry command before running it** (it pulls code into their project).
3. Run `ref`. If the registry shorthand fails (library changed it), open the `site` page, confirm the current command, retry. Last resort: WebFetch the page and write the code manually.
4. Install `deps`. Most need `motion` (framer-motion). 3D globe needs `cobe`; wavy bg needs `simplex-noise`.
5. Adapt (mandatory - never raw): map demo colors to brand tokens, wrap motion in `prefers-reduced-motion`, check mobile.
6. Verify it compiles + renders, then hand off to a quality skill.

## Rules

- **Live-fetch from code libraries only.** `showpiece` + `code_libraries` are curated *pointers*; the actual code is fetched at build time so it stays current.
- **Galleries are visual-ref only** - no code lives there.
- **Never paste raw.** Adapt tokens + motion + responsive every time.
- **Respect motion accessibility.** Every animated component honors `prefers-reduced-motion`.
- **Check license per source.** Magic UI / Cult UI / ReactBits = MIT. Aceternity = free personal+commercial (verify). 21st.dev = per-component, verify before shipping.
- **Safety:** registry commands run code installs - show the command, prefer official namespaces, don't blindly run unknown-registry URLs.

## Troubleshooting (fetch failed?)

Registries change. Recover in this order - never leave the user stuck:

1. **Command 404 / "unknown registry"** → open the entry's `site` page, confirm the current command, retry. Make sure `shadcn@latest` is used (not an old pinned version).
2. **Still failing** → WebFetch the component's docs page, extract the code block, write the file(s) manually, install the listed `deps`.
3. **Code is behind JS/tabs** → use the `playwright` skill to read the rendered code panel.
4. **Network/registry down** → fall back to the closest `fallback_basic` entry or a hand-composed version, and tell the user the showpiece source is unreachable. Do not block the build on a dead registry.

> **No vendoring, by design:** `components` ships pointers only and never bundles upstream code, so when an upstream is unreachable the showpiece is temporarily unavailable. Degrade gracefully per step 4 (closest `fallback_basic`, or hand-compose) rather than erroring out. Staying pointer-only keeps the skill permanently clear of any redistribution licensing.

## Maintenance

`showpiece`/`code_libraries` are pointers, so they rot slowly. Quarterly: confirm registry namespaces + library sites still resolve. Update `ref` patterns if a library changes its CLI. See `CONTRIBUTING.md`.
