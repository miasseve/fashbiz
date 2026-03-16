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
import { Loader2, Lock, CreditCard, PlusCircle } from "lucide-react";
import { unarchiveProduct } from "@/actions/productActions";
import { getUser } from "@/actions/authActions";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
);

const CARD_BRAND_COLORS = {
  visa: "#1A1F71",
  mastercard: "#EB001B",
  amex: "#007BC1",
  discover: "#FF6600",
};

function CardBadge({ brand }) {
  const color = CARD_BRAND_COLORS[brand] || "#6B7280";
  return (
    <span
      className="text-[10px] font-bold uppercase px-2 py-0.5 rounded border"
      style={{ color, borderColor: color }}
    >
      {brand}
    </span>
  );
}

// Deduplicate by card fingerprint, keep newest
function deduplicateMethods(methods) {
  const seen = new Map();
  for (const m of methods) {
    const fp = m.card?.fingerprint;
    if (!seen.has(fp)) seen.set(fp, m);
  }
  return Array.from(seen.values());
}

function CheckoutForm({ plan, userId }) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [savedMethods, setSavedMethods] = useState([]);
  const [selectedMethodId, setSelectedMethodId] = useState(null); // null = new card
  const [loadingMethods, setLoadingMethods] = useState(true);

  useEffect(() => {
    fetch(`/api/stripe/payment-methods?userId=${userId}`)
      .then((r) => r.json())
      .then((data) => {
        const methods = deduplicateMethods(data.paymentMethods || []);
        setSavedMethods(methods);
        if (methods.length > 0) setSelectedMethodId(methods[0].id);
      })
      .catch(() => {})
      .finally(() => setLoadingMethods(false));
  }, [userId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe) return;

    setLoading(true);
    setError(null);

    try {
      const urlParams = new URL(window.location.href).searchParams;
      const encryptedReferral = urlParams.get("referral");
      const userResponse = await getUser(userId);
      const userData = JSON.parse(userResponse?.data || "{}");
      const userRole = userData?.role || null;

      let referralCode = null;
      let referredBy = null;
      if (encryptedReferral) {
        const res = await fetch(
          `/api/encryptreferral?referral=${encodeURIComponent(encryptedReferral)}`,
        );
        const data = await res.json();
        referralCode = data.code || null;
        referredBy = data.userId || null;
      }

      let paymentMethodId = selectedMethodId;

      if (!selectedMethodId) {
        if (!elements) return;
        const cardElement = elements.getElement(CardElement);
        const { error: pmError, paymentMethod } =
          await stripe.createPaymentMethod({ type: "card", card: cardElement });
        if (pmError) {
          setError(pmError.message);
          setLoading(false);
          return;
        }
        paymentMethodId = paymentMethod.id;
      }

      const res = await fetch("/api/stripe/subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create",
          userId,
          priceId: plan.id,
          paymentMethodId,
          referredBy,
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
        if (userRole === "brand") {
          await fetch("/api/brand", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId }),
          });
        }
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

  const hasSaved = savedMethods.length > 0;

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Plan summary */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-5 rounded-xl border border-blue-200">
        <p className="text-[12px] text-gray-500 mb-1">Selected plan</p>
        <h3 className="font-semibold text-xl text-gray-800">{plan.nickname}</h3>
        <p className="text-3xl font-bold text-blue-600 mt-1">
          {(plan.unit_amount / 100).toFixed(2)}{" "}
          <span className="text-[12px] font-medium">
            {plan.currency.toUpperCase()}
          </span>
          <span className="text-[12px] text-gray-500 font-normal">
            /{plan.recurring?.interval}
          </span>
        </p>
      </div>

      {/* Payment method section */}
      {loadingMethods ? (
        <div className="flex justify-center py-6">
          <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-[12px] font-medium text-gray-700">
            Payment method
          </p>

          {hasSaved && (
            <div className="divide-y divide-gray-100 border border-gray-200 rounded-xl overflow-hidden">
              {savedMethods.map((method) => {
                const isSelected = selectedMethodId === method.id;
                return (
                  <button
                    key={method.id}
                    type="button"
                    onClick={() => setSelectedMethodId(method.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                      isSelected ? "bg-blue-50" : "bg-white hover:bg-gray-50"
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full border-2 flex-shrink-0 ${
                        isSelected
                          ? "border-blue-600 bg-blue-600"
                          : "border-gray-300"
                      }`}
                    >
                      {isSelected && (
                        <div className="w-full h-full rounded-full scale-50 bg-white" />
                      )}
                    </div>
                    <CreditCard className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <CardBadge brand={method.card.brand} />
                    <span className="text-[12px] text-gray-700 flex-1">
                      •••• {method.card.last4}
                    </span>
                    <span className="text-[12px] text-gray-400">
                      {method.card.exp_month}/{method.card.exp_year}
                    </span>
                  </button>
                );
              })}

              {/* New card option */}
              <button
                type="button"
                onClick={() => setSelectedMethodId(null)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                  selectedMethodId === null
                    ? "bg-blue-50"
                    : "bg-white hover:bg-gray-50"
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full border-2 flex-shrink-0 ${
                    selectedMethodId === null
                      ? "border-blue-600 bg-blue-600"
                      : "border-gray-300"
                  }`}
                >
                  {selectedMethodId === null && (
                    <div className="w-full h-full rounded-full scale-50 bg-white" />
                  )}
                </div>
                <PlusCircle className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <span className="text-[12px] text-gray-700">
                  Use a new card
                </span>
              </button>
            </div>
          )}

          {/* New card input */}
          {selectedMethodId === null && (
            <div className="border border-gray-200 rounded-xl p-4 bg-white focus-within:border-blue-400 focus-within:ring-1 focus-within:ring-blue-300 transition">
              <CardElement
                options={{
                  style: {
                    base: {
                      fontSize: "15px",
                      color: "#374151",
                      "::placeholder": { color: "#9CA3AF" },
                      fontFamily: "system-ui, -apple-system, sans-serif",
                    },
                    invalid: { color: "#DC2626" },
                  },
                }}
              />
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={!stripe || loading || loadingMethods}
        className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <Lock className="w-4 h-4" />
            Subscribe Now
          </>
        )}
      </button>

      <p className="text-[12px] text-gray-400 text-center flex items-center justify-center gap-1">
        <span>
          🔒Secure payment powered by Stripe. <br />
          Your card details are never stored on our servers.
        </span>
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
        if (selectedPlan) setPlan(selectedPlan);
        else router.push("dashboard/subscription-plan");
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
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <div style={{ width: "359.99px" }}>
        <div
          className="bg-white rounded-2xl shadow-lg p-8"
          style={{ width: "359.99px", minHeight: "398.96px" }}
        >
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-bold text-gray-800">
              Complete Your Subscription
            </h1>
            <p className="text-[12px] text-gray-500 mt-1">
              Review your plan and confirm payment
            </p>
          </div>

          <Elements stripe={stripePromise}>
            <CheckoutForm plan={plan} userId={userId} />
          </Elements>

          <button
            onClick={() => router.push("dashboard/subscription-plan")}
            className="w-full mt-5 text-[12px] text-gray-400 hover:text-gray-600 transition"
          >
            ← Back to Plans
          </button>
        </div>
      </div>
    </div>
  );
}
