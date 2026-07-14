"use client";
import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { Spinner } from "@heroui/react";
import { useRouter } from "next/navigation";
import ADDON_V2_CSS from "./addOnStyles";

// Toggle between the new pricing-card-style "Pay Per Product" card (true) and
// the ORIGINAL dark-header / green-checkbox card (false). The old design is
// kept fully intact below (inside `if (!USE_NEW_ADDON_UI)`) so it can be
// switched back with this single flag — nothing was deleted.
const USE_NEW_ADDON_UI = true;

// Within the new design, choose how the add-ons are presented:
//   true  → PLAIN CHECKLIST. Reads exactly like the "Basic" plan card: a
//           static pink-tick list, no checkboxes, one fixed price. The user
//           buys the base "Complete Adds" upload only (BASE_ADD_ON below).
//           The paid extras (Instagram / Webstore / Plug In) are NOT offered
//           on this screen.
//   false → PICK-YOUR-ADD-ONS. Every add-on is a clickable row with its own
//           price and the total updates live (the design shipped previously).
// Both variants are fully built below — flip this one flag to switch.
const ADDON_PLAIN_CHECKLIST = true;

// The add-on the plain checklist charges for. Its price drives the headline
// number, so the card can never show a price the checkout doesn't match.
const BASE_ADD_ON = "complete_adds";

// What the plain checklist advertises. One place to edit the copy.
const PLAIN_FEATURES = [
  "AI-generated product details",
  "Barcode label with size and price",
  "Product linked to consignor",
  "Auto split payments",
  "No subscription required",
];

const ADD_ONS = [
  {
    key: "complete_adds",
    label: "Complete Adds",
    description:
      "Upload product with AI details, consignor linking & split payments",
    price: 10,
    required: true,
  },
  {
    key: "instagram",
    label: "Instagram",
    description: "Post product directly to your Instagram account",
    price: 10,
    required: false,
  },
  {
    key: "webstore",
    label: "Webstore (Pay Once)",
    description: "List product on your SecondsToSee webstore",
    price: 4800,
    transactionNote: "4% per Transactions",
    required: false,
  },
  {
    key: "plugin",
    label: "Plug In (Pay Once)",
    description: "Connect your Existing webstore ",
    price: 3200,
    required: false,
  },
];
// Note: selectAll total is computed dynamically inside the component

export default function AddOnSelector({ userId, onSuccess, paidOneTimeAddOns = [] }) {
  const router = useRouter();
  const [selected, setSelected] = useState(["complete_adds"]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(10);

const toggle = (key) => {
  const addon = ADD_ONS.find((a) => a.key === key);
  if (addon?.required) return;
  if (paidOneTimeAddOns.includes(key)) return; // already paid, can't toggle

  setSelected((prev) => {
    const isSelected = prev.includes(key);

    return isSelected
      ? prev.filter((k) => k !== key)
      : [...prev, key];
  });
};

  useEffect(() => {
    const newTotal = ADD_ONS.filter((addon) =>
      selected.includes(addon.key) && !paidOneTimeAddOns.includes(addon.key),
    ).reduce((sum, addon) => sum + addon.price, 0);

    setTotal(newTotal);
  }, [selected, paidOneTimeAddOns]);

  const selectAll = () => {
    setSelected(ADD_ONS.filter((a) => !paidOneTimeAddOns.includes(a.key)).map((a) => a.key));
  };

  const handleCheckout = () => {
    // Only send add-ons that haven't been paid yet
    const toPay = selected.filter((k) => !paidOneTimeAddOns.includes(k));
    if (toPay.length === 0) {
      toast.error("Please select at least one add-on");
      return;
    }
    router.push(
      `/checkout/addon?userId=${userId}&addOns=${toPay.join(",")}`
    );
  };

  /* ═══════════════════════════════════════════════════════════════════════
     OLD UI — the original dark-header "Pay Per Product" card.
     NOT deleted: flip USE_NEW_ADDON_UI to false at the top of this file to
     bring it straight back. All the logic above is shared by both designs.
     ═══════════════════════════════════════════════════════════════════════ */
  if (!USE_NEW_ADDON_UI) {
    return (
    <div className="max-w-lg mx-auto mt-8 mb-10 px-4">
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
        {/* Header */}
        <div className="bg-gradient-to-r from-gray-900 to-gray-800 px-6 py-5 text-white">
          <h2 className="text-2xl font-bold">Pay Per Product</h2>
          <p className="text-gray-300 text-[12px] mt-1">
            No subscription needed. Select the features you want for this
            product upload.
          </p>
        </div>

        {/* Add-on list */}
        <div className="p-5 space-y-3">
          {ADD_ONS.map((addon) => {
            const isAlreadyPaid = paidOneTimeAddOns.includes(addon.key);
            const isSelected = selected.includes(addon.key);
            return (
              <button
                key={addon.key}
                type="button"
                onClick={() => toggle(addon.key)}
                disabled={isAlreadyPaid}
                className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left ${
                  isAlreadyPaid
                    ? "border-gray-200 bg-gray-100 opacity-60 cursor-not-allowed"
                    : isSelected
                    ? "border-[#17C964] bg-green-50"
                    : "border-gray-200 bg-gray-50 hover:border-gray-300"
                } ${addon.required && !isAlreadyPaid ? "cursor-default" : !isAlreadyPaid ? "cursor-pointer" : ""}`}
              >
                {/* Checkbox */}
                <div
                  className={`w-5 h-5 rounded flex-shrink-0 flex items-center justify-center border-2 transition-colors ${
                    isAlreadyPaid
                      ? "bg-gray-400 border-gray-400"
                      : isSelected
                      ? "bg-[#17C964] border-[#17C964]"
                      : "border-gray-300 bg-white"
                  }`}
                >
                  {(isSelected || isAlreadyPaid) && (
                    <svg
                      className="w-3 h-3 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={3}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  )}
                </div>

                {/* Label */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-900 text-[15px]">
                      {addon.label}
                    </span>
                    {addon.required && (
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#17C964] bg-green-100 px-2 py-0.5 rounded-full">
                        Required
                      </span>
                    )}
                    {isAlreadyPaid && (
                      <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 bg-gray-200 px-2 py-0.5 rounded-full">
                        Paid
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {addon.description}
                  </p>
                </div>

                {/* Price */}
                <div className="text-right flex-shrink-0">
                  {isAlreadyPaid ? (
                    <div className="font-bold text-gray-400 line-through">
                      {addon.price} DKK
                    </div>
                  ) : (
                    <div className="font-bold text-gray-900">
                      {addon.price} DKK
                    </div>
                  )}
                  {addon.transactionNote && (
                    <div className="text-[12px] text-gray-800 mt-0.5">
                      {addon.transactionNote}
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Select all shortcut */}
        {ADD_ONS.some((a) => !selected.includes(a.key) && !paidOneTimeAddOns.includes(a.key)) && (
          <div className="px-5 pb-2">
            <button
              type="button"
              onClick={selectAll}
              className="text-[12px] text-[#17C964] font-medium hover:underline"
            >
              Select all features ({ADD_ONS.filter((a) => !paidOneTimeAddOns.includes(a.key)).reduce((s, a) => s + a.price, 0)} DKK)
            </button>
          </div>
        )}

        {/* Footer with total and CTA */}
        <div className="border-t border-gray-100 px-6 py-5 bg-gray-50">
          <div className="flex items-center justify-between mb-4">
            <span className="text-gray-600 font-medium">Total</span>
            <span className="text-2xl font-bold text-gray-900">
              {total} DKK
            </span>
          </div>
          <button
            onClick={handleCheckout}
            disabled={loading || selected.length === 0}
            className="w-full bg-gradient-to-r from-[#EF4444] to-[#DC2626] hover:from-[#DC2626] hover:to-[#B91C1C] text-white font-semibold py-3 px-6 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Spinner size="sm" color="white" />
                Processing...
              </>
            ) : (
              <>Pay & Upload Product</>
            )}
          </button>
          <p className="text-[12px] text-gray-400 text-center mt-3">
            One-time payment per product.  <br/> Secure checkout via Stripe.
          </p>
        </div>
      </div>
    </div>
    );
  }

  /* ═══════════════════════════════════════════════════════════════════════
     NEW UI (A) — PLAIN CHECKLIST.
     Reads exactly like the "Basic" plan card on /dashboard/subscription-plan:
     one price, a static pink-tick list, one pink pill button. Checkout buys
     BASE_ADD_ON only (that is already the default value of `selected`, so
     handleCheckout below needs no change).
     ═══════════════════════════════════════════════════════════════════════ */
  const basePlan = ADD_ONS.find((a) => a.key === BASE_ADD_ON);

  if (ADDON_PLAIN_CHECKLIST) {
    return (
      <>
        <style>{ADDON_V2_CSS}</style>

        <div className="ap-wrap">
          <div className="ap-card">
            <div className="ap-badge">Pay As You Go</div>

            <div className="ap-name">Pay Per Product</div>
            <p className="ap-desc">
              No subscription needed. Pay only for the products you upload.
            </p>

            <div className="ap-price">
              <span className="ap-price__num">
                {(basePlan?.price ?? 0).toLocaleString("en-US")}
              </span>
              <span className="ap-price__unit">DKK / product</span>
            </div>

            <div className="ap-list">
              {PLAIN_FEATURES.map((feature) => (
                <div key={feature} className="ap-list__row">
                  <span className="ap-list__check">&#10003;</span>
                  {feature}
                </div>
              ))}
            </div>

            <button
              onClick={handleCheckout}
              disabled={loading || selected.length === 0}
              className="ap-cta"
            >
              {loading ? (
                <>
                  <Spinner size="sm" color="white" />
                  Processing...
                </>
              ) : (
                <>Pay &amp; Upload Product</>
              )}
            </button>

            <p className="ap-note">
              One-time payment per product.
              <br />
              Secure checkout via Stripe.
            </p>
          </div>
        </div>
      </>
    );
  }

  /* ═══════════════════════════════════════════════════════════════════════
     NEW UI (B) — PICK YOUR ADD-ONS.
     Same card, but every add-on is a clickable row with its own price and a
     live-updating total. Set ADDON_PLAIN_CHECKLIST to false to use this.
     ═══════════════════════════════════════════════════════════════════════ */
  const selectableAddOns = ADD_ONS.filter((a) => !paidOneTimeAddOns.includes(a.key));
  const selectAllTotal = selectableAddOns.reduce((s, a) => s + a.price, 0);
  const showSelectAll = selectableAddOns.some((a) => !selected.includes(a.key));

  return (
    <>
      <style>{ADDON_V2_CSS}</style>

      <div className="ap-wrap">
        <div className="ap-card">
          <div className="ap-badge">Pay As You Go</div>

          <div className="ap-name">Pay Per Product</div>
          <p className="ap-desc">
            No subscription needed. Select the features you want for this
            product upload.
          </p>

          {/* Live total, styled like the plan card's price */}
          <div className="ap-price">
            <span className="ap-price__num">{total.toLocaleString("en-US")}</span>
            <span className="ap-price__unit">DKK / product</span>
          </div>

          {/* Selectable feature rows */}
          <div className="ap-features">
            {ADD_ONS.map((addon) => {
              const isAlreadyPaid = paidOneTimeAddOns.includes(addon.key);
              const isSelected = selected.includes(addon.key);
              const isTicked = isSelected || isAlreadyPaid;
              const isLocked = addon.required || isAlreadyPaid;

              return (
                <button
                  key={addon.key}
                  type="button"
                  onClick={() => toggle(addon.key)}
                  disabled={isAlreadyPaid}
                  className={`ap-feature${isLocked ? " ap-feature--locked" : ""}${
                    isAlreadyPaid ? " ap-feature--paid" : ""
                  }`}
                >
                  <span className={`ap-check${isTicked ? "" : " ap-check--off"}`}>
                    {isTicked ? "✓" : ""}
                  </span>

                  <span className="ap-feature__body">
                    <span className="ap-feature__top">
                      <span className="ap-feature__label">{addon.label}</span>
                      {addon.required && (
                        <span className="ap-pill ap-pill--required">Required</span>
                      )}
                      {isAlreadyPaid && (
                        <span className="ap-pill ap-pill--paid">Paid</span>
                      )}
                    </span>
                    <span className="ap-feature__note">{addon.description}</span>
                  </span>

                  <span className="ap-feature__price">
                    <span
                      className={`ap-feature__amount${
                        isAlreadyPaid ? " ap-feature__amount--paid" : ""
                      }`}
                    >
                      {addon.price.toLocaleString("en-US")} DKK
                    </span>
                    {addon.transactionNote && (
                      <span className="ap-feature__fee">{addon.transactionNote}</span>
                    )}
                  </span>
                </button>
              );
            })}
          </div>

          {showSelectAll && (
            <button type="button" onClick={selectAll} className="ap-selectall">
              Select all features ({selectAllTotal.toLocaleString("en-US")} DKK)
            </button>
          )}

          <button
            onClick={handleCheckout}
            disabled={loading || selected.length === 0}
            className="ap-cta"
          >
            {loading ? (
              <>
                <Spinner size="sm" color="white" />
                Processing...
              </>
            ) : (
              <>Pay &amp; Upload Product</>
            )}
          </button>

          <p className="ap-note">
            One-time payment per product.
            <br />
            Secure checkout via Stripe.
          </p>
        </div>
      </div>
    </>
  );
}
