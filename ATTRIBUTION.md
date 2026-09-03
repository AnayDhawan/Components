# Attribution & upstream licenses

`components` is a **sourcing skill**. It ships *pointers* (registry commands), not component code.
When you use it, the real component is fetched live from the library below and is governed by **that
library's license**, not this repo's Apache-2.0 license. This file credits every upstream source.

<!-- keep in sync with README.md#sources--licenses -->

| Library | Author / Project | License | License link |
|---------|------------------|---------|--------------|
| Aceternity UI | Manu Arora | Aceternity License: free to use in unlimited personal/commercial end products; cannot redistribute the component/source itself (as a stock asset, template, or marketplace item) | https://ui.aceternity.com/licence |
| Magic UI | Magic UI | MIT | https://github.com/magicuidesign/magicui/blob/main/LICENSE |
| Cult UI | Jordan Gilliam (nolly) | MIT | https://github.com/nolly-studio/cult-ui/blob/main/LICENSE.md |
| ReactBits | David Haz | MIT + Commons Clause: commercial use is fine as part of a product; you may not resell, sublicense, or redistribute the components themselves | https://github.com/DavidHDev/react-bits/blob/main/LICENSE.md |
| 21st.dev | 21st.dev community | **Per component - verify each** | https://21st.dev (check the component page) |
| KokonutUI | Kokonut Labs (dorian) | MIT | https://github.com/kokonut-labs/kokonutui/blob/main/LICENSE |
| cobe | Shu Ding | MIT | https://github.com/shuding/cobe/blob/main/LICENSE.md |
| shadcn/ui | shadcn | MIT | https://github.com/shadcn-ui/ui/blob/main/LICENSE.md |
| Tremor | Tremor | Apache-2.0 | https://github.com/tremorlabs/tremor/blob/main/License |
| Vue Bits | David Haz | MIT + Commons Clause (same terms as ReactBits above; official Vue port, same author) | https://github.com/DavidHDev/vue-bits/blob/main/LICENSE.md |
| Svelte Bits | David Haz | MIT + Commons Clause (same terms as ReactBits above; official Svelte port, same author) | https://github.com/DavidHDev/svelte-bits/blob/main/LICENSE.md |
| Inspira UI | Rahul Vashishtha (unovue) | MIT | https://github.com/unovue/inspira-ui/blob/main/LICENSE |

## Per-entry licenses
Every entry in `components.json` carries a `license` field. The `aceternity` entries confirm the
current terms of the Aceternity License (verified against ui.aceternity.com/licence, 2026-07-06):
free to use in unlimited personal/commercial end products, but the component/source itself may not
be redistributed (no reselling, templating, or marketplace listing of the Item). This is why
`components` stays pointer-only rather than vendoring a snapshot (see issue #4). The `21st.dev`
source has **no blanket license** - each component must be verified individually before shipping.
The six curated `21st.dev` entries are all MIT, verified against their upstream source repos
(KokonutUI for the `@kokonutd` components, cobe for `@shuding`'s globe), not just the 21st.dev page.

The nine `reactbits` entries carry `"MIT + Commons Clause"` (verified against
`DavidHDev/react-bits`' `LICENSE.md`, 2026-08-16; previously recorded here as plain `MIT`, which had
gone stale). Commons Clause restricts *reselling, sublicensing, or redistributing the components
themselves* (alone, bundled, or ported); it does not restrict ordinary commercial use of a product
built with them. `components` never redistributes the fetched source (pointer-only, same as the
Aceternity case above), so the restriction does not change what shipping through this skill is
allowed to do - only the label was wrong.

## Framework variants (`frameworks`)

A showpiece entry may carry an optional `frameworks` object (`frameworks.vue`, `frameworks.svelte`)
for a non-React port of the same effect, with its own `ref`/`fetch`/`library`/`license`/`deps` - the
license notes above apply to whichever variant was actually fetched, not just the top-level (React)
one. The pilot entry was `split-text` -> `frameworks.vue` -> **Vue Bits**' `SplitText`, verified
end-to-end 2026-08-16 (see issue #13); the rollout below landed 2026-09-03 (issue #55).

### Coverage

| React source | Vue | Svelte |
|---|---|---|
| ReactBits (9 entries) | Vue Bits, all 9 | Svelte Bits, all 9 |
| Aceternity (9 entries) | Inspira UI, 4 of 9 | none |
| Magic UI (9 entries) | Inspira UI, all 9 | none |
| Cult UI, 21st.dev | none found | none |

Every port above is by the original author (Vue Bits, Svelte Bits) or carries the original creator's
stated permission: Inspira UI is MIT and its README credits *"Aceternity UI for providing the
inspiration and permission to adapt the original designs"*. Each variant was verified individually,
not mapped by pattern: the registry item was fetched, its source read to confirm the effect actually
matches the React original, and its real dependency list taken from the registry item rather than
copied across (the ports genuinely differ - Vue Bits' `BlurText` uses `motion-v`, not `motion`).

**Naming does not transfer.** Vue Bits keeps ReactBits' PascalCase names; Svelte Bits uses
lowercase-kebab; Inspira UI renames outright (`3d-card` -> `card-3d`, `lamp` -> `lamp-effect`,
`particles` -> `particles-bg`, `animated-shiny-text` -> `radiant-text`). Map per entry.

**Inspira UI components need `@inspira-ui/plugins`** for their `cn()` helper, and its registry items
do not declare it. That is recorded in each variant's `deps`, and `scripts/smoke-test.mjs` now
installs declared `deps` before building so the gap is caught rather than assumed.

**No verified Vue equivalent** for these five Aceternity entries, checked against Inspira UI's full
155-component list on 2026-09-03: `macbook-scroll`, `spotlight`, `background-beams`,
`infinite-moving-cards`, `card-hover-effect`. Superficially similar components exist
(`container-scroll`, `card-spotlight`, `animated-beam`, `marquee`, `glowing-effect`) but none is a
port of the original effect, so none was mapped. Recorded here so the search is not repeated.

## What this repo's Apache-2.0 license covers
Only the curation itself: `SKILL.md`, `components.json`, `references/`, and the docs. Copyright 2026
Anay Dhawan. Keep the notice; otherwise use it freely.
