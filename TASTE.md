# TASTE.md — curation & anti-slop guidelines for layouts

## Why this exists

`layouts[]` (in `components.json`) composes existing `showpiece[]` entries — or, for video, patterns
proven in the separate `vidstudio`/`openvidstudio` pipeline — into full page/scene arrangements. This
doc is the standard an agent applies when picking or building one, so the result is a deliberate choice,
not "whatever's first in the array."

This is **not** a general UI checklist — see [Not a substitute for `impeccable`](#not-a-substitute-for-impeccable)
below.

## Web layout taste

Concrete anti-clichés to avoid when picking or composing a `kind: "web"` layout:
- The generic centered-hero-with-3-cards pattern, used because it's the path of least resistance, not
  because it fits the product.
- Templated SaaS-default spacing/type scale (the Tailwind defaults, unmodified, everywhere).
- Stock-photo hero backgrounds standing in for a real product screenshot or a deliberate illustration.
- Unmotivated gradients — a gradient that isn't reinforcing a brand color or a specific mood reads as
  decoration, not design.
- Prefer a `layouts[]` entry over composing showpieces fresh when the arrangement is proven and the
  product genuinely fits its shape; compose fresh when the fit is forced.

For deeper visual-hierarchy / cognitive-load review, that's the `impeccable` skill's job if it's
installed — not re-derived here.

## Video layout taste

These are `vidstudio`'s own `STYLE.md` hard rules, credited directly (Anay's own private repo, not
third-party content, so quoting them plainly is fine):

- **Motion never stops.** At minimum, a subtle push-in on every shot.
- **One focal point per shot.** If two things compete for attention, the shot is wrong, not the fix.
- **No linear easing, ever.**
- **Shallow depth of field** — one focal plane per shot.

`layouts[]`'s `kind: "video"` entries document real, working scene patterns proven on `pepiros v3`, not
inventions — each carries a `source` pointing at the actual scene file. They're descriptive, not
fetchable: this repo doesn't depend on `vidstudio`, so `scripts/validate.py` can't cross-check a video
layout's `composedFrom` the way it checks a web layout's against `showpiece[]`. Trust the `source` field.

## Recommended companion skills (if installed)

None of these are dependencies of this repo, and none of their internal logic is reproduced here —
name, one-line purpose, and where to get it, nothing more. Full list + how they route together lives in
a private cross-project skill (not part of this public repo); this table is the public pointer layer.

| Skill | What it's for | Install source |
|---|---|---|
| tastemaker | AI-slop gate list, per-project palette/contrast contract | `claude plugin install tastemaker@codeswithroh` |
| audit-ai-design-slop | AI-cliché audit, evidence-backed removal plan | [mengto/skills](https://github.com/MengTo/Skills) (`agent-skills/ui/audit-ai-design-slop`) |
| no-ai-design-slop | Anti-slop prevention + cleanup, preserves chosen art direction | [mengto/skills](https://github.com/MengTo/Skills) (`agent-skills/ui/no-ai-design-slop`) |
| web-design-skills | 25 anchored style recipes (Linear, Aesop, Stripe Press, ...), honest-placeholder philosophy | `claude plugin install web-design-skills@garden-skills` |
| visual-critique | Structured rendered-screen critique: color, typography, hierarchy, composition, density, affordance, brand-consistency | `claude plugin install visual-critique@designer-skills` |
| interfaces | Multi-dimension polish rubrics: UI, colors, typography, layout, accessibility, writing | `claude plugin install interfaces@interfaces` |
| review-animations, find-animation-opportunities, improve-animations | Motion craft-bar trio, flag-by-default | [emilkowalski/skills](https://github.com/emilkowalski/skills) |
| impeccable | General UI design/critique/polish | Anthropic's `frontend-design` plugin family |

## Not a substitute for `impeccable`

This doc is Components-specific curation taste for `layouts[]` — concrete anti-clichés, named source
rules, and pointers to companion skills. It is not a general UI design/critique checklist; that's
`impeccable`'s job (visual hierarchy, cognitive load, accessibility, typography, spacing, color, motion,
anti-patterns, design tokens, across any surface). Read `TASTE.md` for *which layout*; read `impeccable`
for *is this well-designed*.
