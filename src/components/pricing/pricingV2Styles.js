/* ───────────────────────────────────────────────────────────────
   2hand2go-style pricing sections (V2).
   All classes are prefixed `p2-` so they never collide with the
   existing `pc-` / `pcr-` stacking-card styles.
   Fonts come from next/font CSS vars set on <html> in layout.js:
     --font-instrument-serif  (serif display heading)
     --font-playfair          (italic accent word)
     --font-bricolage         (sans body / labels / titles)
   Cards sit on top of the site's existing gradient theme — we do
   NOT set a section background, only style the white boxes.
   ─────────────────────────────────────────────────────────────── */
const PRICING_V2_CSS = `
  .p2-wrap {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: clamp(48px, 7vw, 96px);
    padding: clamp(24px, 5vw, 56px) 0 clamp(40px, 6vw, 80px);
  }

  .p2-section {
    width: min(1120px, 94vw);
    margin: 0 auto;
  }

  /* ── Section heading (sits on the gradient → light text) ── */
  .p2-head { text-align: center; margin-bottom: clamp(28px, 4vw, 48px); }
  .p2-eyebrow {
    font-family: var(--font-bricolage), system-ui, sans-serif;
    font-weight: 700;
    font-size: 13px;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: #ffe3ee;
    margin-bottom: 14px;
  }
  .p2-title {
    font-family: var(--font-instrument-serif), Georgia, serif;
    font-weight: 400;
    color: #ffffff;
    font-size: clamp(34px, 5.2vw, 60px);
    line-height: 1.05;
    letter-spacing: -0.01em;
  }
  .p2-title em {
    font-family: var(--font-playfair), Georgia, serif;
    font-style: italic;
    font-weight: 500;
  }
  .p2-subtitle {
    font-family: var(--font-bricolage), system-ui, sans-serif;
    font-weight: 400;
    color: rgba(255,255,255,0.92);
    font-size: clamp(14px, 1.5vw, 17px);
    line-height: 1.5;
    max-width: 620px;
    margin: 14px auto 0;
  }

  /* ── Card grid ── */
  .p2-grid {
    display: grid;
    gap: clamp(16px, 2vw, 24px);
    align-items: stretch;
  }

  /* ── Card ── */
  .p2-card {
    position: relative;
    display: flex;
    flex-direction: column;
    background: #ffffff;
    border: 1px solid #ececec;
    border-radius: 20px;
    padding: clamp(22px, 2.4vw, 32px);
    box-shadow: 0 18px 50px rgba(0,0,0,0.16);
    font-family: var(--font-bricolage), system-ui, sans-serif;
  }
  .p2-card--popular {
    border: 1.5px solid #ff2e7e;
    box-shadow: 0 24px 64px rgba(255,46,126,0.28);
  }
  .p2-badge {
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

  .p2-card__name {
    font-family: var(--font-playfair), Georgia, serif;
    font-style: italic;
    font-weight: 600;
    font-size: clamp(22px, 2.4vw, 28px);
    color: #ff2e7e;
    line-height: 1.1;
  }
  .p2-card__desc {
    margin-top: 8px;
    font-size: 14px;
    line-height: 1.5;
    color: #6b7280;
    min-height: 42px;
  }

  /* price */
  .p2-price {
    margin-top: 18px;
    display: flex;
    align-items: baseline;
    gap: 8px;
    flex-wrap: wrap;
  }
  .p2-price__num {
    font-weight: 800;
    font-size: clamp(30px, 4vw, 42px);
    color: #111827;
    line-height: 1;
    letter-spacing: -0.02em;
  }
  .p2-price__unit { font-size: 14px; font-weight: 600; color: #6b7280; }
  .p2-price__fee {
    margin-top: 6px;
    font-size: 13px;
    font-weight: 600;
    color: #ff2e7e;
  }

  /* features */
  .p2-features {
    margin-top: 20px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    flex: 1;
  }
  .p2-feature {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    font-size: 14px;
    line-height: 1.45;
    color: #374151;
  }
  .p2-check {
    flex-shrink: 0;
    margin-top: 1px;
    color: #ff2e7e;
    font-weight: 800;
    font-size: 14px;
  }

  /* ── CTA button (functionality preserved from old design) ── */
  .p2-cta {
    margin-top: 24px;
    width: 100%;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    text-decoration: none;
    border-radius: 999px;
    padding: 13px 22px;
    font-family: var(--font-bricolage), system-ui, sans-serif;
    font-size: 15px;
    font-weight: 700;
    cursor: pointer;
    border: 1.5px solid #ff2e7e;
    background: #ff2e7e;
    color: #fff;
    transition: background 0.18s, color 0.18s, transform 0.12s, box-shadow 0.18s;
  }
  .p2-cta:hover { box-shadow: 0 8px 22px rgba(255,46,126,0.35); transform: translateY(-1px); }
  .p2-cta--outline { background: #fff; color: #ff2e7e; }
  .p2-cta--outline:hover { background: #fff5f9; }
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

  /* ── Status banner (Preview Plans / No Plan) — matches the white cards ── */
  .p2-status {
    position: relative;
    display: flex;
    width: min(1120px, 94vw);
    margin: 0 auto clamp(28px, 4vw, 44px);
    background: #ffffff;
    border: 1px solid #ececec;
    border-radius: 20px;
    box-shadow: 0 18px 50px rgba(0,0,0,0.16);
    overflow: hidden;
    font-family: var(--font-bricolage), system-ui, sans-serif;
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
    font-family: var(--font-instrument-serif), Georgia, serif;
    font-weight: 400;
    color: #111827;
    font-size: clamp(28px, 3.4vw, 40px);
    line-height: 1.05;
    letter-spacing: -0.01em;
  }
  .p2-status__title em {
    font-family: var(--font-playfair), Georgia, serif;
    font-style: italic;
    font-weight: 600;
    color: #ff2e7e;
  }
  .p2-status__sub { font-size: 14px; color: #6b7280; font-weight: 500; }
  .p2-status__right {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: clamp(20px, 4vw, 56px);
    padding: clamp(20px, 2.6vw, 32px);
    border-left: 1px solid #f1f1f1;
    flex-wrap: wrap;
  }
  .p2-status__main {
    flex: 1 1 340px;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 14px;
  }
  .p2-status__heading { font-weight: 700; font-size: clamp(14px, 1.6vw, 18px); color: #111827; line-height: 1.3; }
  .p2-status__features {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px clamp(20px, 3vw, 40px);
  }
  .p2-status__feature { display: flex; align-items: flex-start; gap: 10px; font-size: 14px; color: #374151; line-height: 1.45; }
  .p2-status__badge {
    position: absolute;
    top: 14px;
    left: 50%;
    transform: translateX(-50%);
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
  .p2-status__cta {
    flex-shrink: 0;
    align-self: center;
    width: auto;
    margin-top: 0;
    padding: 13px 30px;
  }

  /* ── Responsive: collapse to a single column ── */
  @media (max-width: 860px) {
    .p2-grid { grid-template-columns: 1fr !important; }
    .p2-card__desc { min-height: 0; }
  }
  @media (max-width: 760px) {
    .p2-status { flex-direction: column; }
    .p2-status__left { width: 100%; }
    .p2-status__right {
      border-left: none;
      border-top: 1px solid #f1f1f1;
      flex-direction: column;
      align-items: flex-start;
    }
    .p2-status__features { grid-template-columns: 1fr; }
    .p2-status__cta { align-self: flex-start; }
  }
`;

export default PRICING_V2_CSS;
