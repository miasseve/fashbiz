"use client";
 
  import { useEffect, useState } from "react";
  import { getUser } from "@/actions/authActions";
  import { Loader2 } from "lucide-react";
  import { useRouter } from "next/navigation";
 
  export default function SubscriptionPage() {
    const [user, setUser] = useState(null);
    const [subscription, setSubscription] = useState(null);
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null);
    const router = useRouter();
 
    useEffect(() => {
      fetchData();
    }, []);
 
    const fetchData = async () => {
      try {
        setLoading(true);
        const userRes = await getUser();
 
        if (userRes.status === 200) {
          const userData = typeof userRes.data === 'string'
            ? JSON.parse(userRes.data)
            : userRes.data;
          setUser(userData);
 
          // Fetch plans and current subscription
          const [plansRes, subRes] = await Promise.all([
            fetch("/api/stripe/plans").then(r => r.json()),
            fetch(`/api/stripe/subscriptionCurrent/current?userId=${userData._id}`).then(r => r.json())
          ]);
         
          setPlans(plansRes);
          setSubscription(subRes.subscription || null);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };
 
    const handleCheckout = async (priceId) => {
      if (!user) return;
      setActionLoading(priceId);
      router.push(`/checkout?userId=${user._id}&priceId=${priceId}`);
    };
 
// Update handleCancelSubscription:
const handleCancelSubscription = async () => {
  if (!confirm("Cancel subscription at period end?")) return;
  setActionLoading('cancel');
 
  try {
    const res = await fetch("/api/stripe/subscription", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user._id, action: "cancel" }),
    });
 
    const data = await res.json();
    if (data.success) {
      alert(data.message);
      await fetchData();
    } else {
      alert(`Error: ${data.error}`);
    }
  } catch (error) {
    alert("Failed to cancel subscription");
  } finally {
    setActionLoading(null);
  }
};
 
// Update handleChangeSubscription:
const handleChangeSubscription = async (newPriceId) => {
  if (!confirm("Change subscription plan?")) return;
  setActionLoading(newPriceId);
 
  try {
    const res = await fetch("/api/stripe/subscription", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user._id, action: "change", priceId: newPriceId }),
    });
 
    const data = await res.json();
    if (data.success) {
      alert(data.message);
      await fetchData();
    } else {
      alert(`Error: ${data.error}`);
    }
  } catch (error) {
    alert("Failed to change subscription");
  } finally {
    setActionLoading(null);
  }
};
 
    const getPlanComparison = (planPrice) => {
      if (!subscription) return null;
     
      const currentPrice = plans.find(p => p.id === subscription.planPriceId)?.unit_amount || 0;
      const newPrice = planPrice;
     
      if (newPrice > currentPrice) return "upgrade";
      if (newPrice < currentPrice) return "downgrade";
      return "current";
    };
 
    if (loading) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
        </div>
      );
    }
 
    if (!user) {
      return (
        <div className="max-w-6xl mx-auto py-16 px-4 text-center">
          <p className="text-xl text-red-600 mb-4">Failed to load user data</p>
          <button
            onClick={fetchData}
            className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      );
    }
 
    const hasActiveSubscription = subscription?.status === "active" || subscription?.status === "trialing";
 
    return (
  <div className="max-w-6xl mx-auto py-16 px-4">
    <h1 className="text-3xl font-bold mb-6 text-center">Subscription Plans</h1>
 
    {hasActiveSubscription ? (
      <div className="mb-10 text-center p-6 border rounded-lg shadow bg-green-50">
        <h2 className="text-xl font-semibold mb-2 text-green-800">
          Current Plan: {subscription.planName}
        </h2>
        <p className="mb-2">
          Status: <strong className="text-green-600 capitalize">{subscription.status}</strong>
        </p>
        <p className="mb-2">
          Renews on: {new Date(subscription.endDate).toLocaleDateString()}
        </p>
        {subscription.cancelAtPeriodEnd && (
          <p className="text-red-500 font-semibold mt-2">
            ⚠️ Will cancel on {new Date(subscription.endDate).toLocaleDateString()}
          </p>
        )}
        {!subscription.cancelAtPeriodEnd && (
          <button
            onClick={handleCancelSubscription}
            disabled={actionLoading === 'cancel'}
            className="mt-4 px-6 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {actionLoading === 'cancel' ? (
              <span className="flex items-center justify-center">
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                Canceling...
              </span>
            ) : (
              "Cancel Subscription"
            )}
          </button>
        )}
      </div>
    ) : (
      <div className="mb-10 text-center p-6 border-2 border-blue-200 rounded-lg bg-blue-50">
        <p className="text-xl font-semibold text-blue-800">
          Choose a plan to get started! 🚀
        </p>
      </div>
    )}
 
    <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
      {plans.map((plan) => {
        const comparison = getPlanComparison(plan.unit_amount);
        const isCurrentPlan = comparison === "current";
       
        return (
          <div
            key={plan.id}
            className={`p-6 border-2 rounded-lg shadow-lg transition-all hover:shadow-xl ${
              isCurrentPlan
                ? "border-green-500 bg-green-50"
                : "border-gray-200 hover:border-blue-400"
            }`}
          >
            {isCurrentPlan && (
              <div className="bg-green-500 text-white text-sm font-bold px-3 py-1 rounded-full inline-block mb-3">
                ✓ Active Plan
              </div>
            )}
           
            <h3 className="text-2xl font-bold text-center mb-4">
              {plan.nickname}
            </h3>
           
            <p className="text-4xl font-bold text-center mb-4 text-[#dc2626]">
              ${(plan.unit_amount / 100).toFixed(2)}
              <span className="text-base text-gray-500 font-normal">
                /{plan.recurring?.interval}
              </span>
            </p>
 
            {plan.product?.description && (
              <p className="text-gray-600 text-center mb-6 text-sm">
                {plan.product.description}
              </p>
            )}
           
            <button
              disabled={isCurrentPlan || actionLoading === plan.id}
              onClick={() => {
                if (hasActiveSubscription && comparison) {
                  handleChangeSubscription(plan.id);
                } else {
                  handleCheckout(plan.id);
                }
              }}
              className={`w-full px-6 py-3 rounded-lg font-semibold transition-all ${
                isCurrentPlan
                  ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                  : actionLoading === plan.id
                  ? "bg-gray-400 text-white cursor-not-allowed"
                  : "bg-[#dc2626] text-white hover:bg-[#b91c1c] transform hover:scale-105"
              }`}
            >
              {actionLoading === plan.id ? (
                <span className="flex items-center justify-center">
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  Processing...
                </span>
              ) : isCurrentPlan ? (
                "Current Plan"
              ) : comparison === "upgrade" ? (
                "Upgrade Plan"
              ) : comparison === "downgrade" ? (
                "Downgrade Plan"
              ) : (
                "Subscribe Now"
              )}
            </button>
          </div>
        );
      })}
    </div>
  </div>
);
  }