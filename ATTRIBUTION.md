# Attribution & upstream licenses

`components` is a **sourcing skill**. It ships *pointers* (registry commands), not component code.
When you use it, the real component is fetched live from the library below and is governed by **that
library's license**, not this repo's MIT license. This file credits every upstream source.

| Library | Author / Project | License | License link |
|---------|------------------|---------|--------------|
| Aceternity UI | Manu Arora | Free for personal + commercial use | https://ui.aceternity.com/licence |
| Magic UI | Magic UI | MIT | https://github.com/magicuidesign/magicui/blob/main/LICENSE |
| Cult UI | Jordan Gilliam (nolly) | MIT | https://github.com/nolly-studio/cult-ui/blob/main/LICENSE.md |
| ReactBits | David Haz | MIT | https://github.com/DavidHDev/react-bits/blob/main/LICENSE |
| 21st.dev | 21st.dev community | **Per component — verify each** | https://21st.dev (check the component page) |
| shadcn/ui | shadcn | MIT | https://github.com/shadcn-ui/ui/blob/main/LICENSE.md |
| Tremor | Tremor | Apache-2.0 | https://github.com/tremorlabs/tremor/blob/main/License |

## Per-entry licenses
Every entry in `components.json` carries a `license` field. The `aceternity` entries are marked
`free (verify)` as a reminder to re-check the licence page before a public relaunch. The `21st.dev`
source has **no blanket license** — each component must be verified individually before shipping.

## What this repo's MIT license covers
Only the curation itself: `SKILL.md`, `components.json`, `references/`, and the docs. Copyright (c)
2026 Anay Dhawan. Keep the notice; otherwise use it freely.
