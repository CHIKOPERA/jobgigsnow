# Handoff: Hirelane job board UI (Next.js)

## Overview
A mobile-first job board design system: colour roles, type scale, spacing, six core components
(job card, search + filter chips, buttons, form field, application status, navigation), three
breakpoint layouts, an accessibility checklist and a per-route performance budget.

## About the design files
`Job Board UI Guide.dc.html` in this bundle is a **design reference created in HTML** — a prototype
showing intended look and behaviour, not production code to copy. Recreate it in the Next.js app
using that app's existing patterns (App Router, your component library, your styling solution).
If the app is greenfield: Next.js App Router + Tailwind v4 (or CSS Modules) is a good fit; the
tokens below map cleanly to either.

## Fidelity
**High-fidelity.** Colours, type, spacing and states are final. Match them exactly.

## Exporting the style without losing anything
Everything visual lives in three places — take all three:
1. `tokens.json` — W3C DTCG source of truth (feed Style Dictionary / your token pipeline).
2. `tokens.css` — the same values as CSS custom properties. Import once in `app/layout.tsx`
   (`import "./tokens.css"`) and every component can read `var(--color-ink)` etc.
   For Tailwind v4, wrap them in `@theme { --color-ink: #14150F; ... }` in `app/globals.css`
   and the utility classes (`bg-bg`, `text-ink-muted`, `rounded-md`) are generated for you.
3. The HTML guide — read it for component anatomy, states and copy.

**Fonts.** The guide requests `saansFont, "saansFont Fallback"` and falls back to Schibsted Grotesk
(Google Fonts) for rendering here. In Next.js: if you have the Saans licence, self-host it with
`next/font/local` (`display: "swap"`, subset to latin, one variable weight axis ≤ 28 KB) and set
`--font-sans` from the returned `.variable` class. Otherwise use
`next/font/google` → `Schibsted_Grotesk`. Monospace (JetBrains Mono) is only used for spec labels —
drop it in product UI if you don't need it.

## Screens / views
The deliverable is a **guide page**, not an app flow, but it specifies these product surfaces:

### Job list (mobile, 360–767)
- Single column, page padding 16, cards stacked with 12 gap.
- Sticky search bar (52px, pill, `--color-surface`, 1px `--color-line`); focus adds 1px ink border + `--ring`.
- Filter chips: one horizontally scrolling row, 40px tall, pill, 8 gap; selected = ink fill, white text, "✕" affordance; last chip always "All filters" → bottom sheet.
- Bottom tab bar: 4 destinations max, each ≥52px, above the safe-area inset, hides on scroll-down only after 200px of travel.
- List virtualises after 20 cards.

### Job card (`JobCard`)
- `--color-surface` on `--radius-md`, 1px `--color-line`, padding 16.
- Row: 40×40 initials tile (`--radius-sm`*2 = 8px, accent tint background, 14px/600) + title (17px/600, ls -.01em) + subtitle "Company · Location" (14px, `--color-ink-muted`), then a 44×44 save button pinned right — **outside** the card link.
- Meta chips: 12px, padding 5/10, pill, `--color-bg` fill; "New" uses `--color-accent-orchid`.
- Focus: 1px ink border + `--ring`. Closed: `--color-surface-sunk`, opacity .72, title line-through.
- The card is one link; the save control is a sibling button (avoids nested interactive elements).

### Buttons (`Button`, min height 48)
Primary = ink fill / `#F6F7F0` text / pill. Secondary = 1px ink outline. Success = mint fill.
Disabled = sage fill, `#6D6F63` text. Loading = primary at .55 opacity, label retained, `aria-busy`.
Full-width < 768px, auto-width above.

### Form field
Label 13px/500, 6 below; input 48px, `--color-surface`, 1px `--color-line-strong`, `--radius-sm`*2 = 8px,
**16px text** (prevents iOS zoom). Error: 1.5px `--color-danger` border + text message wired with
`aria-describedby`; never colour-only. Upload: 1px dashed `--color-line-strong`, `--color-surface-sunk`.

### Application status
Four-segment progress bar (6px pills, 8 gap): done = ink, current = iris, pending = `#DCDED2`.
Badges: 12px/500, padding 6/12, `--radius-sm`+2 = 6px, tint per state, meaning repeated in text.

## Interactions & behaviour
- Two durations only: 120ms state, 240ms sheets; easing `cubic-bezier(.2,0,0,1)`; nothing animates on first paint; all motion gated by `prefers-reduced-motion`.
- Filtering announces the new result count in a live region (`aria-live="polite"`).
- Chips expose `aria-pressed`; segmented control uses `role="tablist"`.
- Split view (≥1200px) keeps list selection while detail loads in place; the URL still deep-links to the job (Next.js: parallel/intercepting routes, or `/jobs/[id]` with a persistent list layout).

## Responsive behaviour
| Breakpoint | Grid | Layout |
|---|---|---|
| 360–767 | 4 col, 16 gutter | single column, filters in a sheet, tab bar pinned |
| 768–1199 | 8 col, 24 gutter | persistent filter rail (~34%), same card component |
| 1200+ | 12 col, 32 gutter | filter rail (22%) + list (30%) + detail pane |

Section rhythm on mobile: 16 inside cards, 24 between blocks, 40 between sections.
Layout must survive 200% zoom and 320px width with no horizontal scroll.

## Accessibility (ship-blocking)
48×48 minimum hit area including padding · focus ring visible on canvas, surface and dark button ·
card is one link with the save button outside it · live-region result count · 200% zoom / 320px safe ·
`prefers-reduced-motion` honoured · `--color-ink-muted` on `--color-bg` = 5.1:1, do not lighten it.

## Performance budget (per route)
HTML + critical CSS ≤ 24 KB · first-load JS ≤ 60 KB · font subset ≤ 28 KB · zero above-the-fold images ·
INP < 120 ms. Company logos are text initials until the detail route.
Next.js notes: keep the list a Server Component, make only the save button and filter chips client
components, and avoid a client-side state library on the list route.

## Design tokens
See `tokens.json` (canonical) and `tokens.css`. Tokens are **role**-named, never value-named — add a
role before adding a colour; two roles sharing a hex is correct.

## Assets
None. Icons in the guide are text glyphs/CSS shapes as placeholders — substitute your icon set
(inline SVG, no icon font, per the performance budget). Company logos are initials tiles.

## Files
- `Job Board UI Guide.dc.html` — the design reference (open in a browser)
- `tokens.css`, `tokens.json` — the exportable style layer
