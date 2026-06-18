# Adaptation Rules (shared)

Applied to EVERY component sourced via this skill. Keeps per-entry `adapt_rules` terse by holding the common logic here. **A sourced component is never pasted raw.**

## 1. Brand tokens (do this first)

Source libraries ship neutral defaults (shadcn = zinc/neutral, Tremor = its own palette). Map them to the project's tokens.

- Find the project's token source: `tailwind.config` theme.extend.colors, or CSS variables in `globals.css` (`--primary`, `--background`, `--foreground`, `--muted`, `--accent`, `--destructive`).
- Replace hardcoded source colors with the project tokens. Never leave `bg-zinc-900` / `text-black/50` literals from a demo.
- Primary action → `--primary`. Surfaces → `--card` / `--background`. Secondary text → `--muted-foreground`. Errors → `--destructive`.
- If the project has no token system yet, set up shadcn CSS variables first (`npx shadcn@latest init`) so every component shares one source of truth.

## 2. Dark mode

- shadcn: works via CSS variables + `.dark` class. Confirm `darkMode: "class"` in tailwind.config and a theme toggle exists.
- Tremor: needs its dark classes; verify Tremor content paths are in tailwind.config.
- Never hardcode light-only colors (e.g. raw `#fff`, `bg-white`). Use tokens so both modes follow.

## 3. Responsive

- Mobile-first. Default = stacked/single-column; add `sm:` / `md:` / `lg:` to expand.
- Grids (pricing, features): collapse to 1 column < `md`. Keep CTAs reachable without long scroll on mobile.
- Tables: horizontal scroll with an edge-shadow affordance, or collapse rows to cards < `md`.
- Navbars: full menu ≥ `md`, mobile sheet/drawer < `md`.

## 4. Accessibility (keep what the source gives)

- Radix primitives (dialog, tabs, navigation-menu) ship focus traps, esc-to-close, arrow-key nav, aria wiring. Do NOT strip these.
- Every input has a label + `aria-describedby` for errors.
- Interactive targets ≥ 44px on touch. Visible focus ring (tie to `--ring`).
- Respect `prefers-reduced-motion` for any animated source (Aceternity, motion backgrounds).

## 5. Dependencies (check before adding)

- shadcn core: `cn()` util, `class-variance-authority`, `lucide-react`, Radix per-component, often `tailwindcss-animate`.
- Forms: `react-hook-form`, `zod`, `@hookform/resolvers`.
- data-table: `@tanstack/react-table`.
- Tremor: `@tremor/react` + Tailwind preset/content paths.
- Aceternity: `framer-motion` (heavy) - only when motion is justified.

## 5b. Motion (showpiece components)

Live-fetched showpiece components ship heavy animation. Adapt it:

- **Always honor `prefers-reduced-motion`** - gate or disable scroll/loop/parallax motion for users who opt out. Wrap with a `useReducedMotion()` check (framer-motion) or a `motion-reduce:` Tailwind variant.
- **Tune to brand, don't ship the demo** - demo timings/colors/copy are placeholders. Re-time to feel calm, recolor to tokens.
- **One showpiece per view** - don't stack laptop-scroll + beams + globe + meteors on one screen; it reads as noise and tanks performance.
- **Imports:** match what the fetched code uses (`framer-motion` vs `motion/react`). Install the exact dep.
- **Perf:** WebGL (globe), canvas particles, and heavy parallax are expensive - lazy-load / only mount when in view; check mobile FPS.

## 6. Handoff

Once the adapted base is placed, defer visual distinctiveness / motion / polish to the **`impeccable`** or **`frontend-design`** skill. This skill's job ends at "proven base, on-brand, accessible, responsive."
