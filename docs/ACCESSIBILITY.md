# Accessibility review (WCAG 2.2 AA)

Target: WCAG 2.2 level AA on every page, at 390 px mobile and 1440 px desktop.

## Automated checks

`tests/e2e/accessibility.spec.ts` runs axe-core with the `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa` and `wcag22aa` rule sets on:

- the homepage (after scrolling, so scroll-revealed content is checked in its final state),
- both product pages,
- the cart page,
- the homepage with the cart drawer open and an item in it,

on both the desktop and the Pixel 7 project. All pass with zero violations. ESLint's `jsx-a11y` rules run in `npm run lint`.

The first axe run found and this review fixed:

| Issue | Fix |
| --- | --- |
| Add-to-cart buttons had an `aria-label` ("Add Medium Roast to cart") that did not contain the visible text ("Add to cart") (WCAG 2.5.3 Label in Name) | The spoken name now starts with the visible text and adds the product after it ("Add to cart, Medium Roast") |
| Hero product links were named by `aria-label` instead of their visible roast name | Link is named by its visible text; the image inside is decorative |
| Image-only links in the empty cart had no name | Removed from the tab order and hidden from assistive tech; the adjacent text link carries the name |

## Manual review

| WCAG 2.2 criterion | How it is met |
| --- | --- |
| 1.1.1 Non-text content | Product images use Shopify alt text. Decorative images and duplicated image links are `alt=""` / `aria-hidden`. Icons are `aria-hidden` with text or `aria-label` on their button. |
| 1.3.1 Info and relationships | One `h1` per page, ordered headings, landmarks (`header`, `nav`, `main`, `footer`), `dl` for facts, `fieldset`/`legend` for variant options, `role="radiogroup"` for the roast selector. |
| 1.4.3 / 1.4.11 Contrast | Text tokens were chosen against the darkest and lightest backgrounds they sit on: ivory `#eee9df` on obsidian 16.3:1, `--text-muted` `#c9c2b7` 11.1:1 on obsidian and 9.2:1 on burgundy, `--text-soft` `#aea79e` 8.3:1 on obsidian and 4.8:1 on oxblood (raised from `#a59e95`, which measured 4.4:1 on oxblood during this review). Borders of inputs and chips are ≥ 3:1. |
| 1.4.4 / 1.4.10 Resize and reflow | Fluid type with `clamp()` in `rem`; no horizontal scroll at 320 px CSS width (checked on the homepage, product page and cart). |
| 2.1.1 Keyboard | Everything is a native `button`, `a`, `input` or `details`. The roast selector supports arrow keys with roving `tabIndex`. |
| 2.1.2 No keyboard trap / 2.4.3 Focus order | Cart drawer and mobile menu are modal `<dialog>` elements: focus moves in on open, Tab stays inside, Escape closes, and focus returns to the button that opened them (end-to-end tested). The mobile sticky purchase bar is `inert` while hidden. |
| 2.4.1 Bypass blocks | "Skip to content" link is the first focusable element. |
| 2.4.7 / 2.4.11 Focus visible, not obscured | A 2 px ivory outline with offset on every `:focus-visible`. The sticky header and sticky bar use `scroll-padding` so focused elements are not hidden behind them. |
| 2.5.3 Label in name | See automated fixes above. |
| 2.5.8 Target size (minimum) | Buttons are at least 44 × 44 px (`.btn` 52 px, `.icon-btn`, stepper buttons and option chips 44 px). |
| 3.2.2 On input | Choosing a variant or roast never navigates or submits. |
| 3.3.1 Error identification | Cart errors from the server (sold out, invalid quantity) are shown next to the button with `role="alert"`. |
| 4.1.3 Status messages | Add, update and remove results are announced through a polite live region ("Added … to your cart."). Cart count and line quantities use `aria-live="polite"`. |
| 2.3.3 Animation from interactions | All motion is disabled or reduced to opacity under `prefers-reduced-motion: reduce`. Steam plays two cycles then stops; nothing loops indefinitely. |

## Progressive enhancement

Add to cart, quantity changes and remove are real `<form>` posts. They work before JavaScript loads (falling back to the `/cart` page), and the FAQ uses native `<details>`.

## Known limitations

- Merchant-authored content (policies, FAQ answers, image alt text) is only as accessible as what is entered in Shopify. Keep alt text descriptive and policy headings in order.
- Screen reader testing in this review was based on the accessibility tree (Playwright / axe). Before launch, do a pass with VoiceOver (iOS Safari) and NVDA (Windows Firefox or Chrome) through the purchase flow.
