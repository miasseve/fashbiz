import SubscriptionPlans from "@/app/dashboard/subscription-plan/SubscriptionPlans";
import { SessionProvider } from "next-auth/react";

export const metadata = {
  title: "Subscription Plans — See What leStores AI Offers",
};

const TrySubscriptionPlanPage = () => {
  return (
    <SessionProvider>
      <SubscriptionPlans readOnly />
    </SessionProvider>
  );
};

export default TrySubscriptionPlanPage;
