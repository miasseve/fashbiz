import React from "react";
import Main from "./Main";
import { auth } from "@/auth";
import { getUserProductCount } from "@/actions/productActions";
import { checkStripeIsConnected } from "@/actions/authActions";
import { getUser } from "@/actions/authActions";
import { getSubscriptionPlans } from "@/actions/stripePlans";

export const metadata = {
  title: "Add Product",
};

const SubscriptionMessage = ({ message }) => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="bg-white p-8 rounded-lg shadow-lg w-[50%] text-center">
      <h2 className="text-2xl font-bold mb-4">Subscription Required</h2>
      <p className="text-gray-700">{message}</p>
      <p className="mt-4 text-gray-700">
        Please <span className="font-semibold">renew or upgrade</span> your plan
        to continue adding products.
      </p>
      <button className="mt-6 bg-Blue-600 text-white px-6 py-2 rounded hover:bg-Blue-700 transition">
        Subscribe Now
      </button>
    </div>
  </div>
);

async function fetchactivesubscription(userId) {
const base =
  process.env.NODE_ENV === "production"
    ? process.env.NEXT_PUBLIC_FRONTEND_LIVE_URL
    : process.env.NEXT_PUBLIC_FRONTEND_URL;

  try {
    const res = await fetch(`${base}/api/stripe/subscription?userId=${userId}`);
    const data = await res.json();
    const subscription = data?.subscription || null;

    if (subscription) {
      const data = await getSubscriptionPlans();

      const formattedPlans = data.map((plan) => ({
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
      return activePlan;
    }
  } catch (error) {
    console.error("Error fetching subscription plan:", error);
    return null;
  }
}

const page = async () => {
  const session = await auth();
  const response = await getUserProductCount();
  const stripeResponse = await checkStripeIsConnected();

  if (response.status != 200) {
    throw new Error(response.error);
  }
  if(session?.user?.isActive === false){
    return <SubscriptionMessage message="Your account is deactivated. Please contact support." />;
  }

  if (session?.user?.isActive === true) {
    const res = await getUser();
    const user = JSON.parse(res.data);
    if (user) {
      const now = new Date();
      const start = new Date(user.subscriptionStart);
      const end = new Date(user.subscriptionEnd);
      if (user.subscriptionType === "free") {
        if (now < start || now > end) {
          return <SubscriptionMessage message="Your free plan has expired." />;
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
          <SubscriptionMessage message="Your current subscription has expired." />
        );
      } else {
        const userId = session?.user?.id;
        const activePlan = await fetchactivesubscription(userId);

        if (!activePlan || activePlan.productLimit <= user.products.length) {
          return (
            <SubscriptionMessage message="You reached the product upload limit for the Current Plan" />
          );
        }
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
