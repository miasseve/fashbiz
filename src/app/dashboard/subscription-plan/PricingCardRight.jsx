import { GROUP_DISPLAY, RIGHT_CARD_STATIC } from "./pricingConstants";

export default function PricingCardRight({ group, variant }) {
  const displayName = GROUP_DISPLAY[group.productName] || group.productName;
  const staticData = RIGHT_CARD_STATIC[group.productName];

  // Fallback to dynamic if no static data defined
  if (!staticData) {
    const badge = displayName.toUpperCase();
    const plan = group.plans[0];
    return (
      <div className={`pcr pcr--${variant}`}>
        <div className="pcr__body">
          <div className="pcr__badge">{badge}</div>
          <div className="pcr__price-block">
            <div className="pcr__price-big">{plan.price}</div>
            <div className="pcr__price-sub">
              {plan.period === "once" ? "once" : `per ${plan.period}`}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // "Add" style: header + subheader + rows with bullets & prices
  if (staticData.rows) {
    return (
      <div className={`pcr pcr--${variant}`}>
        <div className="pcr__body" style={{ gap: 8 }}>
          <div style={{ textAlign: "center", marginBottom: 4 }}>
            <div className="pcr__badge" style={{ fontStyle: "italic" }}>{staticData.header}</div>
            <div className="pcr__price-sub">{staticData.subheader}</div>
          </div>
          {staticData.rows.map((row, i) => (
            <div key={i} className="pcr__row">
              <div className="pcr__row-label">
                <span className="pcr__bullet">•</span>
                {row.label}
              </div>
              <div className="pcr__row-price">{row.price}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // "Webstore" / "Plug-In" style: badge + optional subtitles + price block
  return (
    <div className={`pcr pcr--${variant}`}>
      <div className="pcr__body">
        <div className="pcr__badge">{staticData.badge}</div>
        {staticData.subtitles && (
          <div className="pcr__subtitles">
            {staticData.subtitles.map((s, i) => (
              <div key={i}>{s}</div>
            ))}
          </div>
        )}
        <div className="pcr__price-block">
          <div className="pcr__price-big">{staticData.price}</div>
          {staticData.period && (
            <div className="pcr__price-sub">{staticData.period}</div>
          )}
        </div>
      </div>
    </div>
  );
}
