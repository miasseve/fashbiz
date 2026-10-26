# DESIGN.md

> Visual source of truth for the leStores AI pricing page.
> Token values are applied inline in `src/components/pricing/pricingV2Styles.js` (CSS string, `p2-` prefix).
> This file and that one must match.

| | |
|---|---|
| Stack | Next.js 16 + Tailwind v3 + HeroUI |
| Scope | Pricing page only (`PricingSections.jsx` + `pricingV2Styles.js`) |
| Reference screen | lestoresworld.com/pricing |
| Shared UI folder | `src/components/pricing/` |
| Source | Screenshot — primary color and font confirmed by user; all other values estimated from screenshots |
| Last updated | 2026-10-08 |

---

## 1. Direction

Clean, airy, consumer-facing. One brand accent (crimson-rose) on a near-white warm background. Cards are flat with hairline borders — almost no shadow. Typography is neutral Inter with one weight jump for prices and headings. The tone is confident and direct: "One photo = complete product."

---

## 2. Colors

Use tokens by **role**, never raw values. The pricing page sets its own background — it does not inherit the dashboard gradient.

| Token | Value | Use for |
|---|---|---|
| `primary` | `#ca2356` | CTAs (solid), text links, eyebrows, feature checkmarks, price highlights, card accents |
| `primary-hover` | `#b80049` | Hover state on primary buttons and text links |
| `primary-foreground` | `#ffffff` | Text/icons on a solid primary button |
| `surface-accent` | `#fce7f0` | Badge pills ("MOST COMPLETE", "LE-STORES APP FREE UNTIL 1 MAY 2027"), bottom contact block background |
| `background` | `#fff5f7` | Pricing page section background (warm rose tint) |
| `surface` | `#ffffff` | Card background |
| `foreground` | `#111827` | Headings, bold text, price numbers, card titles |
| `muted-foreground` | `#6b7280` | Descriptions, "excl. VAT", secondary/meta text, price unit labels |
| `border` | `#e5e7eb` | Standard card borders, dividers, internal horizontal rules |
| `border-featured` | `#ca2356` | Border on the featured/recommended card |

**Key contrast (estimated):**
- `foreground` `#111827` on `surface` `#ffffff`: ~16:1 ✓
- `primary-foreground` `#ffffff` on `primary` `#ca2356`: ~4.8:1 ✓ (WCAG AA)
- `primary` `#ca2356` on `surface` `#ffffff`: ~4.6:1 ✓ (WCAG AA for large text)

---

## 3. Typography

Font: **Inter** (weights 400, 500, 600, 700, 800). No other fonts on the pricing page.

> Note: the rest of the dashboard uses `--font-bricolage`, `--font-instrument-serif`, `--font-playfair` (set in `src/app/layout.js`). The pricing page currently references those via CSS vars. The design target is Inter; alignment of the CSS vars is a cleanup step.

| Role | Size | Line height | Weight | Use for |
|---|---|---|---|---|
| Page title | `clamp(40px, 5vw, 60px)` | 1.05 | 700 | "Pricing" hero heading |
| Card heading | `clamp(20px, 2vw, 26px)` | 1.15 | 600 | Plan group title ("Visibility and full time saving") |
| Price number | `clamp(30px, 4vw, 48px)` | 1.0 | 800 | "549 DKK", "5,900 DKK" |
| Price unit | 14px | 1.2 | 500 | "/ month", "excl. VAT · one-time" |
| Eyebrow | 11–12px | 1.0 | 700 | "VISIBILITY", "FULL TIME SAVING", "LE-STORES APP FREE UNTIL 1 MAY 2027" — uppercase, letter-spacing 0.10–0.12em |
| Body / features | 14px | 1.5 | 400 | Feature list items, descriptions, notes |
| Text link CTA | 14px | 1.0 | 600 | "Start free →", "Get lestores-ai →" — primary color, no background |
| Caption / meta | 12–13px | 1.4 | 500 | "4% on your webshop sales", "12-month commitment", VAT note |

---

## 4. Spacing

Scale: `4, 8, 12, 16, 24, 32, 48, 64, 80` px. Use only these values (or `clamp()` between two scale steps for fluid sizing).

| Slot | Value |
|---|---|
| Page padding (vertical) | `clamp(48px, 6vw, 80px)` top and bottom |
| Gap between major sections | `clamp(40px, 5vw, 64px)` |
| Card grid gap | `24px` |
| Card padding | `clamp(24px, 2.4vw, 32px)` |
| Gap inside card (between elements) | `8–16px` |
| Feature list row gap | `12px` |
| Section heading → grid gap | `clamp(24px, 3vw, 40px)` |

---

## 5. Radius and shadows

| Token | Value | Use for |
|---|---|---|
| `radius-pill` | `999px` | Buttons, badge pills |
| `radius-card` | `16px` | Standard cards, "already have part of it" panel, Pro strip |
| `radius-card-lg` | `20px` | Not used in reference — keep at 16px for alignment |
| `shadow-card` | `0 1px 3px rgba(0,0,0,0.06)` | Standard card (nearly flat) |
| `shadow-card-featured` | `0 4px 16px rgba(202,35,86,0.12)` | Featured / recommended card |

**Important change from current styles:** `pricingV2Styles.js` currently uses `box-shadow: 0 18px 50px rgba(0,0,0,0.16)` on standard cards. The reference is almost flat. Update in cleanup.

---

## 6. Layout

- **Container**: `width: min(1200px, 100%)`, centered, `padding: 0 24px`
- **Main card grid**: 2 columns at desktop (left = "Visibility + full time saving", right = "Maximum visibility…"). Collapses to 1 column at ≤860px.
- **"Already have part of it?" section**: 3 columns inside a single bordered card. Collapses to 1 column at ≤860px.
- **Pro strip**: full-width panel below the cards — text left, "Contact us" link + "See details" toggle right.
- **Bottom contact block**: centered, light `surface-accent` background card, full-width solid "Contact us" button.
- **Breakpoints**: 860px (cards collapse), 640px (bottom block stacks).

---

## 7. Components

See `COMPONENTS.md` for full inventory. Summary rules:

### Card

- `background: surface` / `border: 1px solid border` / `border-radius: radius-card` / `box-shadow: shadow-card` / `padding: card-padding`
- Featured variant: `border: 1.5px solid border-featured` / `box-shadow: shadow-card-featured`
- Badge ("MOST COMPLETE"): pill, `background: surface-accent`, `color: primary`, font-weight 700, 11px uppercase

### Button — solid primary

- `background: primary` / `color: primary-foreground` / `border-radius: radius-pill`
- Padding: `13px 24px` (card CTAs), `13px 32px` (bottom block wide button)
- Hover: `background: primary-hover`, subtle lift `translateY(-1px)`, `box-shadow: 0 8px 20px rgba(202,35,86,0.28)`
- Disabled / subscribed: `background: #9ca3af`, `cursor: not-allowed`, no hover effects

### Button — outline

- `background: transparent` / `border: 1.5px solid primary` / `color: primary` / `border-radius: radius-pill`
- Hover: `background: #fff0f5`

### Text link CTA

- No border, no background. `color: primary`, font-weight 600. Append " →" as a text suffix (not an icon).
- Hover: `color: primary-hover`, underline optional.

### Badge pill (eyebrow label)

- `background: surface-accent` / `color: primary` / `border-radius: radius-pill`
- Font: 11–12px, weight 700, uppercase, letter-spacing 0.08em
- Padding: `4px 12px`

### States (all interactive)

| State | Treatment |
|---|---|
| Hover | `primary-hover` bg or color; optional `translateY(-1px)` lift; shadow grows |
| Focus | Visible focus ring: `outline: 2px solid primary; outline-offset: 2px` |
| Active | `translateY(0)`, shadow shrinks back |
| Disabled | `#9ca3af` bg or text, `cursor: not-allowed`, no hover change |
| No matching plan | Same as disabled; `title="Coming soon"` on the button |

---

## 8. Consistency rules

- Don't invent new colors, fonts, sizes, radii or shadows. Use the tokens above.
- Don't use hardcoded hex values in `pricingV2Styles.js`. Define as CSS custom properties on `:root` inside the CSS string, then reference via `var(--p2-primary)` etc.
- One primary (solid) CTA per card. Secondary actions use outline or text-link style.
- Badge pills: `surface-accent` background + `primary` text only. Never solid primary fill on a badge.
- Marketing copy is fixed. Prices shown in cards are display-only; Stripe price IDs are resolved dynamically via `findPlan(newPlans, ...)` in `PricingSections.jsx`.
- When something new is needed: propose before adding. Document token + component in this file and `COMPONENTS.md` together.

---

## 9. Changing the design system

1. Name the limitation in a comment or PR description.
2. Propose the change — check whether an existing token or component can be extended.
3. Get approval.
4. Update this file, `pricingV2Styles.js`, and `COMPONENTS.md` together, in the same commit.

---

## 10. Enforcement

- Check command: `npm run build` (must pass before every commit)
- Lint: `npm run lint` (zero new errors)
- Visual check: compare against lestoresworld.com/pricing screenshots in `DESIGN.md`
- Known gaps: `pricingV2Styles.js` is a raw CSS string — ESLint cannot catch hardcoded color values inside it. Color correctness relies on code review against the token table above.
