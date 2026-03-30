import SubscriptionPlans from "@/app/dashboard/subscription-plan/SubscriptionPlans";

export const metadata = {
  title: "Subscription Plans — See What REE Offers",
};

const TrySubscriptionPlanPage = () => {
  return <SubscriptionPlans readOnly />;
};

export default TrySubscriptionPlanPage;
