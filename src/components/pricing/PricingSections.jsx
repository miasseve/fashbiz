"use client";
import { useState } from "react";
import Link from "next/link";

/* ───────────────────────────────────────────────────────────────
   leStoresworld.com-aligned pricing page.

   Three option cards (Discovery / AI / Web+AI) with hardcoded
   marketing copy, a "Pro / 3+ locations" strip, and a bottom
   contact block. No FAQ.

   Prices in the copy are fixed marketing text, but every CTA resolves
   its Stripe PRICE ID dynamically from `newPlans` (passed in from
   SubscriptionPlans.jsx, which fetched /api/stripe/plans) — nothing
   is hardcoded for checkout. If a plan's Stripe product can't be
   matched, that card's CTA degrades to disabled rather than breaking
   the page or sending a bad price ID to checkout.

   Button state/behaviour (readOnly → sign-up, subscribed → disabled,
   otherwise → handleCheckout) mirrors the old design exactly.
   ─────────────────────────────────────────────────────────────── */

const CONTACT_EMAIL = "mia@le-stores.com";
const CONTACT_PHONE = "81 93 82 68";

// Match a fetched plan by its Stripe product name OR nickname (case-insensitive).
function findPlan(newPlans, ...identifiers) {
  const wanted = identifiers.map((s) => s.toLowerCase());
  return (
    newPlans.find(
      (p) =>
        wanted.includes((p.name || "").toLowerCase()) ||
        wanted.includes((p.nickname || "").toLowerCase()),
    ) || null
  );
}

export default function PricingSections({
  newPlans = [],
  activePlan,
  handleCheckout,
  readOnly = false,
}) {
  const [showProDetails, setShowProDetails] = useState(false);

  const discovery = findPlan(newPlans, "Le Stores Discovery");
  const ai = findPlan(newPlans, "lestores-ai");
  const web = findPlan(newPlans, "Le Stores Web", "lestores-web");

  const isSubscribedTo = (plan) =>
    !readOnly &&
    plan &&
    activePlan &&
    (activePlan.nickname === plan.nickname || activePlan.name === plan.name);

  // Renders a card's CTA with the same behaviour rules as the old design.
  const renderCta = (plan, label, { primary = false } = {}) => {
    const cls = `p2-cta${primary ? "" : " p2-cta--outline"}`;

    if (readOnly) {
      return (
        <Link href="/register" className={`${cls} p2-cta--readonly`}>
          Sign up to subscribe
        </Link>
      );
    }
    if (isSubscribedTo(plan)) {
      return (
        <button className={`${cls} p2-cta--subscribed`} disabled>
          Subscribed
        </button>
      );
    }
    // No matching Stripe price → disable rather than send a bad ID to checkout.
    if (!plan?.id) {
      return (
        <button className={`${cls} p2-cta--subscribed`} disabled title="Coming soon">
          {label}
        </button>
      );
    }
    return (
      <button className={cls} onClick={() => handleCheckout(plan.id)}>
        {label}
      </button>
    );
  };

  const feature = (text) => (
    <div className="p2-feature" key={text}>
      <span className="p2-check">&#10003;</span>
      {text}
    </div>
  );

  return (
    <div className="p2-wrap">
      {/* ── Page heading ── */}
      <div className="p2-hero-head">
        <h2 className="p2-title">
          Discover. Automate. <em>Sell.</em>
        </h2>
        <p className="p2-subtitle">Three options. Compare and choose.</p>
      </div>

      {/* ── Three option cards ── */}
      <div className="p2-hero-grid">
        {/* CARD 1 — Discovery */}
        <div className="p2-card">
          <div className="p2-eyebrow p2-eyebrow--card">GET DISCOVERED</div>
          <div className="p2-card__name">Le Stores Discovery</div>
          <div className="p2-price">
            <span className="p2-price__num">Free</span>
          </div>
          <div className="p2-price__sub">
            449 DKK / month from 1 May 2027 · excl. VAT
          </div>
          <div className="p2-features">
            {["Consumer Discovery app", "Store and products visible", "Unlimited products"].map(
              feature,
            )}
          </div>
          {renderCta(discovery, "Join free", { primary: false })}
        </div>

        {/* CARD 2 — Le Stores AI */}
        <div className="p2-card">
          <div className="p2-eyebrow p2-eyebrow--card">AUTOMATE</div>
          <div className="p2-card__name">Le Stores AI</div>
          <div className="p2-price">
            <span className="p2-price__num">549</span>
            <span className="p2-price__unit">DKK / month</span>
          </div>
          <div className="p2-price__sub">MONTHLY · excl. VAT</div>
          <div className="p2-card__tagline">ONE PHOTO = COMPLETE PRODUCT</div>
          <div className="p2-features">
            {[
              "AI product creation",
              "Descriptions and product information",
              "Price assistance",
              "Barcodes and labels",
              "Inventory workflow and synchronization",
              "Unlimited products",
            ].map(feature)}
          </div>
          {renderCta(ai, "Get Le Stores AI", { primary: true })}
        </div>

        {/* CARD 3 — Le Stores Web + AI (recommended) */}
        <div className="p2-card p2-card--popular">
          <div className="p2-badge">Recommended</div>
          <div className="p2-eyebrow p2-eyebrow--card">AUTOMATE + SELL ONLINE</div>
          <div className="p2-card__name">Le Stores Web + AI</div>
          <div className="p2-price">
            <span className="p2-price__num">5,900</span>
            <span className="p2-price__unit">DKK · web setup · one time</span>
          </div>
          <div className="p2-price__sub">
            399 DKK / month (instead of 549 DKK) · LE STORES AI · MONTHLY
          </div>
          <div className="p2-price__fee">
            4% only when you sell · excl. VAT · 12-month commitment
          </div>
          <div className="p2-features">
            {[
              "Everything in Le Stores AI, included",
              "Your own branded Web Store",
              "Automatic product synchronization",
              "Synchronized inventory",
            ].map(feature)}
          </div>
          {renderCta(web, "Get your webstore", { primary: true })}
          <p className="p2-card__note">
            Refer a shop, get 500 DKK back, up to two referrals. Terms
          </p>
        </div>
      </div>

      {/* ── Pro / 3+ locations strip ── */}
      <div className="p2-pro">
        <div className="p2-pro__row">
          <div className="p2-pro__text">3+ store locations? Custom Pro pricing.</div>
          <div className="p2-pro__actions">
            <a href={`mailto:${CONTACT_EMAIL}`} className="p2-cta p2-cta--outline p2-cta--inline">
              Contact us
            </a>
            <button
              type="button"
              className="p2-pro__toggle"
              onClick={() => setShowProDetails((v) => !v)}
              aria-expanded={showProDetails}
            >
              {showProDetails ? "Hide details" : "See details"}
            </button>
          </div>
        </div>
        {showProDetails && (
          <div className="p2-pro__details">
            {[
              "Unlimited products on Discovery, AI and Web",
              "Standard pricing covers up to 2 store locations",
              "Le Stores Web is powered and synchronized through Le Stores AI",
              "Discovery and AI have no commitment. Web has a 12-month commitment",
              "Referral credit: 500 DKK per activated paying store, maximum 2 referrals, maximum 1,000 DKK",
            ].map(feature)}
          </div>
        )}
      </div>

      {/* ── Bottom contact block ── */}
      <div className="p2-bottom">
        <div className="p2-bottom__title">Not sure which option fits your store?</div>
        <div className="p2-bottom__actions">
          <a href={`mailto:${CONTACT_EMAIL}`} className="p2-cta">
            Contact us
          </a>
          <span className="p2-bottom__phone">
            Call Mia · <a href={`tel:${CONTACT_PHONE.replace(/\s/g, "")}`}>{CONTACT_PHONE}</a>
          </span>
        </div>
      </div>

      <p className="p2-vat-note">VAT is added where applicable.</p>
    </div>
  );
}
