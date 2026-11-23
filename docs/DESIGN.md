# Design direction

## Design skills used

The brief required three design skills. All three were installed into the build session from their public GitHub sources and their guidance was followed:

| Skill | Source | How it was used |
| --- | --- | --- |
| Impeccable | `pbakaus/impeccable` | Persuade-mode new-work playbook, craft floor and absolute bans (for example no eyebrow labels over headings, no gradient text, one display face). Its `context` launcher downloads a binary, which the sandbox blocked, so its reference files were read and applied directly instead. |
| Taste Skill | `Leonxlnx/taste-skill` | One idea per section, plain copy in the brand's voice, a hero entrance and a single "dealt moment" per page, quiet micro-interactions. Its browser checker and finish-gate scripts were not run in the sandbox; their checks were done by hand with screenshots at 390 px and 1440 px. |
| Emil Kowalski | `emilkowalski/skill` (design-eng, animate, choreograph, review-animations, animation-performance) | Easing and duration choices, press feedback, drawer motion, interruptible transitions, reduced-motion behaviour, composite-only properties. |

## Concept: the seam

Morning Rebel sells exactly two roasts, so the whole site is built on a split: the **Medium** world (warm coffee brown, light from the upper left) and the **Dark** world (burgundy to oxblood, light from the upper right), divided by a thin silver seam. Every section either shows both sides or lets the visitor choose one. The Duo is the moment the two fields meet.

Mode: Persuade. The goal of every screen is a confident choice and an add to cart in as few steps as possible.

## System

**Type**
- Display: Bodoni Moda (high-contrast didone, all caps for section titles, max 6 rem). Self-hosted WOFF2.
- Body and UI: Manrope variable. Self-hosted WOFF2.

**Colour tokens** (`app/styles/tailwind.css`)

| Token | Hex | Role |
| --- | --- | --- |
| obsidian | `#0b0b0d` | Page background |
| charcoal | `#17171b` | Raised surfaces |
| graphite | `#222227` | Image wells, chips |
| coffee | `#38261f` | Medium field |
| burgundy | `#3d101a` | Dark field |
| oxblood | `#691e2b` | Duo field, accents |
| silver | `#b7b0a8` | The seam, hairlines |
| ivory | `#eee9df` | Primary text, primary buttons |
| crema | `#c79c72` | Medium accent |
| ember | `#d9707f` | Errors and sold-out states (readable on dark) |

A fine grain overlay sits over the page so the large flat fields read as printed material rather than flat UI.

**Components:** ivory primary button, ghost secondary, option chips (radio inputs), stepper, pouch frame with floor reflection, hairline fact rows, `<dialog>` sheets for the cart and mobile menu.

## Homepage, in order

1. **Hero:** "YOUR MORNING. YOUR RULES." Both pouches stand on either side of the seam with a short steam rise (two cycles, then still). Lines rise in through masks.
2. **The two roasts:** two full purchase panels with variant chips, price, availability and add to cart, without leaving the page.
3. **Selector:** "How do you take your rebellion?" One question, two answers; the background field crossfades between the two worlds and the recommendation swaps with a short blur crossfade.
4. **Duo:** "Why choose a side?" The two pouches lean into each other on the oxblood field.
5. **Nothing to hide:** ingredients, mushrooms, caffeine, origin and testing from Shopify metafields, side by side.
6. **Ritual:** Open / Brew / Enjoy line drawings that draw once when scrolled into view (the page's dealt moment).
7. **Reviews:** real aggregate rating from the reviews app, or an honest launch state.
8. **FAQ:** native disclosure list.
9. **Break the ordinary:** final choice with a direct add for each roast.

## Motion

| Token | Curve | Use |
| --- | --- | --- |
| `--ease-out` | `cubic-bezier(0.23, 1, 0.32, 1)` | Most UI responses |
| `--ease-drawer` | `cubic-bezier(0.32, 0.72, 0, 1)` | Cart drawer and mobile menu |
| `--ease-in-out` | `cubic-bezier(0.77, 0, 0.175, 1)` | Background field crossfade |
| `--ease-enter` | `cubic-bezier(0.22, 1, 0.36, 1)` | Hero entrance |

- Buttons scale to 0.97 on press; hover effects only on devices that hover.
- Add to cart: label blurs to "Adding…", then "Added" with a check, the cart count bumps, and the drawer slides in.
- Sheets use `@starting-style` so open and close are both animated and interruptible.
- Everything under 300 ms except the entrance (staggered, under 1 s total) and the field crossfade (700 ms, decorative).
- `prefers-reduced-motion: reduce` turns movement into instant or opacity-only changes.

## Critique and refinement log

Screenshots were taken at 390 × 844 and 1440 × 900 after the first build and after each round.

| Finding | Change |
| --- | --- |
| Dev notice bar collided with the sticky header | Moved to a small fixed pill at the bottom left |
| The Dark pouch covered "YOUR RULES." in the hero | Headline raised above the pouches with a soft shadow |
| Duo and final-section backgrounds did not render (negative z-index escaped the section) | Sections isolate their stacking context |
| "Medium Roast" wrapped onto two lines in its panel | Fluid size with `clamp()`, no wrap, rebalanced panel columns |
| An eyebrow label above the roast name (an Impeccable ban) | Removed |
| The selector background jumped instead of crossfading (gradients do not interpolate) | Two stacked fields crossfading on opacity |
| Large empty band under the hero on desktop | Removed the forced viewport height; larger pouches |
| Mobile hero buttons squeezed side by side | Stacked full width on small screens |
| FAQ title touched the first question on desktop | Column gap added; title stays in view while reading |
| Fixture pouch tagline ran past the label | Smaller, tighter tagline in the fixture art |
| A built-in FAQ answer promised a subscription option the product page does not offer | Removed; subscription answers belong in the merchant's own FAQ entries |
| `--text-soft` measured 4.4:1 on oxblood | Raised to 4.8:1 |

## Product imagery

The fixture pouches in `public/fixtures/` are labelled development stand-ins drawn as SVG. They are never used once a store is connected. Replace them with real photography in Shopify: pouches on a transparent or very dark background, front-facing, consistent lighting, at least 1600 px tall.
