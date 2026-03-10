/* ─── CSS for the pricing cards (matching slider design) ─── */
const PRICING_CSS = `
  /* ── Scroll section ── */
  .pricing-section {
    height: 300vh;
    position: relative;
  }
  .pricing-sticky {
    position: sticky;
    top: 71px;
    height: calc(100vh - 71px);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-start;
    padding-top: clamp(12px, 3vh, 32px);
    overflow: hidden;
    width: 100%;
    max-width: 100%;
  }
  .pricing-card-wrapper {
    position: absolute;
    inset: 0;
    will-change: transform, opacity;
    transform-origin: top center;
  }

  /* ── Card ── */
  .pc {
    border-radius: 26px;
    overflow: hidden;
    width: 100%;
    height: 100%;
    display: flex;
    position: relative;
  }
  .pc--light {
    background: #e2e2e2;
    border: 1px solid rgba(0,0,0,0.08);
    box-shadow: 0 24px 72px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.07);
  }
  .pc--lime {
    background: #D6FF3F;
    border: 1px solid rgba(0,0,0,0.08);
    box-shadow: 0 24px 72px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.07);
  }
  .pc--dark {
    background: #111111;
    border: 1px solid rgba(255,255,255,0.07);
    box-shadow: 0 24px 72px rgba(0,0,0,0.7), 0 2px 8px rgba(0,0,0,0.4);
  }

  /* ── Left panel ── */
  .pc__left-wrap {
    width: clamp(200px, 28%, 280px);
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
  }
  .pc--light .pc__left-wrap { border-right: 1px solid rgba(0,0,0,0.08); }
  .pc--lime  .pc__left-wrap { border-right: 1px solid rgba(0,0,0,0.08); }
  .pc--dark  .pc__left-wrap { border-right: 1px solid rgba(255,255,255,0.07); }
  .pc__left {
    flex: 1;
    padding: clamp(14px,2vw,22px) clamp(10px,1.5vw,18px);
    display: flex;
    flex-direction: column;
  }

  .pc__badge {
    font-weight: 800;
    font-size: clamp(18px, 2.4vw, 28px);
    line-height: 1.1;
    margin-bottom: 3px;
    word-break: break-word;
    overflow-wrap: break-word;
  }
  .pc--light .pc__badge { color: #111; }
  .pc--lime  .pc__badge { color: #111; }
  .pc--dark  .pc__badge { color: #fff; }

  .pc__subtitles {
    font-weight: 800;
    font-size: clamp(11px, 1.6vw, 16px);
    line-height: 1.25;
    margin-bottom: 8px;
  }
  .pc--light .pc__subtitles { color: #5b21b6; }
  .pc--lime  .pc__subtitles { color: #3a5c00; }
  .pc--dark  .pc__subtitles { color: #c084fc; }

  .pc__features {
    display: flex;
    flex-direction: column;
    gap: 3px;
  }
  .pc__feature {
    display: flex;
    align-items: flex-start;
    gap: 6px;
    font-size: clamp(12px, 1.15vw, 14px);
    line-height: 1.45;
    font-weight: 500;
  }
  .pc--light .pc__feature { color: #1f2937; }
  .pc--lime  .pc__feature { color: #1f2937; }
  .pc--dark  .pc__feature { color: rgba(255,255,255,0.9); }

  .pc__feature--bold { font-weight: 700; color: #5b21b6 !important; }

  .pc__promo {
    padding: 10px clamp(10px,1.5vw,18px) clamp(12px,1.5vw,16px);
    font-size: clamp(13px, 1.4vw, 16px);
    font-weight: 600;
    line-height: 1.5;
    color: #7c3aed;
    flex-shrink: 0;
  }
  .pc--dark .pc__promo { color: #c084fc; }

  .pc__bullet {
    font-size: 13px;
    line-height: 1.5;
    flex-shrink: 0;
    font-weight: 400;
  }
  .pc--light .pc__bullet { color: #6b7280; }
  .pc--lime  .pc__bullet { color: #4b5563; }
  .pc--dark  .pc__bullet { color: rgba(255,255,255,0.5); }

  /* ── Tiers grid ── */
  .pc__tiers {
    flex: 1;
    display: grid;
    grid-template-columns: repeat(var(--tier-cols, 3), 1fr);
  }

  .pc__tier {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: clamp(10px,2vw,20px) clamp(8px,1.4vw,14px);
    gap: 6px;
    text-align: center;
  }
  .pc__tier + .pc__tier {
    border-left: 1px solid;
  }
  .pc--light .pc__tier + .pc__tier { border-color: rgba(0,0,0,0.08); }
  .pc--lime  .pc__tier + .pc__tier { border-color: rgba(0,0,0,0.08); }
  .pc--dark  .pc__tier + .pc__tier { border-color: rgba(255,255,255,0.07); }

  .pc__tier-header {
    background: #ede9fe;
    border-radius: 12px;
    padding: 7px 7px;
    font-size: clamp(8px, 1.1vw, 11px);
    color: #4b5563;
    font-weight: 500;
    text-align: center;
    white-space: pre-line;
    line-height: 1.5;
    width: 100%;
    margin-bottom: 6px;
  }
  .pc--lime .pc__tier-header { background: rgba(0,0,0,0.06); }
  .pc--dark .pc__tier-header { background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.7); }

  .pc__price {
    font-weight: 800;
    font-size: clamp(13px, 1.8vw, 20px);
    line-height: 1.3;
    white-space: pre-line;
  }
  .pc--light .pc__price { color: #5b21b6; }
  .pc--lime  .pc__price { color: #5b21b6; }
  .pc--dark  .pc__price { color: #fff; }

  .pc__period {
    font-size: clamp(10px, 1.2vw, 13px);
    line-height: 1.5;
    white-space: pre-line;
  }
  .pc--light .pc__period { color: #555; }
  .pc--lime  .pc__period { color: #2a4400; }
  .pc--dark  .pc__period { color: rgba(255,255,255,0.55); }

  .pc__cta {
    margin-top: 6px;
    background: #e9b8f5;
    color: #2d0040;
    border: none;
    border-radius: 999px;
    padding: 7px 18px;
    font-size: clamp(10px, 1.1vw, 12px);
    font-weight: 600;
    cursor: pointer;
    letter-spacing: 0.02em;
    transition: background 0.2s, transform 0.15s;
  }
  .pc__cta:hover {
    background: #d89ee8;
    transform: scale(1.04);
  }
  .pc__cta--subscribed {
    background: #9ca3af;
    color: #4b5563;
    cursor: not-allowed;
  }
  .pc__cta--subscribed:hover {
    background: #9ca3af;
    transform: none;
  }

  .pc__tier-name {
    font-weight: 800;
    font-size: clamp(10px, 1.3vw, 14px);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: 4px;
  }
  .pc--light .pc__tier-name { color: #111; }
  .pc--lime  .pc__tier-name { color: #111; }
  .pc--dark  .pc__tier-name { color: #fff; }

  /* ── Tier overview (static above cards) ── */
  .pricing-tier-overview {
    width: 100%;
    display: flex;
    align-items: flex-start;
    gap: clamp(10px, 1.5vw, 20px);
    margin-bottom: 14px;
    flex-shrink: 0;
    position: sticky;
    top: 71px;
    z-index: 50;
    padding: 12px clamp(8px, 1.5vw, 16px);
    box-sizing: border-box;
  }
  .pricing-tier-left-spacer {
    width: clamp(160px, 22%, 230px);
    flex-shrink: 0;
  }
  .pricing-tier-cols {
    display: grid;
    gap: 0;
    flex: 1;
    min-width: 0;
  }
  .pricing-tier-col--right {
    width: clamp(180px, 22vw, 280px);
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    padding: 0 clamp(8px,1.4vw,14px);
  }
  .pricing-tier-col {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    padding: 0 clamp(8px,1.4vw,14px);
  }
  .pricing-tier-col + .pricing-tier-col {
    border-left: 1px solid rgba(0,0,0,0.08);
  }
  .pricing-tier-col__name {
    font-weight: 800;
    font-size: clamp(14px, 1.8vw, 20px);
    text-transform: uppercase;
    color: #111;
    letter-spacing: 0.03em;
  }
  .pricing-tier-col__info {
    background: #f3e8ff;
    border-radius: 12px;
    padding: 10px 14px;
    font-size: clamp(11px, 1.2vw, 13px);
    color: #4b5563;
    font-weight: 500;
    text-align: center;
    line-height: 1.6;
    width: 100%;
  }

  /* ── Two-column row ── */
  .pricing-row {
    display: flex;
    align-items: flex-start;
    gap: clamp(10px, 1.5vw, 20px);
    width: 100%;
    max-width: 100%;
    padding: 0 clamp(8px, 1.5vw, 16px);
    box-sizing: border-box;
  }
  .pricing-stack {
    position: relative;
    flex: 1;
    height: 500px;
    min-width: 0;
    width: auto;
  }
  .pricing-stack-right {
    position: relative;
    width: clamp(180px, 22vw, 280px);
    height: 500px;
    flex-shrink: 0;
  }

  /* ══════════════════════════════════════
     ── RIGHT compact cards ──
  ══════════════════════════════════════ */
  .pcr {
    border-radius: 26px;
    overflow: hidden;
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    position: relative;
  }
  .pcr--light {
    background: #e2e2e2;
    border: 1px solid rgba(0,0,0,0.08);
    box-shadow: 0 24px 72px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.07);
  }
  .pcr--lime {
    background: #D6FF3F;
    border: 1px solid rgba(0,0,0,0.08);
    box-shadow: 0 24px 72px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.07);
  }
  .pcr--dark {
    background: #111111;
    border: 1px solid rgba(255,255,255,0.07);
    box-shadow: 0 24px 72px rgba(0,0,0,0.7), 0 2px 8px rgba(0,0,0,0.4);
  }

  .pcr__header {
    padding: clamp(10px,1.6vw,16px) clamp(12px,1.8vw,18px) 6px;
    font-weight: 800;
    font-size: clamp(9px,1vw,11px);
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }
  .pcr--light .pcr__header { color: rgba(0,0,0,0.35); border-bottom: 1px solid rgba(0,0,0,0.07); }
  .pcr--lime  .pcr__header { color: rgba(0,0,0,0.45); border-bottom: 1px solid rgba(0,0,0,0.07); }
  .pcr--dark  .pcr__header { color: rgba(255,255,255,0.3); border-bottom: 1px solid rgba(255,255,255,0.07); }

  .pcr__body {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: clamp(10px,1.6vw,18px) clamp(12px,1.8vw,18px);
    gap: 4px;
  }

  .pcr__badge {
    font-weight: 800;
    font-size: clamp(18px,2.2vw,26px);
    line-height: 1;
    margin-bottom: 2px;
  }
  .pcr--light .pcr__badge { color: #111; }
  .pcr--lime  .pcr__badge { color: #111; }
  .pcr--dark  .pcr__badge { color: #fff; }

  .pcr__subtitles {
    font-weight: 800;
    font-size: clamp(9px,1.1vw,12px);
    line-height: 1.3;
    margin-bottom: 8px;
  }
  .pcr--light .pcr__subtitles { color: #5b21b6; }
  .pcr--lime  .pcr__subtitles { color: #3a5c00; }
  .pcr--dark  .pcr__subtitles { color: #c084fc; }

  .pcr__row {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 6px;
    font-size: clamp(9px,1.05vw,11.5px);
    line-height: 1.5;
    padding: 2px 0;
  }
  .pcr--light .pcr__row { border-bottom: 1px solid rgba(0,0,0,0.06); color: #111; }
  .pcr--lime  .pcr__row { border-bottom: 1px solid rgba(0,0,0,0.06); color: #111; }
  .pcr--dark  .pcr__row { border-bottom: 1px solid rgba(255,255,255,0.06); color: #fff; }
  .pcr__row:last-of-type { border-bottom: none; }

  .pcr__row-label {
    display: flex;
    align-items: flex-start;
    gap: 5px;
    flex: 1;
  }
  .pcr__bullet {
    font-size: 13px;
    line-height: 1.2;
    flex-shrink: 0;
  }
  .pcr--light .pcr__bullet { color: #5b21b6; }
  .pcr--lime  .pcr__bullet { color: #5b21b6; }
  .pcr--dark  .pcr__bullet { color: rgba(255,255,255,0.4); }

  .pcr__row-price {
    font-weight: 800;
    font-size: clamp(11px,1.4vw,15px);
    white-space: nowrap;
    flex-shrink: 0;
  }
  .pcr--light .pcr__row-price { color: #5b21b6; }
  .pcr--lime  .pcr__row-price { color: #5b21b6; }
  .pcr--dark  .pcr__row-price { color: #fff; }

  .pcr__price-block {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .pcr__price-big {
    font-weight: 800;
    font-size: clamp(16px,2vw,24px);
    line-height: 1.1;
  }
  .pcr--light .pcr__price-big { color: #5b21b6; }
  .pcr--lime  .pcr__price-big { color: #5b21b6; }
  .pcr--dark  .pcr__price-big { color: #fff; }

  .pcr__price-sub {
    font-size: clamp(10px,1.1vw,12.5px);
    line-height: 1.55;
    white-space: pre-line;
  }
  .pcr--light .pcr__price-sub { color: #555; }
  .pcr--lime  .pcr__price-sub { color: #2a4400; }
  .pcr--dark  .pcr__price-sub { color: rgba(255,255,255,0.55); }

  /* ── Dots / controls ── */
  .pricing-dots {
    margin-top: 22px;
    display: flex;
    gap: 6px;
    align-items: center;
  }
  .pricing-dot {
    height: 6px;
    border-radius: 999px;
    transition: width 0.45s cubic-bezier(0.34,1.56,0.64,1), background 0.4s;
  }
  .pricing-label {
    margin-top: 8px;
    font-weight: 700;
    font-size: 10px;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: rgba(0,0,0,0.35);
    transition: opacity 0.3s;
  }

  /* ── Mobile-only blocks (hidden on desktop) ── */
  .pricing-mobile-info {
    display: none;
  }
  .pricing-mobile-nosub {
    display: none;
  }

  /* ══════════════════════════════════════
     ── MOBILE RESPONSIVE ──
  ══════════════════════════════════════ */
  @media (max-width: 768px) {
    /* ── Scroll section ── */
    .pricing-section {
      height: auto;
    }
    .pricing-sticky {
      position: relative;
      top: auto;
      height: auto;
      overflow: visible;
      padding-top: 12px;
    }

    /* ── Row: stack vertically ── */
    .pricing-row {
      flex-direction: column;
      gap: 16px;
      padding: 0 12px;
    }
    .pricing-stack,
    .pricing-stack-right {
      position: relative;
      width: 100%;
      height: auto;
      flex-shrink: unset;
    }

    /* ── Card wrappers: no absolute stacking ── */
    .pricing-card-wrapper {
      position: relative !important;
      inset: auto !important;
      transform: none !important;
      opacity: 1 !important;
      margin-bottom: 16px;
    }

    /* ── Main card: vertical layout ── */
    .pc {
      flex-direction: column;
      height: auto;
      border-radius: 20px;
    }
    .pc__left-wrap {
      width: 100%;
      border-right: none !important;
      border-bottom: 1px solid rgba(0,0,0,0.08);
    }
    .pc--dark .pc__left-wrap {
      border-bottom: 1px solid rgba(255,255,255,0.07) !important;
    }
    .pc__left {
      padding: 18px 16px 12px;
    }
    .pc__badge {
      font-size: 22px;
    }
    .pc__subtitles {
      font-size: 13px;
    }
    .pc__feature {
      font-size: 14px;
    }

    /* ── Tiers: stack vertically ── */
    .pc__tiers {
      grid-template-columns: 1fr !important;
      width: 100%;
    }
    .pc__tier {
      padding: 16px;
      border-left: none !important;
      border-top: 1px solid rgba(0,0,0,0.08);
    }
    .pc__tier:first-child {
      border-top: none;
    }
    .pc--dark .pc__tier {
      border-top-color: rgba(255,255,255,0.07);
    }
    .pc__tier-name {
      font-size: 15px;
    }
    .pc__tier-header {
      font-size: 12px;
    }
    .pc__price {
      font-size: 20px;
    }
    .pc__period {
      font-size: 13px;
    }
    .pc__cta {
      padding: 10px 24px;
      font-size: 14px;
    }

    /* ── Right compact cards: full width ── */
    .pcr {
      border-radius: 20px;
      height: auto;
    }
    .pcr__header {
      font-size: 12px;
      padding: 14px 16px 8px;
    }
    .pcr__body {
      padding: 16px;
    }
    .pcr__badge {
      font-size: 22px;
    }
    .pcr__subtitles {
      font-size: 13px;
    }
    .pcr__row {
      font-size: 13px;
    }
    .pcr__row-price {
      font-size: 15px;
    }
    .pcr__price-big {
      font-size: 22px;
    }
    .pcr__price-sub {
      font-size: 13px;
    }

    /* ── Tier overview: hide on mobile ── */
    .pricing-tier-overview {
      display: none;
    }

    /* ── Mobile-only info block ── */
    .pricing-mobile-info {
      display: flex;
      flex-direction: column;
      gap: 16px;
      width: 100%;
      padding: 0 16px;
      box-sizing: border-box;
      margin-bottom: 20px;
    }
    .pricing-mobile-info__card {
      background: #fff;
      border-radius: 18px;
      padding: 4px 20px;
      display: flex;
      flex-direction: column;
      gap: 0;
      box-shadow: 0 4px 20px rgba(0,0,0,0.1);
    }
    .pricing-mobile-info__row {
      padding: 14px 0;
    }
    .pricing-mobile-info__divider {
      height: 1px;
      background: #e5e7eb;
    }
    .pricing-mobile-info__tier-name {
      font-weight: 800;
      font-size: 17px;
      text-transform: uppercase;
      color: #111;
      margin-bottom: 6px;
      letter-spacing: 0.03em;
    }
    .pricing-mobile-info__tier-detail {
      font-size: 14px;
      color: #4b5563;
      font-weight: 500;
      line-height: 1.7;
    }
    .pricing-mobile-info__nosub-title {
      font-weight: 800;
      font-size: 18px;
      text-transform: uppercase;
      color: #111;
      letter-spacing: 0.03em;
    }
    .pricing-mobile-info__nosub-card {
      background: #f3e8ff;
      border-radius: 16px;
      padding: 16px 24px;
      font-size: 15px;
      color: #374151;
      font-weight: 700;
      text-align: center;
      line-height: 1.6;
      width: 100%;
      box-shadow: 0 2px 12px rgba(0,0,0,0.06);
    }
    .pricing-mobile-nosub {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      width: 100%;
      margin-bottom: 8px;
    }

    /* ── Status card ── */
    .pc-status {
      flex-direction: column;
      max-width: 95vw !important;
    }
    .pc-status__left {
      width: 100% !important;
      border-right: none !important;
      border-bottom: 1px solid rgba(0,0,0,0.08);
      padding: 16px !important;
    }

    /* ── Dots ── */
    .pricing-dots {
      display: none;
    }
    .pricing-label {
      display: none;
    }
  }

  /* ── Small mobile tweaks ── */
  @media (max-width: 480px) {
    .pc__badge {
      font-size: 20px;
    }
    .pc__tier {
      padding: 14px 12px;
    }
    .pc__price {
      font-size: 18px;
    }
    .pc__feature {
      font-size: 14px;
    }
    .pricing-mobile-info__tier-name {
      font-size: 15px;
    }
    .pricing-mobile-info__tier-detail {
      font-size: 12px;
    }
    .pricing-mobile-info__nosub-title {
      font-size: 16px;
    }
    .pricing-mobile-info__nosub-card {
      font-size: 13px;
    }
  }
`;

export default PRICING_CSS;
