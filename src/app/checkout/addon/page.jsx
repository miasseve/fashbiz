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

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
);

const ADD_ONS_MAP = {
  complete_adds: { label: "Complete Adds", price: 10 },
  instagram: { label: "Instagram", price: 10 },
  webstore: { label: "Webstore (Pay Once)", price: 4800 },
  plugin: { label: "Plug In (Pay Once)", price: 3200 },
};

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

function deduplicateMethods(methods) {
  const seen = new Map();
  for (const m of methods) {
    const fp = m.card?.fingerprint;
    if (!seen.has(fp)) seen.set(fp, m);
  }
  return Array.from(seen.values());
}

function AddonCheckoutForm({ userId, addOns, total }) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [savedMethods, setSavedMethods] = useState([]);
  const [selectedMethodId, setSelectedMethodId] = useState(null);
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

      const res = await fetch("/api/stripe/addon-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, addOns, paymentMethodId }),
      });

      const data = await res.json();

      if (data.success) {
        router.push(
          `/dashboard/add-product?addon_success=true&purchaseId=${data.purchaseId}`
        );
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
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Order summary */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200">
        <h3 className="font-semibold text-lg mb-3">Pay Per Product</h3>
        <div className="space-y-2">
          {addOns.map((key) => {
            const addon = ADD_ONS_MAP[key];
            if (!addon) return null;
            return (
              <div key={key} className="flex justify-between text-sm">
                <span className="text-gray-700">{addon.label}</span>
                <span className="font-medium">{addon.price} DKK</span>
              </div>
            );
          })}
        </div>
        <div className="border-t border-blue-200 mt-3 pt-3 flex justify-between">
          <span className="font-semibold text-gray-800">Total</span>
          <span className="text-2xl font-bold text-blue-600">{total} DKK</span>
        </div>
      </div>

      {/* Payment method */}
      {loadingMethods ? (
        <div className="flex justify-center py-4">
          <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
        </div>
      ) : (
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">
            Card Information
          </label>

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
                        isSelected ? "border-blue-600 bg-blue-600" : "border-gray-300"
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
                <span className="text-[12px] text-gray-700">Use a new card</span>
              </button>
            </div>
          )}

          {selectedMethodId === null && (
            <div className="border border-gray-300 rounded-lg p-4 bg-white focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-red-200">
              <CardElement
                options={{
                  style: {
                    base: {
                      fontSize: "16px",
                      color: "#424770",
                      "::placeholder": { color: "#aab7c4" },
                      fontFamily: "system-ui, -apple-system, sans-serif",
                    },
                    invalid: { color: "#EEF2FF" },
                  },
                }}
              />
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={!stripe || loading || loadingMethods}
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
            Pay {total} DKK
          </>
        )}
      </button>

      <p className="text-[12px] text-gray-500 text-center">
        🔒Secure payment powered by Stripe. <br/>Your card details are never stored on our servers.
      </p>
    </form>
  );
}

export default function AddonCheckoutPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const userId = searchParams.get("userId");
  const addOnsParam = searchParams.get("addOns");

  const addOns = addOnsParam ? addOnsParam.split(",") : [];
  const total = addOns.reduce((sum, key) => {
    const addon = ADD_ONS_MAP[key];
    return sum + (addon ? addon.price : 0);
  }, 0);

  useEffect(() => {
    if (!userId || addOns.length === 0) {
      router.push("/dashboard/add-product");
    }
  }, [userId, addOns.length, router]);

  if (!userId || addOns.length === 0) return null;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-xl w-full">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-gray-800">
              Complete Your Payment
            </h1>
            <p className="text-gray-600 text-[12px] mt-2">
              Enter your payment details below
            </p>
          </div>

          <Elements stripe={stripePromise}>
            <AddonCheckoutForm userId={userId} addOns={addOns} total={total} />
          </Elements>

          <button
            onClick={() => router.push("/dashboard/add-product")}
            className="w-full mt-4 text-gray-600 hover:text-gray-800 text-[12px]"
          >
            &larr; Back
          </button>
        </div>
      </div>
    </div>
  );
}
