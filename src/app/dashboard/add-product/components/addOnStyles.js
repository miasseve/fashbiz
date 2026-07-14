/* ───────────────────────────────────────────────────────────────
   "Pay Per Product" card, restyled to match the 2hand2go-style
   pricing cards (the "Basic / Most Popular" card on
   /dashboard/subscription-plan).

   All classes are prefixed `ap-` (add-product) so they never
   collide with the `p2-` pricing classes or the `pc-` stacking
   card styles.

   Fonts come from the next/font CSS vars set on <html> in layout.js:
     --font-playfair    (italic accent title)
     --font-bricolage   (sans body / labels)
   The card sits on the site's existing gradient theme — we only
   style the white box, never the page background.
   ─────────────────────────────────────────────────────────────── */
const ADDON_V2_CSS = `
  .ap-wrap {
    width: min(520px, 94vw);
    margin: 0 auto;
    padding: 26px 0 40px;
  }

  /* ── Card (mirrors .p2-card--popular) ── */
  .ap-card {
    position: relative;
    display: flex;
    flex-direction: column;
    background: #ffffff;
    border: 1.5px solid #ff2e7e;
    border-radius: 20px;
    padding: clamp(24px, 3vw, 34px);
    box-shadow: 0 24px 64px rgba(255, 46, 126, 0.28);
    font-family: var(--font-bricolage), system-ui, sans-serif;
  }
  .ap-badge {
    position: absolute;
    top: -13px;
    left: 50%;
    transform: translateX(-50%);
    background: #ff2e7e;
    color: #fff;
    font-weight: 700;
    font-size: 11px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    padding: 6px 16px;
    border-radius: 999px;
    white-space: nowrap;
  }

  .ap-name {
    font-family: var(--font-playfair), Georgia, serif;
    font-style: italic;
    font-weight: 600;
    font-size: clamp(24px, 2.6vw, 30px);
    color: #ff2e7e;
    line-height: 1.1;
  }
  .ap-desc {
    margin-top: 8px;
    font-size: 14px;
    line-height: 1.5;
    color: #6b7280;
  }

  /* ── Live total (mirrors .p2-price) ── */
  .ap-price {
    margin-top: 18px;
    display: flex;
    align-items: baseline;
    gap: 8px;
    flex-wrap: wrap;
  }
  .ap-price__num {
    font-weight: 800;
    font-size: clamp(32px, 4vw, 44px);
    color: #111827;
    line-height: 1;
    letter-spacing: -0.02em;
  }
  .ap-price__unit { font-size: 14px; font-weight: 600; color: #6b7280; }

  /* ── Selectable feature rows ── */
  .ap-features {
    margin-top: 22px;
    display: flex;
    flex-direction: column;
    gap: 4px;
    flex: 1;
  }
  .ap-feature {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    width: 100%;
    text-align: left;
    background: none;
    border: none;
    border-radius: 12px;
    padding: 10px 10px 10px 4px;
    cursor: pointer;
    transition: background 0.15s;
    font-family: inherit;
  }
  .ap-feature:hover:not(:disabled) { background: #fff5f9; }
  .ap-feature:disabled { cursor: not-allowed; }
  .ap-feature--locked { cursor: default; }
  .ap-feature--paid { opacity: 0.55; }

  /* The tick: a pink ✓ when on, a hollow ring when off */
  .ap-check {
    flex-shrink: 0;
    width: 18px;
    height: 18px;
    margin-top: 2px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #ff2e7e;
    font-weight: 800;
    font-size: 15px;
    line-height: 1;
  }
  .ap-check--off {
    border: 1.5px solid #d1d5db;
    border-radius: 999px;
    background: #fff;
  }
  .ap-feature:hover:not(:disabled) .ap-check--off { border-color: #ff2e7e; }

  .ap-feature__body { flex: 1; min-width: 0; display: block; }
  .ap-feature__top {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }
  .ap-feature__label {
    font-size: 14px;
    font-weight: 600;
    color: #374151;
    line-height: 1.4;
  }
  .ap-feature__note {
    display: block;
    margin-top: 2px;
    font-size: 12.5px;
    line-height: 1.45;
    color: #9ca3af;
  }
  .ap-pill {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    padding: 3px 9px;
    border-radius: 999px;
    white-space: nowrap;
  }
  .ap-pill--required { color: #ff2e7e; background: #ffe3ee; }
  .ap-pill--paid { color: #6b7280; background: #f3f4f6; }

  .ap-feature__price {
    flex-shrink: 0;
    text-align: right;
    padding-left: 8px;
  }
  .ap-feature__amount {
    display: block;
    font-size: 14px;
    font-weight: 700;
    color: #111827;
    white-space: nowrap;
  }
  .ap-feature__amount--paid {
    color: #9ca3af;
    text-decoration: line-through;
  }
  .ap-feature__fee {
    display: block;
    margin-top: 3px;
    font-size: 12px;
    font-weight: 600;
    color: #ff2e7e;
    white-space: nowrap;
  }

  /* ── "Select all" shortcut ── */
  .ap-selectall {
    align-self: flex-start;
    margin-top: 10px;
    background: none;
    border: none;
    padding: 0;
    font-family: inherit;
    font-size: 13px;
    font-weight: 600;
    color: #ff2e7e;
    cursor: pointer;
  }
  .ap-selectall:hover { text-decoration: underline; }

  /* ── CTA (mirrors .p2-cta) ── */
  .ap-cta {
    margin-top: 24px;
    width: 100%;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    border-radius: 999px;
    padding: 14px 22px;
    font-family: var(--font-bricolage), system-ui, sans-serif;
    font-size: 15px;
    font-weight: 700;
    cursor: pointer;
    border: 1.5px solid #ff2e7e;
    background: #ff2e7e;
    color: #fff;
    transition: box-shadow 0.18s, transform 0.12s;
  }
  .ap-cta:hover:not(:disabled) {
    box-shadow: 0 8px 22px rgba(255, 46, 126, 0.35);
    transform: translateY(-1px);
  }
  .ap-cta:disabled {
    background: #9ca3af;
    border-color: #9ca3af;
    cursor: not-allowed;
    box-shadow: none;
    transform: none;
  }

  .ap-note {
    margin-top: 14px;
    text-align: center;
    font-size: 12.5px;
    line-height: 1.6;
    color: #9ca3af;
  }
`;

export default ADDON_V2_CSS;
