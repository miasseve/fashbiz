import { GROUP_DISPLAY } from "./pricingConstants";

export default function PricingCard({ group, variant, activePlan, handleCheckout }) {
  const tierCount = group.plans.length;

  // Merge all unique features from every tier so the left panel shows the full set
  const allFeatures = [];
  const seen = new Set();
  for (const plan of group.plans) {
    for (const f of plan.features || []) {
      // Skip "All … features" roll-up lines
      if (/^all\s+.+\s+features/i.test(f)) continue;
      if (!seen.has(f)) { seen.add(f); allFeatures.push(f); }
    }
  }

  const displayName = GROUP_DISPLAY[group.productName] || group.productName;
  const badge = displayName.toUpperCase();
  const nameSubtitles = [];
  const taglineWords = group.plans[0]?.tagline
    ? group.plans[0].tagline.split(/\s+/)
    : [];
  const subtitles =
    nameSubtitles.length > 0 ? nameSubtitles : taglineWords;

  return (
    <div className={`pc pc--${variant}`} style={{ "--tier-cols": tierCount }}>
      <div className="pc__left-wrap">
        <div className="pc__left">
          <div className="pc__badge">{badge}</div>
          <div className="pc__subtitles">
            {subtitles.map((s, i) => (
              <div key={i}>{s.toUpperCase()}</div>
            ))}
          </div>
          <div className="pc__features">
            {allFeatures.map((f, i) => (
              <div
                key={i}
                className={`pc__feature${
                  f.toLowerCase() === "instagram" ? " pc__feature--bold" : ""
                }`}
              >
                <span className="pc__bullet">→</span>
                {f}
              </div>
            ))}
          </div>
        </div>
        <div className="pc__promo">
          🎁 Get <strong>1 month free</strong> by inviting a store!
        </div>
      </div>

      <div className="pc__tiers">
        {group.plans.map((plan) => {
          const isSubscribed =
            activePlan &&
            (activePlan.nickname === plan.nickname ||
              activePlan.name === plan.name);
          return (
            <div key={plan.id} className="pc__tier">
              <div className="pc__tier-name">{plan.tierName}</div>
              <div className="pc__price">{plan.price}</div>
              <div className="pc__period">
                {plan.period === "once" ? "once" : `per ${plan.period}`}
                {plan.transactionFee ? `\n+ ${Math.round(plan.transactionFee * 100)}% per\ntransactions` : ""}
              </div>
              <button
                className={`pc__cta ${
                  isSubscribed ? "pc__cta--subscribed" : ""
                }`}
                onClick={() => {
                  if (!isSubscribed) handleCheckout(plan.id);
                }}
                disabled={isSubscribed}
              >
                {isSubscribed ? "Subscribed" : plan.requiresQuote ? "Get a quote" : "Get Started"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
