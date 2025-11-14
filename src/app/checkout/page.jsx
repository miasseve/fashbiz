"use client";
import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { Loader2, Lock } from "lucide-react";
import {unarchiveProduct} from "@/actions/productActions";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
);

function CheckoutForm({ plan, userId }) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);
    setError(null);

    try {
      const urlParams = new URL(window.location.href).searchParams;
      const encryptedReferral = urlParams.get("referral");

      let referralCode = null;
      let referredBy = null;
      if (encryptedReferral) {
        const res = await fetch(
          `/api/encryptreferral?referral=${encodeURIComponent(
            encryptedReferral
          )}`
        );
        const data = await res.json();
        referralCode = data.code || null;
        referredBy = data.userId || null;
        console.log("Decrypted referral code:", referralCode,"of" ,referredBy);
      }
      const cardElement = elements.getElement(CardElement);

      const { error: pmError, paymentMethod } =
        await stripe.createPaymentMethod({
          type: "card",
          card: cardElement,
        });

      if (pmError) {
        setError(pmError.message);
        setLoading(false);
        return;
      }

      const res = await fetch("/api/stripe/subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create",
          userId,
          priceId: plan.id,
          paymentMethodId: paymentMethod.id,
          referredBy: referredBy,
        }),
      });

      const data = await res.json();

      if (data.success) {
        await fetch("/api/referral/update", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId, referralCode }),
        });
        await unarchiveProduct(userId);
        router.push("dashboard/subscription-plan");
        router.refresh();
      } else {
        setError(data.error || "Payment failed");
      }
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200">
        <h3 className="font-semibold text-lg mb-1">{plan.nickname}</h3>
        <p className="text-3xl font-bold text-blue-600">
          {(plan.unit_amount / 100).toFixed(2)} {plan.currency.toUpperCase()}
          <span className="text-base text-gray-600 font-normal">
            /{plan.recurring?.interval}
          </span>
        </p>
        {plan.product?.description && (
          <p className="text-sm text-gray-600 mt-2">
            {plan.product.description}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Card Information
        </label>
        <div className="border border-gray-300 rounded-lg p-4 bg-white focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-200">
          <CardElement
            options={{
              style: {
                base: {
                  fontSize: "16px",
                  color: "#424770",
                  "::placeholder": { color: "#aab7c4" },
                  fontFamily: "system-ui, -apple-system, sans-serif",
                },
                invalid: { color: "#dc2626" },
              },
            }}
          />
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={!stripe || loading}
        className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-all"
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin mr-2" />
            Processing Payment...
          </>
        ) : (
          <>
            <Lock className="w-4 h-4 mr-2" />
            Subscribe Now
          </>
        )}
      </button>

      <p className="text-xs text-gray-500 text-center">
        🔒 Secure payment powered by Stripe. Your card details are never stored
        on our servers.
      </p>
    </form>
  );
}

export default function CheckoutPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);

  const userId = searchParams.get("userId");
  const priceId = searchParams.get("priceId");

  useEffect(() => {
    if (!userId || !priceId) {
      router.push("dashboard/subscription-plan");
      return;
    }

    fetch("/api/stripe/plans")
      .then((r) => r.json())
      .then((plans) => {
        const selectedPlan = plans.find((p) => p.id === priceId);
        if (selectedPlan) {
          setPlan(selectedPlan);
        } else {
          router.push("dashboard/subscription-plan");
        }
      })
      .catch(() => router.push("dashboard/subscription-plan"))
      .finally(() => setLoading(false));
  }, [priceId, userId, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!plan) return null;

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-gray-800">
              Complete Your Subscription
            </h1>
            <p className="text-gray-600 text-sm mt-2">
              Enter your payment details below
            </p>
          </div>

          <Elements stripe={stripePromise}>
            <CheckoutForm plan={plan} userId={userId} />
          </Elements>

          <button
            onClick={() => router.push("dashboard/subscription-plan")}
            className="w-full mt-4 text-gray-600 hover:text-gray-800 text-sm"
          >
            ← Back to Plans
          </button>
        </div>
      </div>
    </div>
  );
}
