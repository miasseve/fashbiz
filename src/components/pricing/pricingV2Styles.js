/* ───────────────────────────────────────────────────────────────
   leStoresworld.com pricing page styles (V7 — pixel-perfect).
   All classes prefixed `p2-`.
   Font: Inter per DESIGN.md.
   ─────────────────────────────────────────────────────────────── */
const PRICING_V2_CSS = `
  /* === Full-bleed background override === */
  .p2-page-bg {
    background: #fff5f7;
    position: relative;
    z-index: 1;
    min-height: 100vh;
    margin: -20px -15px -4px;
    padding: 0;
  }

  /* === Base wrap === */
  .p2-wrap {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: clamp(40px, 5vw, 64px);
    padding: clamp(48px, 6vw, 80px) 24px;
    background: #fff5f7;
  }

  /* === Page heading === */
  .p2-hero-head {
    text-align: center;
    margin-bottom: clamp(24px, 3vw, 40px);
  }
  .p2-title {
    font-family: "Inter", ui-sans-serif, system-ui, sans-serif;
    font-weight: 500;
    color: #111827;
    font-size: clamp(40px, 5vw, 60px);
    line-height: 1.05;
    letter-spacing: -0.01em;
  }

  /* === Card grid (2 columns) === */
  .p2-hero-grid {
    width: min(1200px, 100%);
    margin: 0 auto;
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 24px;
    align-items: stretch;
  }

  /* === Card === */
  .p2-card {
    position: relative;
    display: flex;
    flex-direction: column;
    background: #ffffff;
    border: 1px solid #e5e7eb;
    border-radius: 16px;
    padding: clamp(24px, 2.4vw, 32px);
    box-shadow: 0 1px 3px rgba(0,0,0,0.06);
    font-family: "Inter", ui-sans-serif, system-ui, sans-serif;
  }
  .p2-card--popular {
    border: 1.5px solid #ca2356;
    box-shadow: 0 4px 16px rgba(202,35,86,0.12);
  }
  .p2-badge {
    position: absolute;
    top: -13px;
    left: 50%;
    transform: translateX(-50%);
    background: #fce7f0;
    color: #ca2356;
    font-weight: 700;
    font-size: 11px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    padding: 6px 16px;
    border-radius: 999px;
    white-space: nowrap;
  }

  /* Card separator line */
  .p2-card__separator {
    width: 100%;
    height: 1px;
    background: #e5e7eb;
    margin: 16px 0;
  }

  /* Card heading */
  .p2-card__heading {
    font-family: "Inter", ui-sans-serif, system-ui, sans-serif;
    font-weight: 600;
    font-size: clamp(20px, 2vw, 26px);
    line-height: 1.15;
    color: #111827;
    margin: 0;
  }
  .p2-card__desc {
    margin-top: 8px;
    font-size: 14px;
    line-height: 1.5;
    color: #6b7280;
  }
  .p2-card__tagline {
    margin-top: 12px;
    font-weight: 700;
    font-size: 12px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: #111827;
    line-height: 1.4;
  }
  .p2-card__subdesc {
    margin-top: 0;
    font-size: 14px;
    line-height: 1.5;
    color: #6b7280;
  }

  /* Card description bullets (checkmarks) */
  .p2-card__bullets {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-top: 16px;
  }

  /* === Badge pill (inline) === */
  .p2-pill {
    display: inline-block;
    margin-top: 0;
    background: #fce7f0;
    color: #ca2356;
    font-weight: 700;
    font-size: 11px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    padding: 4px 12px;
    border-radius: 999px;
    align-self: flex-start;
  }

  /* === Price === */
  .p2-price {
    margin-top: 16px;
    display: flex;
    align-items: baseline;
    gap: 8px;
    flex-wrap: wrap;
  }
  .p2-price__num {
    font-weight: 500;
    font-size: clamp(30px, 4vw, 48px);
    color: #111827;
    line-height: 1;
    letter-spacing: -0.02em;
  }
  .p2-price__unit {
    font-size: 14px;
    font-weight: 500;
    color: #6b7280;
    line-height: 1.2;
  }
  .p2-price__meta {
    margin-top: 4px;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.10em;
    text-transform: uppercase;
    color: #6b7280;
  }
  .p2-price__fee {
    margin-top: 8px;
    font-size: 13px;
    font-weight: 600;
    color: #ca2356;
  }
  .p2-price__commitment {
    margin-top: 4px;
    font-size: 12px;
    font-weight: 500;
    color: #6b7280;
  }
  .p2-price__vat {
    margin-top: 4px;
    font-size: 12px;
    font-weight: 500;
    color: #6b7280;
  }
  .p2-vat-note {
    text-align: center;
    font-size: 12px;
    color: #6b7280;
    font-family: "Inter", ui-sans-serif, system-ui, sans-serif;
  }

  /* === Price row (pink bg, for right card) === */
  .p2-price-row {
    margin-top: 8px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    background: #fce7f0;
    border-radius: 12px;
    padding: 12px 16px;
  }
  .p2-price-row__label {
    font-weight: 600;
    font-size: 14px;
    color: #111827;
  }
  .p2-price-row__right {
    text-align: right;
    display: flex;
    flex-direction: column;
    gap: 2px;
    flex-shrink: 0;
  }
  .p2-price-row__amount {
    font-weight: 500;
    font-size: clamp(18px, 2vw, 24px);
    color: #111827;
    line-height: 1;
    letter-spacing: -0.01em;
  }
  .p2-price-row__meta {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.10em;
    text-transform: uppercase;
    color: #6b7280;
  }
  .p2-price-row__linkdesc {
    margin: 4px 0 0;
    font-size: 13px;
    font-weight: 400;
    color: #6b7280;
    line-height: 1.4;
  }

  /* === Features (checkmark list) === */
  .p2-features {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .p2-feature {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    font-size: 14px;
    line-height: 1.5;
    color: #374151;
  }
  .p2-check {
    flex-shrink: 0;
    margin-top: 1px;
    color: #ca2356;
    font-weight: 500;
    font-size: 14px;
  }

  /* "Not included" items (✕) */
  .p2-excluded {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    font-size: 14px;
    line-height: 1.5;
    color: #9ca3af;
  }
  .p2-cross {
    flex-shrink: 0;
    margin-top: 1px;
    color: #9ca3af;
    font-weight: 500;
    font-size: 14px;
  }

  /* === Accordion === */
  .p2-accordion__toggle {
    margin-top: auto;
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 0;
    border: none;
    border-top: 1px solid #e5e7eb;
    background: none;
    font-family: "Inter", ui-sans-serif, system-ui, sans-serif;
    font-weight: 600;
    font-size: 14px;
    color: #111827;
    cursor: pointer;
    transition: color 0.18s;
  }
  .p2-accordion__toggle:hover { color: #ca2356; }
  .p2-accordion__chevron {
    font-size: 16px;
    transition: transform 0.2s;
    color: #6b7280;
  }
  .p2-accordion__chevron--open { transform: rotate(180deg); }
  .p2-accordion__content { padding: 0 0 16px; }
  .p2-accordion__section-title {
    font-weight: 700;
    font-size: 11px;
    letter-spacing: 0.10em;
    text-transform: uppercase;
    color: #6b7280;
    margin: 16px 0 8px;
  }
  .p2-accordion__section-title:first-child { margin-top: 0; }

  /* === CTA button === */
  .p2-card > .p2-cta,
  .p2-card > .p2-cta--outline,
  .p2-card > a.p2-cta,
  .p2-card > a.p2-cta--outline { margin-top: auto; }
  .p2-cta {
    margin-top: 16px;
    width: 100%;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    text-decoration: none;
    border-radius: 999px;
    padding: 13px 24px;
    font-family: "Inter", ui-sans-serif, system-ui, sans-serif;
    font-size: 15px;
    font-weight: 700;
    cursor: pointer;
    border: 1.5px solid #ca2356;
    background: #ca2356;
    color: #fff;
    transition: background 0.18s, color 0.18s, transform 0.12s, box-shadow 0.18s;
  }
  .p2-cta:hover {
    background: #b80049;
    box-shadow: 0 8px 20px rgba(202,35,86,0.28);
    transform: translateY(-1px);
  }
  .p2-cta--outline { background: transparent; color: #ca2356; }
  .p2-cta--outline:hover { background: #fff0f5; }
  .p2-cta--subscribed,
  .p2-cta--subscribed:hover {
    background: #9ca3af;
    border-color: #9ca3af;
    color: #fff;
    cursor: not-allowed;
    box-shadow: none;
    transform: none;
  }
  .p2-cta--readonly { opacity: 0.9; }

  /* Text link CTA */
  .p2-cta--text {
    background: none;
    border: none;
    padding: 0;
    display: inline-block;
    cursor: pointer;
    color: #ca2356;
    font-weight: 600;
    font-size: 14px;
    font-family: "Inter", ui-sans-serif, system-ui, sans-serif;
    text-decoration: none;
    transition: color 0.18s;
  }
  .p2-cta--text:hover { color: #b80049; }
  .p2-cta--text-muted {
    color: #9ca3af;
    cursor: not-allowed;
  }

  /* === Dark banner (Head Start) — 2-column layout === */
  .p2-banner {
    width: min(1200px, 100%);
    margin: 0 auto;
    background: linear-gradient(160deg, #1a1028, #2a1538);
    border-radius: 16px;
    padding: clamp(32px, 4vw, 48px);
    color: #ffffff;
    font-family: "Inter", ui-sans-serif, system-ui, sans-serif;
  }
  .p2-banner__eyebrow {
    font-weight: 700;
    font-size: 12px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: #ca2356;
    margin-bottom: 16px;
  }
  .p2-banner__layout {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: clamp(24px, 3vw, 48px);
    align-items: start;
  }
  .p2-banner__left {
    display: flex;
    flex-direction: column;
  }
  .p2-banner__right {
    display: flex;
    flex-direction: column;
  }
  .p2-banner__title {
    font-weight: 700;
    font-size: clamp(20px, 2.5vw, 28px);
    line-height: 1.2;
    color: #ffffff;
    margin: 0 0 16px;
  }
  .p2-banner__subtitle {
    font-size: 14px;
    line-height: 1.6;
    color: rgba(255,255,255,0.7);
    margin: 0 0 20px;
    font-weight: 400;
  }
  .p2-banner__see-detail {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-weight: 600;
    font-size: 14px;
    color: #ca2356;
    text-decoration: none;
    transition: color 0.18s;
    cursor: default;
  }
  .p2-banner__see-detail:hover { color: #ff6b9d; }

  /* Bordered table card inside dark banner */
  .p2-banner__table-card {
    border: 1px solid rgba(255,255,255,0.15);
    border-radius: 12px;
    padding: clamp(16px, 2vw, 24px);
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .p2-banner__row {
    display: flex;
    justify-content: space-between;
    gap: 32px;
    font-size: 14px;
    font-weight: 400;
    color: rgba(255,255,255,0.8);
    padding: 4px 0;
  }
  .p2-banner__row--total {
    border-top: 1px solid rgba(255,255,255,0.2);
    padding-top: 12px;
    margin-top: 4px;
    font-weight: 700;
    color: #ffffff;
    font-size: 14px;
    align-items: baseline;
  }
  .p2-banner__total-label {
    font-weight: 700;
    font-size: 12px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: rgba(255,255,255,0.6);
  }
  .p2-banner__total-value {
    font-weight: 500;
    font-size: clamp(28px, 4vw, 44px);
    color: #ca2356;
    line-height: 1;
    letter-spacing: -0.02em;
  }
  .p2-banner__footnote {
    margin-top: 16px;
    font-size: 12px;
    line-height: 1.5;
    color: rgba(255,255,255,0.45);
  }

  /* === "Already have part of it?" === */
  .p2-partial {
    width: min(1200px, 100%);
    margin: 0 auto;
    background: #ffffff;
    border: 1px solid #e5e7eb;
    border-radius: 16px;
    padding: clamp(24px, 3vw, 32px);
    font-family: "Inter", ui-sans-serif, system-ui, sans-serif;
  }
  .p2-partial__title {
    font-weight: 700;
    font-size: 12px;
    letter-spacing: 0.10em;
    text-transform: uppercase;
    color: #111827;
    margin-bottom: 24px;
    text-align: center;
  }
  .p2-partial__grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 24px;
  }
  .p2-partial__col {
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 0 16px;
    border-right: 1px solid #e5e7eb;
  }
  .p2-partial__col:last-child { border-right: none; }
  .p2-partial__eyebrow {
    font-weight: 700;
    font-size: 11px;
    letter-spacing: 0.10em;
    text-transform: uppercase;
    color: #ca2356;
    margin-bottom: 8px;
  }
  .p2-partial__name {
    font-weight: 600;
    font-size: 15px;
    color: #111827;
  }
  .p2-partial__desc {
    font-size: 14px;
    color: #6b7280;
    line-height: 1.5;
    margin-top: 4px;
  }
  .p2-partial__desc--secondary {
    font-size: 13px;
    color: #9ca3af;
    margin-top: 2px;
  }
  .p2-partial__price {
    font-size: 13px;
    font-weight: 500;
    color: #6b7280;
    margin-top: 4px;
  }
  .p2-partial__price--bold {
    font-weight: 700;
    font-size: 14px;
    color: #111827;
  }
  /* Plain text list for the Link column (no checkmarks) */
  .p2-partial__plain-list {
    margin-top: 8px;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .p2-partial__plain-list p {
    margin: 0;
    font-size: 13px;
    line-height: 1.5;
    color: #6b7280;
  }
  .p2-partial__col .p2-cta--text { margin-top: auto; padding-top: 8px; }

  /* === Standalone Link section === */
  .p2-link {
    width: min(1200px, 100%);
    margin: 0 auto;
  }
  .p2-link__grid {
    display: grid;
    grid-template-columns: 1.4fr 1fr;
    gap: 24px;
    align-items: stretch;
  }
  .p2-link__card {
    display: flex;
    flex-direction: column;
    background: #ffffff;
    border: 1px solid #e5e7eb;
    border-radius: 16px;
    padding: clamp(24px, 2.4vw, 32px);
    box-shadow: 0 1px 3px rgba(0,0,0,0.06);
    font-family: "Inter", ui-sans-serif, system-ui, sans-serif;
  }
  .p2-link__card--quote {
    background: #fce7f0;
    border-color: transparent;
    justify-content: center;
    align-items: center;
    text-align: center;
  }
  .p2-link__eyebrow {
    font-weight: 700;
    font-size: 11px;
    letter-spacing: 0.10em;
    text-transform: uppercase;
    color: #ca2356;
    margin-bottom: 8px;
  }
  .p2-link__title {
    font-weight: 600;
    font-size: clamp(18px, 2vw, 22px);
    line-height: 1.25;
    color: #111827;
    margin: 0 0 12px;
  }
  .p2-link__price {
    display: flex;
    align-items: baseline;
    gap: 8px;
    flex-wrap: wrap;
    margin-bottom: 12px;
  }
  .p2-link__amount {
    font-weight: 500;
    font-size: clamp(24px, 3vw, 32px);
    color: #111827;
    line-height: 1;
    letter-spacing: -0.01em;
  }
  .p2-link__meta {
    font-size: 12px;
    font-weight: 500;
    color: #6b7280;
    line-height: 1.3;
  }
  .p2-link__desc {
    font-size: 14px;
    line-height: 1.6;
    color: #6b7280;
    margin: 0 0 16px;
  }
  .p2-link__features {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-bottom: 16px;
  }
  .p2-link__card .p2-cta--text { margin-top: auto; }
  .p2-link__card--quote .p2-cta {
    width: auto;
    min-width: 200px;
    margin-top: 16px;
  }

  /* === Pro / 3+ locations strip === */
  .p2-pro {
    width: min(1200px, 100%);
    margin: 0 auto;
    background: #ffffff;
    border: 1px solid #e5e7eb;
    border-radius: 16px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.06);
    padding: clamp(18px, 2.2vw, 26px);
    font-family: "Inter", ui-sans-serif, system-ui, sans-serif;
  }
  .p2-pro__row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    flex-wrap: wrap;
  }
  .p2-pro__text {
    font-weight: 700;
    font-size: clamp(15px, 1.8vw, 19px);
    color: #111827;
  }
  .p2-pro__actions {
    display: flex;
    align-items: center;
    gap: 16px;
    flex-wrap: wrap;
  }
  .p2-pro__toggle {
    background: none;
    border: none;
    color: #6b7280;
    font-weight: 600;
    font-size: 14px;
    cursor: pointer;
    font-family: inherit;
    transition: color 0.18s;
  }
  .p2-pro__toggle:hover { color: #111827; }
  .p2-pro__details {
    margin-top: 16px;
    padding-top: 16px;
    border-top: 1px solid #e5e7eb;
  }
  .p2-pro__grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px clamp(24px, 4vw, 48px);
  }

  /* === Bottom contact block === */
  .p2-bottom {
    width: min(1200px, 100%);
    margin: 0 auto;
  }
  .p2-bottom__card {
    background: #fce7f0;
    border-radius: 16px;
    padding: clamp(32px, 4vw, 48px);
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
  }
  .p2-bottom__title {
    font-family: "Inter", ui-sans-serif, system-ui, sans-serif;
    font-weight: 600;
    color: #111827;
    font-size: clamp(20px, 2.5vw, 28px);
    line-height: 1.2;
  }
  .p2-bottom__actions {
    display: flex;
    align-items: center;
    gap: 18px;
    flex-wrap: wrap;
    justify-content: center;
  }
  .p2-bottom__phone {
    color: #111827;
    font-weight: 600;
    font-size: 15px;
    font-family: "Inter", ui-sans-serif, system-ui, sans-serif;
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
  .p2-bottom__phone-icon {
    color: #111827;
    flex-shrink: 0;
  }
  .p2-bottom__phone a { color: #ca2356; text-decoration: underline; }
  .p2-bottom .p2-cta {
    padding: 13px 32px;
    width: auto;
    min-width: 200px;
  }

  /* === Status banner (Preview Plans / No Plan) === */
  .p2-status {
    position: relative;
    display: flex;
    width: min(1200px, 100%);
    margin: 0 auto clamp(28px, 4vw, 44px);
    background: #ffffff;
    border: 1px solid #e5e7eb;
    border-radius: 16px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.06);
    overflow: hidden;
    font-family: "Inter", ui-sans-serif, system-ui, sans-serif;
  }
  .p2-status__left {
    width: clamp(180px, 26%, 260px);
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 8px;
    padding: clamp(22px, 2.6vw, 34px);
  }
  .p2-status__title {
    font-family: "Inter", ui-sans-serif, system-ui, sans-serif;
    font-weight: 400;
    color: #111827;
    font-size: clamp(28px, 3.4vw, 40px);
    line-height: 1.05;
    letter-spacing: -0.01em;
  }
  .p2-status__title em {
    font-family: "Inter", ui-sans-serif, system-ui, sans-serif;
    font-style: italic;
    font-weight: 600;
    color: #ca2356;
  }
  .p2-status__sub { font-size: 14px; color: #6b7280; font-weight: 500; }
  .p2-status__right {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: clamp(20px, 4vw, 56px);
    padding: clamp(20px, 2.6vw, 32px);
    border-left: 1px solid #e5e7eb;
    flex-wrap: wrap;
  }
  .p2-status__main {
    flex: 1 1 340px;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 14px;
  }
  .p2-status__heading {
    font-weight: 700;
    font-size: clamp(14px, 1.6vw, 18px);
    color: #111827;
    line-height: 1.3;
  }
  .p2-status__features {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px clamp(20px, 3vw, 40px);
  }
  .p2-status__feature {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    font-size: 14px;
    color: #374151;
    line-height: 1.45;
  }
  .p2-status__badge {
    position: absolute;
    top: 14px;
    right: 16px;
    font-weight: 700;
    font-size: 11px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    padding: 6px 16px;
    border-radius: 999px;
    color: #fff;
    white-space: nowrap;
  }
  .p2-status__badge--inactive { background: #ff4d6d; }
  .p2-status__badge--active { background: #22c55e; }
  .p2-status__cta {
    flex-shrink: 0;
    align-self: center;
    width: auto;
    margin-top: 0;
    padding: 13px 30px;
  }
  .p2-status__dates {
    display: flex;
    gap: clamp(16px, 3vw, 32px);
    flex-wrap: wrap;
  }
  .p2-status__date-label { font-weight: 700; color: #111827; font-size: 14px; }
  .p2-status__date-val { font-weight: 600; color: #111827; font-size: 14px; }
  .p2-status__note {
    font-size: 13px;
    color: #92400e;
    line-height: 1.6;
    background: rgba(234, 179, 8, 0.15);
    border-radius: 12px;
    padding: 10px 14px;
    font-weight: 500;
    margin-top: 2px;
  }
  .p2-status__cancel {
    align-self: flex-start;
    margin-top: 2px;
    border: none;
    border-radius: 999px;
    padding: 11px 26px;
    font-family: "Inter", ui-sans-serif, system-ui, sans-serif;
    font-size: 15px;
    font-weight: 700;
    color: #fff;
    background: #ef4444;
    cursor: pointer;
    transition: background 0.18s, box-shadow 0.18s, transform 0.12s;
  }
  .p2-status__cancel:hover {
    background: #dc2626;
    box-shadow: 0 8px 22px rgba(239, 68, 68, 0.35);
    transform: translateY(-1px);
  }

  /* === Responsive === */
  @media (min-width: 1024px) {
    .p2-page-bg {
      margin: -20px;
    }
  }
  @media (max-width: 860px) {
    .p2-hero-grid { grid-template-columns: 1fr !important; }
    .p2-partial__grid { grid-template-columns: 1fr; }
    .p2-partial__col {
      border-right: none;
      border-bottom: 1px solid #e5e7eb;
      padding: 16px 0;
    }
    .p2-partial__col:last-child { border-bottom: none; }
    .p2-pro__grid { grid-template-columns: 1fr; }
    .p2-link__grid { grid-template-columns: 1fr; }
    .p2-banner__layout { grid-template-columns: 1fr; }
  }
  @media (max-width: 760px) {
    .p2-status { flex-direction: column; }
    .p2-status__left { width: 100%; }
    .p2-status__right {
      border-left: none;
      border-top: 1px solid #e5e7eb;
      flex-direction: column;
      align-items: flex-start;
    }
    .p2-status__features { grid-template-columns: 1fr; }
    .p2-status__cta { align-self: flex-start; }
  }
  @media (max-width: 640px) {
    .p2-bottom__actions { flex-direction: column; }
  }
`;

export default PRICING_V2_CSS;