"use client";
import { useState } from "react";
import Link from "next/link";
import LinkInquiryModal from "@/components/pricing/LinkInquiryModal";

/* ───────────────────────────────────────────────────────────────
   leStoresworld.com pricing page — V7 pixel-perfect match.

   Matches the live reference at lestoresworld.com/pricing:
   · Head Start = 2-column (text left, table right, always visible)
   · Link column in "Already have part of it?" = plain text
   · Pro details = 2-column grid, 6 items
   · Excludes the Questions FAQ section
   ─────────────────────────────────────────────────────────────── */

const CONTACT_EMAIL = "mia@le-stores.com";
const CONTACT_PHONE = "81 93 82 68";

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
  const [linkModalOpen, setLinkModalOpen] = useState(false);

  const discovery = findPlan(newPlans, "Le Stores Discovery");
  const ai = findPlan(newPlans, "lestores-ai");
  const web = findPlan(newPlans, "lestores-ai-web");
  const webOneTime = findPlan(newPlans, "lestores-web");

  const isSubscribedTo = (plan) => {
    if (readOnly || !plan || !activePlan) return false;
    const eq = (a, b) => a && b && a.toLowerCase() === b.toLowerCase();
    return eq(activePlan.nickname, plan.nickname) || eq(activePlan.name, plan.name);
  };

  const renderCta = (plan, label, { primary = false, href } = {}) => {
    const cls = `p2-cta${primary ? "" : " p2-cta--outline"}`;

    if (href) {
      return (
        <a href={href} className={cls} target="_blank" rel="noopener noreferrer">
          {label}
        </a>
      );
    }
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

  const renderTextLink = (plan, label, { href } = {}) => {
    if (href) {
      return (
        <a href={href} className="p2-cta--text" target="_blank" rel="noopener noreferrer">
          {label}
        </a>
      );
    }
    if (readOnly) {
      return (
        <Link href="/register" className="p2-cta--text">
          {label}
        </Link>
      );
    }
    if (isSubscribedTo(plan)) {
      return <span className="p2-cta--text p2-cta--text-muted">Subscribed</span>;
    }
    if (!plan?.id) {
      return <span className="p2-cta--text p2-cta--text-muted">Coming soon</span>;
    }
    return (
      <button type="button" className="p2-cta--text" onClick={() => handleCheckout(plan.id)}>
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
    <div className="p2-page-bg">
    <div className="p2-wrap">
      {/* ── Page heading ── */}
      <div className="p2-hero-head">
        <h2 className="p2-title">Subscription Plan</h2>
      </div>

      {/* ── Two main cards ── */}
      <div className="p2-hero-grid">
        {/* LEFT — Visibility + full time saving */}
        <div className="p2-card">
          <h3 className="p2-card__heading">Visibility and full time saving</h3>
          <p className="p2-card__desc">Le-Stores App and lestores-ai</p>

          <div className="p2-card__separator" />

          <div className="p2-pill">LE-STORES APP FREE UNTIL 1 MAY 2027</div>
          <div className="p2-price">
            <span className="p2-price__num">549</span>
            <span className="p2-price__unit">DKK/ month</span>
          </div>
          <div className="p2-price__meta">LESTORES-AI &middot; MONTHLY</div>
          <div className="p2-price__vat">excl. VAT &middot; no commitment</div>

          <div className="p2-card__separator" />

          {/* Description bullets — checkmarks */}
          <div className="p2-card__bullets">
            {feature("Get seen by new secondhand clients, and save time while doing so.")}
            {feature("One picture. AI does the repetitive work.")}
          </div>

          {renderCta(ai, "Get started", readOnly ? { href: "https://lestores-ai.com/try/add-product" } : {})}
        </div>

        {/* RIGHT — Maximum visibility (featured) */}
        <div className="p2-card p2-card--popular">
          <div className="p2-badge">MOST COMPLETE</div>
          <h3 className="p2-card__heading">Maximum visibility and full time saving</h3>
          <p className="p2-card__desc">Le-Stores Web and lestores-ai</p>
          <div className="p2-card__tagline">
            YOUR OWN SECONDHAND WEBSHOP. ALREADY BUILT.
          </div>

          <div className="p2-card__separator" />

          <p className="p2-card__subdesc">A part upfront. The rest as you sell.</p>

          <div className="p2-price-row">
            <span className="p2-price-row__label">Your webshop</span>
            <div className="p2-price-row__right">
              <span className="p2-price-row__amount">5,900 DKK</span>
              <span className="p2-price-row__meta">EXCL. VAT &middot; ONE-TIME</span>
            </div>
          </div>
          <div className="p2-price-row">
            <div>
              <span className="p2-price-row__label">Link</span>
              <p className="p2-price-row__linkdesc">
                Your webshop and lestores-ai, talking to each other.
              </p>
            </div>
            <div className="p2-price-row__right">
              <span className="p2-price-row__amount">6,500 DKK</span>
              <span className="p2-price-row__meta">EXCL. VAT &middot; ONE-TIME</span>
              <button
                type="button"
                className="p2-cta--text"
                onClick={() => setLinkModalOpen(true)}
              >
                Get it now &#8594;
              </button>
            </div>
          </div>

          <div className="p2-price__commitment">12-month commitment</div>

          <div className="p2-card__separator" />

          {/* Description bullets — checkmarks */}
          <div className="p2-card__bullets">
            {feature("Add your logo and pictures, adjust the look, or ask for a custom design quote.")}
            {feature("One picture. AI does the repetitive work.")}
          </div>

          {renderCta(webOneTime || web, "Get webshop now", { primary: true })}
        </div>
      </div>

      {/* ── Head Start banner — 2-column layout ── */}
      <div className="p2-banner">
        <div className="p2-banner__eyebrow">HEAD START</div>
        <div className="p2-banner__layout">
          <div className="p2-banner__left">
            <h3 className="p2-banner__title">
              Get a head start: your webshop is already built.
            </h3>
            <p className="p2-banner__subtitle">
              You get a webshop that is already built. Our model combines a starting cost,
              a lestores-ai subscription and a commission linked to your sales.
            </p>
          </div>
          <div className="p2-banner__right">
            <div className="p2-banner__table-card">
              <div className="p2-banner__row">
                <span>Build a Shopify webshop yourself</span>
                <span>&asymp; 47 h</span>
              </div>
              <div className="p2-banner__row">
                <span>List 300 pieces at 5 min each</span>
                <span>&asymp; 25 h</span>
              </div>
              <div className="p2-banner__row p2-banner__row--total">
                <span className="p2-banner__total-label">LAUNCH EXAMPLE</span>
                <span className="p2-banner__total-value">&asymp; 72 h</span>
              </div>
            </div>
            <p className="p2-banner__footnote">
              Illustrative estimate. Your own time may differ. Adding your logo and
              pictures to the ready webshop takes about 10 minutes.
            </p>
          </div>
        </div>
      </div>

      {/* ── Already have part of it? ── */}
      <div className="p2-partial">
        <div className="p2-partial__title">ALREADY HAVE PART OF IT?</div>
        <div className="p2-partial__grid">
          {/* Column 1 — Visibility */}
          <div className="p2-partial__col">
            <div className="p2-partial__eyebrow">VISIBILITY</div>
            <div className="p2-partial__name">Le-Stores App</div>
            <div className="p2-partial__price">Free until 1 May 2027</div>
            <p className="p2-partial__desc">
              List your pieces and let new secondhand clients find them.
            </p>
            {renderTextLink(discovery, "Start free →", {
              href: "https://lestores-ai.com/try/add-product",
            })}
          </div>

          {/* Column 2 — Full time saving */}
          <div className="p2-partial__col">
            <div className="p2-partial__eyebrow">FULL TIME SAVING</div>
            <div className="p2-partial__name">lestores-ai</div>
            <div className="p2-partial__price">549 DKK / month excl. VAT</div>
            <p className="p2-partial__desc">
              One picture. AI does the repetitive work.
            </p>
            <p className="p2-partial__desc p2-partial__desc--secondary">
              Used without a connected webshop, no extra setup cost.
            </p>
            {renderTextLink(ai, "Get lestores-ai →", {
              href: "https://lestoresworld.com/ai",
            })}
          </div>
        </div>
      </div>

      {/* ── Standalone Link section ── */}
      <div className="p2-link">
        <div className="p2-link__grid">
          {/* Left — Link product card */}
          <div className="p2-link__card">
            <div className="p2-link__eyebrow">LINK</div>
            <h3 className="p2-link__title">
              Already have a webshop? Connect it to lestores-ai.
            </h3>
            <div className="p2-link__price">
              <span className="p2-link__amount">6,500 DKK</span>
              <span className="p2-link__meta">
                excl. VAT &middot; 8,125 DKK incl. VAT &middot; one-time
              </span>
            </div>
            <p className="p2-link__desc">
              Connection to your own webshop and testing included.
              No new Le-Stores Web webshop needed.
              Needs an active lestores-ai subscription.
            </p>
            <div className="p2-link__features">
              {feature("Publishing control — Shopify draft vs live check")}
              {feature("Sync status — success status & direct link to published pieces")}
              {feature("Brand and tags — AI-detected brands as vendors, material/condition as tags")}
            </div>
            <button
              type="button"
              className="p2-cta--text"
              onClick={() => setLinkModalOpen(true)}
            >
              Get it now &#8594;
            </button>
          </div>

        </div>
      </div>

      {/* ── Pro / 3+ locations strip ── */}
      <div className="p2-pro">
        <div className="p2-pro__row">
          <div className="p2-pro__text">3+ store locations? Custom Pro pricing.</div>
          <div className="p2-pro__actions">
            <a
              href={`mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent("Pro quote for 3+ stores")}`}
              className="p2-cta--text"
            >
              Contact us &#8594;
            </a>
            <button
              type="button"
              className="p2-pro__toggle"
              onClick={() => setShowProDetails((v) => !v)}
              aria-expanded={showProDetails}
            >
              {showProDetails ? "Hide details ∧" : "See details ∨"}
            </button>
          </div>
        </div>
        {showProDetails && (
          <div className="p2-pro__details">
            <div className="p2-pro__grid">
              {[
                "Unlimited pieces in Le-Stores App, lestores-ai and Le Stores Web",
                "Standard pricing covers up to 2 store locations",
                "Le-Stores Web is lestores-ai connected. Full lestores-ai features with subscription.",
                "AI-vision is unlimited to try: list a piece from 1 picture. Every other feature needs a lestores-ai subscription.",
                "Referral credit: 500 DKK per activated paying store, maximum 2 referrals, maximum 1,000 DKK",
                "Le-Stores App and lestores-ai have no commitment. Le-Stores Web has a 12-month commitment.",
              ].map(feature)}
            </div>
          </div>
        )}
      </div>

      {/* ── Bottom contact block ── */}
      {/* <div className="p2-bottom">
        <div className="p2-bottom__card">
          <div className="p2-bottom__title">
            Not sure which option fits your store?
          </div>
          <div className="p2-bottom__actions">
            <a
              href={`mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent("Help me choose the right Le Stores setup")}`}
              className="p2-cta"
            >
              Contact us
            </a>
            <span className="p2-bottom__phone">
              <svg className="p2-bottom__phone-icon" viewBox="0 0 20 20" fill="currentColor" width="16" height="16" aria-hidden="true">
                <path d="M2 3a1 1 0 0 1 1-1h2.153a1 1 0 0 1 .986.836l.74 4.435a1 1 0 0 1-.54 1.06l-1.548.773a11.037 11.037 0 0 0 6.105 6.105l.774-1.548a1 1 0 0 1 1.059-.54l4.435.74a1 1 0 0 1 .836.986V17a1 1 0 0 1-1 1h-2C7.82 18 2 12.18 2 5V3Z" />
              </svg>
              {" "}Call Mia &middot;{" "}
              <a href={`tel:+45${CONTACT_PHONE.replace(/\s/g, "")}`}>
                {CONTACT_PHONE}
              </a>
            </span>
          </div>
        </div>
      </div> */}

      <p className="p2-vat-note">VAT is added where applicable.</p>
    </div>

    <LinkInquiryModal isOpen={linkModalOpen} onClose={() => setLinkModalOpen(false)} />
    </div>
  );
}