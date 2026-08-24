import React from "react";
import Main from "./Main";
import { auth } from "@/auth";
import { getUserProductCount } from "@/actions/productActions";
import { checkStripeIsConnected } from "@/actions/authActions";
import { getUser } from "@/actions/authActions";
import Link from "next/link";
import dbConnect from "@/lib/db";
import AddOnPurchase from "@/models/AddOnPurchase";
import User from "@/models/User";
import ADDON_V2_CSS from "./components/addOnStyles";

export const metadata = {
  title: "Add Product",
};

// Discovery/AI-vision product uploads are free and unlimited regardless of
// subscription — see the removed product-count wall further down. At this
// many products, show a one-time non-blocking "ready to automate?" popup
// instead (see productLimitUpsell on the User model). Not a limit — a
// milestone.
const PRODUCT_LIMIT_UPSELL_THRESHOLD = 300;

// Client-requested journey: guest (25) → FREE demo test (up to the demo limit,
// e.g. 200) → subscribe (300/1000) → connect Stripe → live.
//
// When TRUE, a logged-in store with NO plan (isActive === false) drops into the
// existing demo-mode flow instead of hitting the hard "Subscription Required"
// wall — so they can test-upload up to Account.demoProductLimit for free before
// paying. The demo cap is still enforced (createProduct + checkStripeIsConnected),
// and once they hit it (or want to go live) they're pushed to subscribe/connect
// Stripe.
//
// Flip to FALSE to restore the strict paywall (no plan = 0 uploads).
const ALLOW_FREE_DEMO_WITHOUT_PLAN = true;

// Toggle between the new pricing-card-style "Subscription Required" screen
// (true) and the ORIGINAL plain white box (false). The old design is kept
// fully intact below inside `if (!USE_NEW_SUBSCRIPTION_MESSAGE)` — nothing
// was deleted, flip this one flag to switch back.
const USE_NEW_SUBSCRIPTION_MESSAGE = true;

// Shown when the account simply has no plan yet (isActive === false).
// The previous copy said "Your account is deactivated. Please contact support."
// which is wrong for a brand-new signup — they were never deactivated, they
// just haven't subscribed. Old wording kept here for reference:
//   const NO_PLAN_MESSAGE = "Your account is deactivated. Please contact support.";
const NO_PLAN_MESSAGE =
  "You don't have an active plan yet. Subscribe to start adding products.";

const SubscriptionMessage = ({
  message,
  heading, // optional — overrides the default "Subscription Required" title
  ctaLabel = "Subscribe Now", // optional — button text (e.g. "Upgrade Your Plan")
}) => {
  /* ═══════════════════════════════════════════════════════════════════════
     OLD UI — the original plain white "Subscription Required" box.
     NOT deleted: flip USE_NEW_SUBSCRIPTION_MESSAGE to false to bring it back.
     ═══════════════════════════════════════════════════════════════════════ */
  if (!USE_NEW_SUBSCRIPTION_MESSAGE) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-start pt-10 px-4">
        <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-lg text-center mb-6">
          <h2 className="text-2xl font-bold mb-4">{heading || "Subscription Required"}</h2>
          <p className="text-gray-700">{message}</p>
          <p className="mt-4 text-gray-700">
            Please <span className="font-semibold">renew or upgrade</span> your plan
            to continue adding products.
          </p>
          <Link href="/dashboard/subscription-plan">
            <button className="mt-6 bg-[#EF4444] text-white px-6 py-2 rounded hover:bg-[#DC2626] transition">
              {ctaLabel}
            </button>
          </Link>
        </div>
      </div>
    );
  }

  /* ═══════════════════════════════════════════════════════════════════════
     NEW UI — matches the plan cards on /dashboard/subscription-plan:
     white rounded card on the gradient, Instrument Serif heading with a
     Playfair italic accent, pink pill CTA. Same content, same link.
     ═══════════════════════════════════════════════════════════════════════ */
  return (
    <>
      <style>{ADDON_V2_CSS}</style>

      <div className="ap-page">
        <div className="ap-req">
          <div className="ap-req__eyebrow">Subscription</div>
          <h2 className="ap-req__title">
            {heading || (
              <>
                Subscription <em>Required.</em>
              </>
            )}
          </h2>

          <p className="ap-req__msg">{message}</p>
          <p className="ap-req__msg">
            Please <strong>renew or upgrade</strong> your plan to continue adding
            products.
          </p>

          <Link href="/dashboard/subscription-plan" className="ap-req__cta">
            {ctaLabel}
          </Link>
        </div>
      </div>
    </>
  );
};

const page = async ({ searchParams }) => {
  const session = await auth();
  const params = await searchParams;

  const response = await getUserProductCount();
  const stripeResponse = await checkStripeIsConnected();

  if (response.status != 200) {
    throw new Error(response.error);
  }

  // One-time, non-blocking "ready to automate?" popup at the 300-product
  // mark — shown at most once per store (see productLimitUpsell on User).
  // Marking it shown here, at render time, is the "popup shown" tracking;
  // "CTA clicked" is recorded client-side, see Main.jsx.
  let showProductLimitUpsell = false;
  if (session?.user?.id && !response.isDemo && response.count >= PRODUCT_LIMIT_UPSELL_THRESHOLD) {
    await dbConnect();
    const dbUser = await User.findById(session.user.id).select("productLimitUpsell");
    if (!dbUser?.productLimitUpsell?.shownAt) {
      await User.updateOne(
        { _id: session.user.id },
        { $set: { "productLimitUpsell.shownAt": new Date() } },
      );
      showProductLimitUpsell = true;
    }
  }

  // Check if user is returning from a successful add-on payment
  const addonSuccess = params?.addon_success === "true";
  const purchaseId = params?.purchaseId;
  let addonPurchase = null;

  if (addonSuccess && purchaseId && session?.user?.id) {
    try {
      await dbConnect();
      const purchase = await AddOnPurchase.findOne({
        _id: purchaseId,
        userId: session.user.id,
        status: "paid",
        productId: null, // not yet used
      }).lean();
      if (purchase) {
        addonPurchase = {
          id: purchase._id.toString(),
          addOns: purchase.addOns,
          totalAmount: purchase.totalAmount,
        };
      }
    } catch (error) {
      console.error("Error verifying add-on purchase:", error);
    }
  }

  // If user has a valid add-on purchase, let them upload regardless of subscription
  if (addonPurchase) {
    return (
      <Main
        user={session.user}
        productCount={response.count}
        stripeResponse={stripeResponse}
        isDemo={response.isDemo}
        demoLimitReached={response.demoLimitReached}
        addonPurchase={addonPurchase}
        showProductLimitUpsell={showProductLimitUpsell}
      />
    );
  }

  // Always check isActive from the database (not the session token),
  // because the JWT token is only set at login and can become stale
  // if the user subscribes after logging in.
  const res = await getUser();
  const user = res?.data ? JSON.parse(res.data) : null;

  if (user?.isActive === false) {
    // No plan yet. Either send them into free demo mode (client-requested flow)
    // or show the strict "Subscription Required" wall — controlled by the flag.
    if (ALLOW_FREE_DEMO_WITHOUT_PLAN) {
      // Render the normal add-product flow. With no Stripe account connected,
      // Main shows the "Connect Stripe / Demo Mode" screen; entering demo mode
      // lets them upload up to Account.demoProductLimit for free. The cap is
      // enforced downstream, and hitting it nudges them to subscribe.
      return (
        <Main
          user={session.user}
          productCount={response.count}
          stripeResponse={stripeResponse}
          isDemo={response.isDemo}
          demoLimitReached={response.demoLimitReached}
          showProductLimitUpsell={showProductLimitUpsell}
        />
      );
    }
    return <SubscriptionMessage message={NO_PLAN_MESSAGE} />;
  }

  // Subscription/date status (active, expired, free, paid) no longer gates
  // this page at all — Discovery/AI-vision uploads are unconditionally
  // unlimited, same principle as the removed product-count wall above.
  // Only the separate, older demo-mode cap (Account.demoProductLimit, for
  // guests who've never subscribed) still applies, untouched by this.

  return (
    <Main
      user={session.user}
      productCount={response.count}
      stripeResponse={stripeResponse}
      isDemo={response.isDemo}
      demoLimitReached={response.demoLimitReached}
      showProductLimitUpsell={showProductLimitUpsell}
    />
  );
};

export default page;
