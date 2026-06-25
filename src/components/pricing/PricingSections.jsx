"use client";
import Link from "next/link";

/* ───────────────────────────────────────────────────────────────
   2hand2go-style pricing layout: three stacked sections, white
   cards on top of the site's existing gradient theme.

   Copy is HYBRID — section headings/subtitles mirror 2hand2go,
   while per-plan prices & feature bullets come from the existing
   plan data (PLAN_CONFIG / Stripe). Button labels, states, and
   checkout behaviour are kept identical to the old design.
   ─────────────────────────────────────────────────────────────── */

// Pay-as-you-go card (the old "No Subscription / FROM 10 DKK" card),
// shown as the first card of section 1.
const PAYG = {
  id: "payg",
  isPayg: true,
  tierName: "Pay as you go",
  desc: "No monthly commitment. For low or seasonal volume.",
  features: [
    "AI listing generation",
    "Print-ready barcode labels",
    "Publish to one channel",
  ],
};

// Per-card descriptions for the Resale Ecommerce Engine (Ads) section,
// matching the 2hand2go copy. Keyed by tier name; falls back to plan data.
const AD_DESC = {
  Basic: "Up to 300 items per month. The sweet spot for growing stores.",
  Pro: "Up to 1,000 items per month. For established multi-channel stores.",
};

// Section headings/subtitles, matched to a plan group by its productName.
function getSectionMeta(productName = "") {
  const n = productName.toLowerCase();
  if (n.includes("plug")) {
    return {
      eyebrow: "PLUGIN",
      titlePre: "Connect your existing ",
      titleAccent: "store.",
      subtitle:
        "Already have a webstore? Plug it into REE and sync your full product catalog automatically.",
      includePayg: false,
    };
  }
  if (n.includes("webstore")) {
    return {
      eyebrow: "ADD-ON",
      titlePre: "Add your own ",
      titleAccent: "webshop.",
      subtitle:
        "Branded and launched by our team, synced so every item lists automatically. One-time setup, no monthly fee.",
      includePayg: false,
    };
  }
  // default: Ads / Resale Ecommerce Engine
  return {
    eyebrow: "REE",
    titlePre: "Resale Ecommerce ",
    titleAccent: "Engine.",
    subtitle:
      "Simple pricing that grows with your store. Free for your first 25 items, no card required.",
    includePayg: true,
  };
}

// Build the big number + unit + transaction-fee line from plan data.
function formatPrice(plan) {
  if (plan.isPayg) return { num: "10", unit: "DKK / item", fee: null };
  const amount = parseFloat(plan.price) || 0;
  const num = amount.toLocaleString("en-US");
  const isOneTime = plan.planType === "one-time" || plan.period === "once";
  const unit = isOneTime ? "DKK one-time" : `DKK / ${plan.period || "month"}`;
  const fee = plan.transactionFee
    ? `+ ${Math.round(plan.transactionFee * 100)}% per transaction`
    : null;
  return { num, unit, fee };
}

export default function PricingSections({
  planGroups = [],
  activePlan,
  handleCheckout,
  readOnly = false,
  tryMode = false,
}) {
  const payPerProductHref = tryMode ? "/try/add-product" : "/dashboard/add-product";

  const renderCard = (plan, { isAds }) => {
    const popular = isAds && (plan.tierName || "").toLowerCase() === "basic";
    const { num, unit, fee } = formatPrice(plan);
    const desc = plan.isPayg
      ? plan.desc
      : (isAds && AD_DESC[plan.tierName]) || plan.subtitle || plan.tagline || "";
    const features = plan.features || [];

    // ── Button: behaviour & labels preserved from the old PricingCard ──
    let button;
    if (plan.isPayg) {
      button = (
        <Link href={payPerProductHref} className="p2-cta p2-cta--outline">
          Pay Per Product
        </Link>
      );
    } else {
      const isSubscribed =
        !readOnly &&
        activePlan &&
        (activePlan.nickname === plan.nickname || activePlan.name === plan.name);
      const label = isSubscribed
        ? "Subscribed"
        : readOnly
          ? "Sign up to subscribe"
          : plan.requiresQuote
            ? "Get a quote"
            : "Get Started";
      let cls = "p2-cta";
      if (isSubscribed) cls += " p2-cta--subscribed";
      else if (!popular) cls += " p2-cta--outline";
      if (readOnly) cls += " p2-cta--readonly";
      button = (
        <button
          className={cls}
          disabled={isSubscribed || readOnly}
          onClick={() => {
            if (!readOnly && !isSubscribed) handleCheckout(plan.id);
          }}
        >
          {label}
        </button>
      );
    }

    return (
      <div
        key={plan.id}
        className={`p2-card${popular ? " p2-card--popular" : ""}`}
      >
        {popular && <div className="p2-badge">Most Popular</div>}
        <div className="p2-card__name">{plan.tierName}</div>
        <div className="p2-card__desc">{desc}</div>

        <div className="p2-price">
          <span className="p2-price__num">{num}</span>
          <span className="p2-price__unit">{unit}</span>
        </div>
        {fee && <div className="p2-price__fee">{fee}</div>}

        <div className="p2-features">
          {features.map((f, i) => (
            <div key={i} className="p2-feature">
              <span className="p2-check">&#10003;</span>
              {f}
            </div>
          ))}
        </div>

        {button}
      </div>
    );
  };

  return (
    <div className="p2-wrap">

      {planGroups.map((group) => {
        const meta = getSectionMeta(group.productName);
        const cards = meta.includePayg ? [PAYG, ...group.plans] : group.plans;
        const isAds = meta.includePayg;
        return (
          <section key={group.productName} className="p2-section">
            <div className="p2-head">
              <div className="p2-eyebrow">{meta.eyebrow}</div>
              <h2 className="p2-title">
                {meta.titlePre}
                <em>{meta.titleAccent}</em>
              </h2>
              <p className="p2-subtitle">{meta.subtitle}</p>
            </div>

            <div
              className="p2-grid"
              style={{ gridTemplateColumns: `repeat(${cards.length}, minmax(0, 1fr))` }}
            >
              {cards.map((plan) => renderCard(plan, { isAds }))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
