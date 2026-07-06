# Attribution & upstream licenses

`components` is a **sourcing skill**. It ships *pointers* (registry commands), not component code.
When you use it, the real component is fetched live from the library below and is governed by **that
library's license**, not this repo's Apache-2.0 license. This file credits every upstream source.

| Library | Author / Project | License | License link |
|---------|------------------|---------|--------------|
| Aceternity UI | Manu Arora | Aceternity License: free to use in unlimited personal/commercial end products; cannot redistribute the component/source itself (as a stock asset, template, or marketplace item) | https://ui.aceternity.com/licence |
| Magic UI | Magic UI | MIT | https://github.com/magicuidesign/magicui/blob/main/LICENSE |
| Cult UI | Jordan Gilliam (nolly) | MIT | https://github.com/nolly-studio/cult-ui/blob/main/LICENSE.md |
| ReactBits | David Haz | MIT | https://github.com/DavidHDev/react-bits/blob/main/LICENSE |
| 21st.dev | 21st.dev community | **Per component - verify each** | https://21st.dev (check the component page) |
| shadcn/ui | shadcn | MIT | https://github.com/shadcn-ui/ui/blob/main/LICENSE.md |
| Tremor | Tremor | Apache-2.0 | https://github.com/tremorlabs/tremor/blob/main/License |

## Per-entry licenses
Every entry in `components.json` carries a `license` field. The `aceternity` entries confirm the
current terms of the Aceternity License (verified against ui.aceternity.com/licence, 2026-07-06):
free to use in unlimited personal/commercial end products, but the component/source itself may not
be redistributed (no reselling, templating, or marketplace listing of the Item). This is why
`components` stays pointer-only rather than vendoring a snapshot (see issue #4). The `21st.dev`
source has **no blanket license** - each component must be verified individually before shipping.

## What this repo's Apache-2.0 license covers
Only the curation itself: `SKILL.md`, `components.json`, `references/`, and the docs. Copyright 2026
Anay Dhawan. Keep the notice; otherwise use it freely.
