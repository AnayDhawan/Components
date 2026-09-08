# Component Preview / Showcase Audit

Issue: #62 — "Improve component preview/showcase images"

Status: audit + implementation (see "Resolution" below).

## Resolution

Implemented in the PR that closes #62:

1. **F-1 / F-3 fixed** - `texture-card` now has a `DemoTextureCard` static preview, and
   `fetch-showpieces.mjs` fails the build if any `CURATED`/`STATIC_PREVIEW` entry lacks
   its `Demo<Name>.tsx`, so the fetch list and demo components cannot drift.
2. **F-2 addressed** - the live-fetched sample grew from 5 to 13 entries
   (`spotlight`, `background-beams`, `shimmer-button`, `meteors`,
   `animated-shiny-text`, `dock`, `count-up`, `decrypted-text` added).
3. **F-5 addressed** - the 9 WebGL/canvas-class effects plus `texture-card` are
   rendered as hand-authored static CSS/SVG previews (badged "static preview"), so
   every one of them has a visible preview with zero bundle weight.
4. **F-4 addressed (light path)** - all 7 `layouts[]` entries now record an explicit
   `"preview": "none"`, and the gallery labels them accordingly.
5. **F-2 doc** - gallery copy now states the actual coverage instead of "one per
   source library".

---

## 1. How previews work today

The registry itself stores **pointers, not images** (`components.json`), and the
gallery renders **live demos** by running each component's real registry command at
build time (`gallery/scripts/fetch-showpieces.mjs`), then mounting a hand-written
demo component. There is no static screenshot / thumbnail pipeline.

Two build-time lists drive the gallery and can drift from each other:

- `CURATED` (in `fetch-showpieces.mjs`) — which effects are fetched. Currently 5:
  `3d-card`, `marquee`, `texture-card`, `blur-text`, `matrix-text`.
- `DEMOS` (in `gallery/src/App.tsx`) — which fetched effects have a demo component
  to render. Currently 4: `3d-card`, `marquee`, `blur-text`, `matrix-text`.

The gallery deliberately keeps the fetched set small: "five WebGL contexts and a
multi-megabyte bundle" is the stated reason not to render all 39. It is a shop
window, one effect per upstream library, not a catalogue.

The 7 `layouts[]` entries all carry `"preview": null` and have no visual preview in
the gallery — they render text lists of beats/sections only.

---

## 2. Coverage matrix (all 39 effects)

`CUR` = in the gallery fetch list. `DEMO` = has a live demo component. `W3D` = WebGL /
three / shader-class (impractical as a cheap live demo). `W2` = canvas-class.

| Effect                  | Library   | W3D | W2 | CUR | DEMO | Preview today |
|-------------------------|-----------|-----|----|-----|------|---------------|
| macbook-scroll          | aceternity |     |    |     |      | none          |
| 3d-card                 | aceternity |     |    | yes | yes  | live demo     |
| spotlight               | aceternity |     |    |     |      | none          |
| background-beams        | aceternity |     |    |     |      | none          |
| lamp                    | aceternity |     |    |     |      | none          |
| wavy-background         | aceternity |     |    |     |      | none          |
| infinite-moving-cards   | aceternity |     |    |     |      | none          |
| text-generate-effect    | aceternity |     |    |     |      | none          |
| card-hover-effect       | aceternity |     |    |     |      | none          |
| animated-beam           | magicui    |     |    |     |      | none          |
| marquee                 | magicui    |     |    | yes | yes  | live demo     |
| bento-grid              | magicui    |     |    |     |      | none          |
| globe                   | magicui    |  W  |    |     |      | none          |
| meteors                 | magicui    |     |    |     |      | none          |
| shimmer-button          | magicui    |     |    |     |      | none          |
| dock                    | magicui    |     |    |     |      | none          |
| animated-shiny-text     | magicui    |     |    |     |      | none          |
| particles               | magicui    |     |    |     |      | none          |
| split-text              | reactbits  |     |    |     |      | none          |
| blur-text               | reactbits  |     |    | yes | yes  | live demo     |
| decrypted-text          | reactbits  |     |    |     |      | none          |
| count-up                | reactbits  |     |    |     |      | none          |
| aurora                  | reactbits  |  W  |    |     |      | none          |
| particles-webgl         | reactbits  |  W  |    |     |      | none          |
| hyperspeed              | reactbits  |  W  |    |     |      | none          |
| letter-glitch           | reactbits  |     |  W |     |      | none          |
| splash-cursor           | reactbits  |  W  |    |     |      | none          |
| dynamic-island          | cult-ui    |     |    |     |      | none          |
| shader-lens-blur        | cult-ui    |  W  |    |     |      | none          |
| canvas-fractal-grid     | cult-ui    |     |  W |     |      | none          |
| texture-card            | cult-ui    |     |    | yes |  NO  | placeholder*  |
| typewriter              | cult-ui    |     |    |     |      | none          |
| animated-number         | cult-ui    |     |    |     |      | none          |
| shape-landing-hero      | 21st.dev   |     |    |     |      | none          |
| matrix-text             | 21st.dev   |     |    | yes | yes  | live demo     |
| beams-background        | 21st.dev   |     |    |     |      | none          |
| background-paths        | 21st.dev   |     |    |     |      | none          |
| v0-ai-chat              | 21st.dev   |     |    |     |      | none          |
| cobe-globe-interactive  | 21st.dev   |  W  |    |     |      | none          |

\* `texture-card` is fetched successfully (`available: true`) but has **no entry in
the `DEMOS` map**, so `App.tsx` falls through to the "Upstream temporarily
unavailable" placeholder even though the component is present.

**Totals:** live demos **4 / 39**. Budget-safe non-WebGL effects with no preview:
**~26**. WebGL/canvas-class with no preview: **~9**.

---

## 3. Findings

### F-1 — `texture-card` is in CURATED but not in DEMOS (inconsistency / bug)
`fetch-showpieces.mjs` fetches `texture-card`, and `App.tsx` marks it `available:
true`, but there is no `DemoTextureCard` in the `DEMOS` map. The card renders the
"Upstream temporarily unavailable" placeholder while the component actually exists.
This is the clearest defect: a *misleading* preview rather than a missing one.

### F-2 — Preview coverage is 4 / 39
Only `3d-card`, `marquee`, `blur-text`, `matrix-text` have any visual preview. 34
effects have none. Note this is by design ("one per source library"), so it is a
*known* constraint, but the low count means the shop window under-represents what
the registry offers.

### F-3 — CURATED and DEMOS can silently drift
Both lists are hand-maintained in different files. Nothing enforces that every
`CURATED` entry has a `DEMOS` component (F-1 is the proof). A cheap guard (validate
at build) would prevent this class of bug.

### F-4 — No layout previews at all
All 7 `layouts[]` entries have `"preview": null`; web layouts render text lists,
video layouts render beat lists. No visual preview exists for any layout.

### F-5 — Budget-heavy effects can't be cheap live demos
9 effects are WebGL/canvas-class (`globe`, `aurora`, `particles-webgl`,
`hyperspeed`, `splash-cursor`, `shader-lens-blur`, `cobe-globe-interactive`,
`letter-glitch`, `canvas-fractal-grid`). Rendering these as gallery live demos
multiples context count and bundle size — the exact trade-off the gallery already
chooses to avoid. If broader coverage is ever wanted, these are the natural
candidates for **static images** rather than live demos.

### F-6 — Quality notes on the 4 existing demos
The four existing demos are small but consistent (neutral-900/950 surfaces,
brand-friendly). No obvious quality problems were found; the main issue is breadth,
not polish.

---

## 4. Recommendations (in priority order)

1. **Fix F-1 / F-3 (low effort, high value):** add a `DemoTextureCard` so every
   `CURATED` entry renders, and add a build/`validate.py` check that every `CURATED`
   name has a corresponding `DEMOS` key (or remove `texture-card` from `CURATED`).
   This removes the misleading placeholder and stops silent drift.
2. **Expand the curated demo set modestly (F-2):** if the shop window should show
   more, add cheap non-WebGL demos (`shimmer-button`, `typewriter`, `spotlight`,
   `meteors`, `dock`, `count-up`, `animated-shiny-text`, `background-beams`) — all
   `motion`-only / CSS, adding negligible bundle weight. Growing from one-per-library
   to a small per-library set stays within the design constraint.
3. **Add static preview thumbnails for budget-heavy effects (F-5):** for the 9
   WebGL/canvas-class effects, a generated static screenshot is cheaper than a live
   demo and fills coverage without the bundle/context cost.
4. **Optional layout previews (F-4):** give the web layouts at least one composed
   demo each, or drop `"preview": null` in favor of an explicit `"preview": "none"`
   so the intent is recorded.
5. **Document the number** so copy like "A curated sample… 39 showpieces" stays
   accurate as coverage changes.

---

## 5. Non-goals
- No static image asset pipeline was built (chose audit-only per scope).
- No change to the registry's "pointers not images" model.
