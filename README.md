# components

> **Showpiece UI for AI coding agents.** Describe a *wow* effect - a laptop opening on scroll, a 3D tilt card, animated beams, a spinning globe - and your agent fetches the **real component live** from the best React + Tailwind libraries (Aceternity, Magic UI, Cult UI, ReactBits, 21st.dev) and adapts it to your brand tokens. 1 skill · 18 showpiece effects · 12 plain fallbacks · 5 source libraries.

[![License: Apache-2.0](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](./LICENSE)
![Stack](https://img.shields.io/badge/stack-React%20%2B%20Tailwind-38bdf8)
![Status](https://img.shields.io/badge/status-v0.4.0-brightgreen)
![Skill](https://img.shields.io/badge/Claude%20Code-skill-8a5cf6)

![A macbook-scroll showpiece, fetched live and adapted to brand tokens](docs/media/demo.gif)

*A stylized motion-graphics demo of the workflow, not an actual recorded run. A real captured session will replace it in a later release.*

## Quick start

```bash
# clone, then drop the skill into your project (or ~/.claude for global)
git clone https://github.com/AnayDhawan/components
mkdir -p <your-project>/.claude/skills/components
cp -r components/SKILL.md components/components.json components/references \
      <your-project>/.claude/skills/components/
```

Then just ask your agent: *"add a macbook-scroll hero"* or *"put an interactive globe in the contact section."* It matches the effect, runs the library's registry command live, installs the deps, and adapts the result to your tokens.

## Why components

Anthropic's `frontend-design` skill makes an agent design *well*. It does **not** hand you a scroll-driven 3D MacBook or a WebGL globe - that motion is slow and bug-prone to hand-write, and copy-pasting from a docs site goes stale and skips attribution.

`components` is a **sourcing** skill. It answers one question - *"which proven showpiece fits, and how do I make it on-brand?"* - by pulling the real, maintained component **live at build time**, then handing final polish to a quality skill (`impeccable` / `frontend-design`). It curates *pointers*, not stale copies, so the code is always current and the upstream license travels with it.

## What's included

### The skill
`SKILL.md` (decision flow + rules) · `components.json` (the registry of pointers) · `references/live-fetch.md` (registry-CLI / WebFetch / Playwright methods) · `references/adaptation.md` (brand tokens, dark mode, responsive, `prefers-reduced-motion`) · `references/handoff.md` (optional `impeccable` / `frontend-design` polish handoff + graceful degradation when neither is installed).

### Showpiece effects (live-fetched)

| Effect | Library | Command | License |
|--------|---------|---------|---------|
| MacBook lid opens on scroll | aceternity | `npx shadcn@latest add "https://ui.aceternity.com/registry/macbook-scroll.json"` | free¹ |
| 3D tilt card (cursor depth) | aceternity | `npx shadcn@latest add "https://ui.aceternity.com/registry/3d-card.json"` | free¹ |
| Cursor / hero spotlight glow | aceternity | `npx shadcn@latest add "https://ui.aceternity.com/registry/spotlight.json"` | free¹ |
| Animated SVG background beams | aceternity | `npx shadcn@latest add "https://ui.aceternity.com/registry/background-beams.json"` | free¹ |
| Conic lamp glow heading | aceternity | `npx shadcn@latest add "https://ui.aceternity.com/registry/lamp.json"` | free¹ |
| Flowing wavy background | aceternity | `npx shadcn@latest add "https://ui.aceternity.com/registry/wavy-background.json"` | free¹ |
| Infinite looping cards | aceternity | `npx shadcn@latest add "https://ui.aceternity.com/registry/infinite-moving-cards.json"` | free¹ |
| Staggered text reveal | aceternity | `npx shadcn@latest add "https://ui.aceternity.com/registry/text-generate-effect.json"` | free¹ |
| Grid hover spotlight | aceternity | `npx shadcn@latest add "https://ui.aceternity.com/registry/card-hover-effect.json"` | free¹ |
| Beam between nodes | magicui | `npx shadcn@latest add "https://magicui.design/r/animated-beam.json"` | MIT |
| Logo / ticker marquee | magicui | `npx shadcn@latest add "https://magicui.design/r/marquee.json"` | MIT |
| Asymmetric bento grid | magicui | `npx shadcn@latest add "https://magicui.design/r/bento-grid.json"` | MIT |
| Interactive WebGL globe | magicui | `npx shadcn@latest add "https://magicui.design/r/globe.json"` | MIT |
| Meteor-shower background | magicui | `npx shadcn@latest add "https://magicui.design/r/meteors.json"` | MIT |
| Shimmer CTA button | magicui | `npx shadcn@latest add "https://magicui.design/r/shimmer-button.json"` | MIT |
| macOS magnify dock | magicui | `npx shadcn@latest add "https://magicui.design/r/dock.json"` | MIT |
| Shiny sweeping text | magicui | `npx shadcn@latest add "https://magicui.design/r/animated-shiny-text.json"` | MIT |
| Interactive particle field | magicui | `npx shadcn@latest add "https://magicui.design/r/particles.json"` | MIT |

¹ Aceternity is free for personal **and** commercial use - see [Sources & licenses](#sources--licenses). Cult UI / ReactBits / 21st.dev are wired as sources and curated on demand (see the [issues](https://github.com/AnayDhawan/components/issues)). Full registry URLs are used (not the namespaced short form) so a fresh shadcn project can fetch a showpiece with no extra registry config - see [#14](https://github.com/AnayDhawan/Components/issues/14).

### Plain fallbacks (when no *wow* is needed)
`button · navbar · hero · pricing-table · feature-grid · form · modal · tabs · data-table · dashboard-stat-cards · toast · empty-state` - standard shadcn/ui, Tremor for data.

### Anti-patterns (the skill enforces these)
- **Never raw-paste.** Always adapt colors to brand tokens, wrap motion in `prefers-reduced-motion`, check mobile.
- **Galleries are visual-reference only.** Dribbble / godly.website / Awwwards contain no code and are never fetched from.
- **One showpiece per viewport.** Showpieces are seasoning, not the meal.

## Installation

`components` is a [Claude Code](https://docs.claude.com/en/docs/claude-code) skill (markdown + a JSON registry - no executable code of its own). Copy the payload into a skills directory:

```bash
# project-scoped
mkdir -p <your-project>/.claude/skills/components
cp -r SKILL.md components.json references <your-project>/.claude/skills/components/

# or global, for every project
mkdir -p ~/.claude/skills/components
cp -r SKILL.md components.json references ~/.claude/skills/components/
```

The agent auto-discovers it from the `description` in `SKILL.md`. It needs **network access** at build time (to fetch live) and a **shadcn-initialised React + Tailwind** project to install into.

## Usage

```
"make the hero pop - laptop opening as you scroll"   → aceternity/macbook-scroll
"animated beams behind the features section"         → aceternity/background-beams
"interactive globe near the contact form"            → magicui/globe
"marquee of customer logos"                          → magicui/marquee
"just a normal contact form"                         → fallback: shadcn form
```

## Sources & licenses

| Library | License | Notes |
|---------|---------|-------|
| [Aceternity UI](https://ui.aceternity.com) | Free for personal + commercial ([licence](https://ui.aceternity.com/licence)) | Attribution not required; verify the licence page before relaunch |
| [Magic UI](https://magicui.design) | MIT | |
| [Cult UI](https://www.cult-ui.com) | MIT | |
| [ReactBits](https://www.reactbits.dev) | MIT | jsrepo / copy (no shadcn registry) |
| [21st.dev](https://21st.dev) | Per-component - **verify each** | Community registry; check each component's licence before shipping |
| [shadcn/ui](https://ui.shadcn.com) | MIT | Plain fallbacks |
| [Tremor](https://tremor.so) | Apache-2.0 | Dashboards / charts |

Full attribution: [ATTRIBUTION.md](./ATTRIBUTION.md). Each `components.json` entry records its source + license; fetched code carries its own upstream license, never this repo's.

## Supported tools

- **Claude Code** (native - the skill auto-loads from `.claude/skills/`).
- Any agent that can read a `SKILL.md` + run `npx` + WebFetch can use the same `components.json` registry.

## Community & contributing

PRs are almost always a new/updated entry in `components.json`. See [CONTRIBUTING.md](./CONTRIBUTING.md), the [Code of Conduct](./CODE_OF_CONDUCT.md), and the [open issues](https://github.com/AnayDhawan/components/issues) for the roadmap.

## License

[Apache-2.0](./LICENSE) © Anay Dhawan. Components fetched via the skill carry their own upstream licenses (recorded per entry in `components.json`).
