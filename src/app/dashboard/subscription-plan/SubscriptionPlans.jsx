"use client";
import { useEffect, useState } from "react";
import { Card, CardBody, CardHeader, Button } from "@heroui/react";
import dayjs from "dayjs";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
export default function SubscriptionPlans({ user }) {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const res = await fetch("/api/stripe/plans");
      const data = await res.json();

      const formattedPlans = data.map((plan) => ({
        id: plan.id,
        name: plan.product.name,
        price: plan.unit_amount
          ? `$${(plan.unit_amount / 100).toFixed(2)}`
          : "$0",
        period: plan.recurring_interval || "month",
        features: plan.features || ["✔ Basic access"],
      }));

      setPlans(formattedPlans);
    } catch (error) {
      console.error("Error fetching plans:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64 text-gray-500">
        Loading plans...
      </div>
    );
  }


  const hasActiveSubscription =
    user?.subscriptionEnd && dayjs().isBefore(dayjs(user.subscriptionEnd));

  const activePlan = hasActiveSubscription ? user.subscriptionType : null;

  const handleSubscribe = async (plan) => {
    try {
      // Send plan info and user ID to your backend API route
      const res = await fetch("/api/stripe/create-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          priceId: plan.id, // Stripe Price ID
          userId: user._id, // assuming you have user._id or user.id
        }),
      });

      const data = await res.json();

      if (data.url) {
        // Redirect user to Stripe Checkout
        window.location.href = data.url;
      } else {
        alert("Failed to start checkout session.");
      }
    } catch (error) {
      console.error("Subscription error:", error);
      alert("Something went wrong. Please try again.");
    }
  };

  const handleCheckout = async (priceId) => {
    if (!user) return;
    router.push(`/checkout?userId=${user._id}&priceId=${priceId}`);
  };
  // Update handleCancelSubscription:
  const handleCancelSubscription = async () => {
    Swal.fire({
      title: "Are you sure?",
      text: "Do you want to cancel your subscription at the end of the current period?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, cancel it!",
      cancelButtonText: "No, keep me subscribed",
      reverseButtons: true,
      customClass: {
        confirmButton:
          "bg-red-600 hover:bg-red-700 text-white font-bold px-4 py-2 rounded-lg",
        cancelButton:
          "bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold px-4 py-2 rounded-lg",
      },
    }).then(async (result) => {
      if (result.isConfirmed) {
        // setActionLoading('cancel');
        try {
          const res = await fetch("/api/stripe/subscription", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId: user._id, action: "cancel" }),
          });
          const data = await res.json();
          if (data.success) {
            toast.success(
              data.message || "Subscription will cancel at period end"
            );
            // await fetchData();
          } else {
            toast.error(`Error: ${data.error}`);
          }
        } catch (error) {
          console.log(error.message);
          toast.error("Error cancelling subscription");
          // alert("Failed to cancel subscription");
        } finally {
          // setActionLoading(null);
        }
      }
    });
   
  };

  return (
    <section className="py-16">
      <div className="max-w-6xl mx-auto text-center mb-10">
        <h2 className="text-6xl font-bold text-gray-900 text-white mb-4">
          Choose Your Plan
        </h2>
        {hasActiveSubscription ? (
          <div className="max-w-xl mx-auto mb-10">
            <Card className="relative bg-gray-200 dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden p-10">
              <div className="absolute top-4 right-4 bg-green-500 text-white font-bold px-5 py-2 rounded-lg shadow-lg text-2xl">
                ACTIVE
              </div>
              <CardHeader className="flex flex-col items-center pt-4">
                <h3 className="text-5xl font-extrabold text-gray-900 dark:text-white mb-3">
                  {activePlan.charAt(0).toUpperCase() + activePlan.slice(1)}{" "}
                  Plan
                </h3>
                <p className="text-2xl text-gray-700 dark:text-gray-300 font-semibold">
                  Your subscription is currently active
                </p>
              </CardHeader>
              <CardBody className="text-center space-y-6 pt-6">
                <div className="flex justify-around w-full text-gray-800 dark:text-gray-200 font-semibold text-xl">
                  <p>
                    <span className="font-bold">Start:</span>{" "}
                    {dayjs(user.subscriptionStart).format("DD MMM YYYY")}
                  </p>
                  <p>
                    <span className="font-bold">End:</span>{" "}
                    {dayjs(user.subscriptionEnd).format("DD MMM YYYY")}
                  </p>
                </div>
                <ul className="text-gray-700 dark:text-gray-300 mb-6 space-y-3 text-xl text-left px-6">
                  <li>✔ Full access to premium features</li>
                  <li>✔ Priority customer support</li>
                  <li>✔ Unlimited product uploads</li>
                  <li>✔ Advanced analytics & reports</li>
                </ul>
                {user.subscriptionType != "free" && (
                  <Button
                    className="bg-red-600 hover:bg-red-700 text-white font-bold px-10 py-4 rounded-xl shadow-xl text-xl transition-all duration-300"
                    onPress={handleCancelSubscription}
                  >
                    Cancel Subscription
                  </Button>
                )}
              </CardBody>
            </Card>
          </div>
        ) : (
          <div className="max-w-xl mx-auto mb-10">
            <Card className="bg-gray-200 dark:bg-gray-800 rounded-2xl text-gray-900 dark:text-white shadow-lg">
              <CardHeader className="flex flex-col items-center pt-8 pb-4">
                <h3 className="text-3xl sm:text-4xl font-extrabold text-red-600 mb-2">
                  Subscription Expired
                </h3>
                <p className="text-xl sm:text-2xl font-semibold text-gray-700 dark:text-gray-300 text-center">
                  Your free plan has expired
                </p>
              </CardHeader>
              <CardBody className="text-center pb-8 px-6">
                <ul className="text-gray-700 dark:text-gray-300 mb-6 space-y-3 text-lg text-left px-6">
                  <li>✔ Full access to premium features</li>
                  <li>✔ Priority customer support</li>
                  <li>✔ Unlimited product uploads</li>
                  <li>✔ Advanced analytics & reports</li>
                </ul>

                <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-400">
                  Please choose a plan below to continue enjoying our services.
                </p>
              </CardBody>
            </Card>
          </div>
        )}
      </div>

     <div className="flex flex-wrap justify-center gap-8 px-4">
        {plans.map((plan, index) => (
          <Card
            key={index}
            className={`w-full sm:w-[90%] md:w-[30%] rounded-2xl transition-all transform hover:scale-105 hover:shadow-2xl overflow-hidden ${
              plan.popular
                ? "bg-gradient-to-r from-[#f97316] to-[#f87171] text-white shadow-lg border-0"
                : "bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
            }`}
          >
            {plan.popular && (
              <div className="absolute top-4 right-4 bg-yellow-400 text-black font-bold px-4 py-1 rounded-full text-lg shadow-md">
                POPULAR
              </div>
            )}
            <CardHeader className="flex flex-col items-center pt-6">
              <h3
                className={`text-4xl font-extrabold mb-4 ${
                  plan.popular ? "text-white" : "text-gray-800 dark:text-white"
                }`}
              >
                {plan.name}
              </h3>
              <p
                className={`text-5xl font-bold mt-3 ${
                  plan.popular
                    ? "text-white"
                    : "text-[#dc2626] dark:text-[#dc2626]"
                }`}
              >
                {plan.price}
                <span
                  className={`text-2xl ml-2 ${
                    plan.popular
                      ? "text-white/80"
                      : "text-gray-500 dark:text-gray-400"
                  }`}
                >
                  /{plan.period}
                </span>
              </p>
            </CardHeader>

            <CardBody className="flex flex-col items-center pb-6">
              <ul className="text-gray-700 dark:text-gray-300 mb-6 space-y-3 text-lg text-left px-6">
                <li>✔ Full access to premium features</li>
                <li>✔ Priority customer support</li>
                <li>✔ Unlimited product uploads</li>
                <li>✔ Advanced analytics & reports</li>
              </ul>
              <Button
                className={`text-white font-bold px-10 py-4 rounded-xl shadow-xl text-xl transition-all duration-300 ${
                  plan.popular
                    ? "bg-white text-[#f97316] hover:bg-gray-100"
                    : "bg-[#dc2626] hover:bg-red-700"
                }`}
                onPress={() => {
                  if (user && user.subscriptionType === plan.name) return;
                  handleCheckout(plan.id);
                }}
                disabled={user && user.subscriptionType === plan.name}
              >
                {user.subscriptionType === plan.name
                  ? "Subscribed"
                  : plan.popular
                  ? "Get Started"
                  : "Subscribe Now"}
              </Button>
            </CardBody>
          </Card>
        ))}
      </div>
    </section>
  );
}
