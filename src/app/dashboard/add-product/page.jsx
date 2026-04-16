import React from "react";
import Main from "./Main";
import AddOnSelector from "./components/AddOnSelector";
import { auth } from "@/auth";
import { getUserProductCount } from "@/actions/productActions";
import { checkStripeIsConnected } from "@/actions/authActions";
import { getUser } from "@/actions/authActions";
import { getSubscriptionPlans } from "@/actions/stripePlans";
import Link from "next/link";
import dbConnect from "@/lib/db";
import AddOnPurchase from "@/models/AddOnPurchase";
import Subscription from "@/models/Subscription";
import SubscriptionPlanDetails from "@/models/SubscriptionPlanDetails";

export const metadata = {
  title: "Add Product",
};

// Add-ons that can only be purchased once per user
const ONE_TIME_ADDONS = ["webstore", "plugin"];

const SubscriptionMessage = ({ message, userId, paidOneTimeAddOns }) => (
  <div className="min-h-screen flex flex-col items-center justify-start pt-10 px-4">
    <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-lg text-center mb-6">
      <h2 className="text-2xl font-bold mb-4">Subscription Required</h2>
      <p className="text-gray-700">{message}</p>
      <p className="mt-4 text-gray-700">
        Please <span className="font-semibold">renew or upgrade</span> your plan
        to continue adding products.
      </p>
      <Link href="/dashboard/subscription-plan">
        <button className="mt-6 bg-[#EF4444] text-white px-6 py-2 rounded hover:bg-[#DC2626] transition">
          Subscribe Now
        </button>
      </Link>
    </div>

    {/* Divider */}
    <div className="flex items-center gap-4 w-full max-w-lg my-2">
      <div className="flex-1 h-px bg-gray-200"></div>
      <span className="text-md text-gray-500 font-medium">OR</span>
      <div className="flex-1 h-px bg-gray-200"></div>
    </div>

    {/* Add-on pay-per-product option */}
    {userId && <AddOnSelector userId={userId} paidOneTimeAddOns={paidOneTimeAddOns} />}
  </div>
);

async function fetchactivesubscription(userId) {
  try {
    await dbConnect();

    // Direct DB lookup instead of HTTP self-fetch
    const subscription = await Subscription.findOne({ userId });
    if (!subscription || (subscription.status !== "active" && subscription.status !== "trialing")) {
      return null;
    }

    // Try matching against Stripe plans
    const plans = await getSubscriptionPlans();
    const formattedPlans = plans.map((plan) => ({
      id: plan.id,
      name: plan.product.name,
      productLimit: plan.productLimit,
      maxUsers: plan.maxUsers,
    }));

    const activePlan = formattedPlans.find(
      (p) =>
        p.id === subscription.planPriceId ||
        p.name.toLowerCase() === subscription.planName?.toLowerCase()
    );

    if (activePlan) return activePlan;

    // Fallback: look up product limit from SubscriptionPlanDetails
    const planDoc = await SubscriptionPlanDetails.findOne({
      subscriptionPlanId: subscription.planPriceId,
    });

    if (planDoc) {
      return {
        id: subscription.planPriceId,
        name: subscription.planName,
        productLimit: planDoc.productLimit,
        maxUsers: planDoc.maxUsers,
      };
    }

    console.error(
      "Could not match subscription plan:",
      subscription.planName,
      subscription.planPriceId
    );
    return null;
  } catch (error) {
    console.error("Error fetching subscription plan:", error);
    return null;
  }
}

const page = async ({ searchParams }) => {
  const session = await auth();
  const params = await searchParams;

  const response = await getUserProductCount();
  const stripeResponse = await checkStripeIsConnected();

  if (response.status != 200) {
    throw new Error(response.error);
  }

  // Check which one-time add-ons this user has already paid for
  let paidOneTimeAddOns = [];
  if (session?.user?.id) {
    try {
      await dbConnect();
      const paidPurchases = await AddOnPurchase.find({
        userId: session.user.id,
        status: "paid",
        addOns: { $in: ONE_TIME_ADDONS },
      }).lean();
      const paidSet = new Set();
      for (const p of paidPurchases) {
        for (const a of p.addOns) {
          if (ONE_TIME_ADDONS.includes(a)) paidSet.add(a);
        }
      }
      paidOneTimeAddOns = [...paidSet];
    } catch (error) {
      console.error("Error checking one-time add-ons:", error);
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
      />
    );
  }

  // Always check isActive from the database (not the session token),
  // because the JWT token is only set at login and can become stale
  // if the user subscribes after logging in.
  const res = await getUser();
  const user = res?.data ? JSON.parse(res.data) : null;

  if (user?.isActive === false) {
    return <SubscriptionMessage message="Your account is deactivated. Please contact support." userId={session?.user?.id} paidOneTimeAddOns={paidOneTimeAddOns} />;
  }

  if (user?.isActive === true) {
    const now = new Date();
    const start = new Date(user.subscriptionStart);
    const end = new Date(user.subscriptionEnd);
    if (user.subscriptionType === "free") {
      if (now < start || now > end) {
        return <SubscriptionMessage message="Your free plan has expired." userId={session?.user?.id} paidOneTimeAddOns={paidOneTimeAddOns} />;
      }
      return (
        <Main
          user={session.user}
          productCount={response.count}
          stripeResponse={stripeResponse}
          isDemo={response.isDemo}
          demoLimitReached={response.demoLimitReached}
        />
      );
    } else if ((now < start || now > end) && user.subscriptionType !== "free") {
      return (
        <SubscriptionMessage message="Your current subscription has expired." userId={session?.user?.id} paidOneTimeAddOns={paidOneTimeAddOns} />
      );
    } else {
      const userId = session?.user?.id;
      const activePlan = await fetchactivesubscription(userId);

      if (!activePlan || activePlan.productLimit <= user.products.length) {
        return (
          <SubscriptionMessage message="You reached the product upload limit for the Current Plan" userId={session?.user?.id} paidOneTimeAddOns={paidOneTimeAddOns} />
        );
      }
    }
  }

  return (
    <Main
      user={session.user}
      productCount={response.count}
      stripeResponse={stripeResponse}
      isDemo={response.isDemo}
      demoLimitReached={response.demoLimitReached}
    />
  );
};

export default page;
