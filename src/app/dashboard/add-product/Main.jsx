"use client";
import React, { useState } from "react";
import FirstStep from "./components/FirstStep";
import SecondStep from "./components/SecondStep";
import Link from "next/link";
import QRCode from "./components/QRCode";
import { setCurrentStep } from "@/features/productSlice";
import { useSelector, useDispatch } from "react-redux";
import ConsignorSelect from "./components/ConsignorSelect";
import ProgressBar from "./components/ProgressBar";
import { enableDemoMode } from "@/actions/accountAction";
import { useRouter } from "next/navigation";
const Main = ({
  user,
  productCount,
  stripeResponse,
  isDemo,
  demoLimitReached,
  addonPurchase,
  showProductLimitUpsell,
}) => {
  const currentStep = useSelector((state) => state.product.currentStep);
  const [count, setCount] = useState(productCount || 0);
  const [showUpsell, setShowUpsell] = useState(!!showProductLimitUpsell);
  const router = useRouter();
  const dispatch = useDispatch();

  const handleExploreLeStoresAI = () => {
    fetch("/api/dashboard/product-limit-upsell-click", { method: "POST" }).catch(() => {});
    router.push("/dashboard/subscription-plan");
  };

  const handleSaveUrl = () => {
    dispatch(setCurrentStep(currentStep + 1));
  };

  const handleBackStep = () => {
    dispatch(setCurrentStep(currentStep - 1));
  };

  const handleAddMoreProducts = () => {
    setCount(count + 1);
    dispatch(setCurrentStep(2));
  };

  const handleDemoMode = async () => {
    try {
      const reponse = await enableDemoMode(user.id);
      if (reponse.status === 200) {
        dispatch(setCurrentStep(1));
        window.location.reload();
      } else {
        console.log("Failed to enable demo mode");
      }
    } catch (error) {
      console.error("Error enabling demo mode:", error);
    }
  };

  const steps = ["Select Client", "Product Details", "Finish"];
  return (
    <div className="mx-auto lg:my-[10px] bg-white rounded-xl dark:bg-gray-900 transition-all ">
      {showUpsell && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setShowUpsell(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-2xl font-bold text-gray-900 mb-3">
              You&apos;ve added 300 products. Ready to automate the rest?
            </h3>
            <p className="text-gray-600 mb-4 leading-relaxed">
              Keep adding products to Le Stores for free — or let Le Stores AI
              handle the full workflow for you: inventory, barcodes, publishing,
              syncing and automatic delisting when sold.
            </p>
            <p className="text-lg font-semibold text-gray-900 mb-6">
              From 549 DKK/month
            </p>
            <button
              onClick={handleExploreLeStoresAI}
              className="w-full rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-semibold py-3 mb-3 transition-all"
            >
              Upgrade to Le Stores AI
            </button>
            <a
              href="mailto:mia@le-stores.com?subject=Book%20an%20in-store%20demo%20(Copenhagen%20area)"
              onClick={() => setShowUpsell(false)}
              className="block w-full rounded-xl border border-gray-200 text-gray-700 font-semibold py-3 mb-3 hover:bg-gray-50 transition-colors"
            >
              Book an in-store demo with Mia — Copenhagen area
            </a>
            <a
              href="mailto:mia@le-stores.com?subject=Book%20an%20online%20demo%20(outside%20Copenhagen)"
              onClick={() => setShowUpsell(false)}
              className="block w-full rounded-xl border border-gray-200 text-gray-700 font-semibold py-3 mb-3 hover:bg-gray-50 transition-colors"
            >
              Book an online demo — outside Copenhagen
            </a>
            <button
              onClick={() => setShowUpsell(false)}
              className="w-full rounded-xl border border-gray-200 text-gray-600 font-semibold py-3 hover:bg-gray-50 transition-colors"
            >
              Continue Le Stores Discovery app only
            </button>
          </div>
        </div>
      )}
      <ProgressBar currentStep={currentStep} steps={steps} />
      {addonPurchase && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-red-800 px-4 py-3">
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <svg
                  className="w-6 h-6 text-[#17C964]"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="text-md font-medium text-red-800 dark:text-red-300">
                  Pay-Per-Product Mode
                </span>
              </div>
              <span className="text-md text-blue-600 dark:text-blue-400 hidden sm:inline">
                Add-ons:{" "}
                {addonPurchase.addOns
                  .map((a) => a.replace(/_/g, " "))
                  .join(", ")}{" "}
                ({addonPurchase.totalAmount / 100} DKK)
              </span>
            </div>
          </div>
        </div>
      )}
      {stripeResponse?.status !== 200 ? (
        <div className="flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 py-12 sm:py-20">
          {/* Primary CTA - Stripe Connect */}
          <Link
            href="/dashboard/stripe-connect"
            className="group relative w-full max-w-xs sm:max-w-sm mb-3 sm:mb-4"
          >
            <div className="absolute -inset-0.5 bg-gradient-to-r from-green-600 to-emerald-600 rounded-lg sm:rounded-xl blur opacity-60 group-hover:opacity-100 transition duration-300"></div>
            <div className="relative bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-lg sm:rounded-xl font-semibold text-base sm:text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center gap-2">
              <svg
                className="w-4 h-4 sm:w-5 sm:h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
              <span className="whitespace-nowrap">Go to Stripe Connect</span>
            </div>
          </Link>

          {/* Divider */}
          <div className="flex items-center gap-3 sm:gap-4 w-full max-w-xs sm:max-w-sm my-4 sm:my-6">
            <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700"></div>
            <span className="text-md sm:text-md text-gray-500 dark:text-gray-400 font-medium">
              OR
            </span>
            <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700"></div>
          </div>

          {/* Secondary CTA - Skip for now (continue without connecting Stripe) */}
          <button
            onClick={handleDemoMode}
            disabled={demoLimitReached}
            className="w-full max-w-xs sm:max-w-sm px-6 sm:px-8 py-3 sm:py-4 rounded-lg sm:rounded-xl font-semibold text-base sm:text-lg border-2 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all duration-200 flex items-center justify-center gap-2 group disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:border-gray-200 dark:disabled:hover:border-gray-700 relative"
          >
            {/* Limit-reached Badge */}
            {demoLimitReached && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-md font-bold px-2 py-1 rounded-full shadow-lg animate-pulse">
                Limit reached
              </span>
            )}
            <svg
              className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition group-disabled:text-gray-300 dark:group-disabled:text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            Skip for now
          </button>

          {/* Show different message + upgrade CTA when the free upload limit is reached */}
          {demoLimitReached && (
            <>
              <p className="text-sm sm:text-md text-orange-600 dark:text-orange-400 text-center max-w-xs sm:max-w-md mt-4 sm:mt-6 leading-relaxed px-4 py-2 bg-orange-100 dark:bg-orange-900/40 rounded-md font-semibold">
                You've reached your free upload limit. Subscribe to a plan to upload
                more products and go live.
              </p>
              <Link
                href="/dashboard/subscription-plan"
                className="mt-4 w-full max-w-xs sm:max-w-sm px-6 sm:px-8 py-3 sm:py-4 rounded-lg sm:rounded-xl font-semibold text-base sm:text-lg text-white bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center gap-2"
              >
                <svg
                  className="w-4 h-4 sm:w-5 sm:h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 10l7-7m0 0l7 7m-7-7v18"
                  />
                </svg>
                Upgrade Now — Subscribe to Go Live
              </Link>
            </>
          )}

        </div>
      ) : (
        <>
          {currentStep == 1 && (
            <ConsignorSelect
              step2Handler={handleSaveUrl}
              handleBackStep={handleBackStep}
            />
          )}
          {currentStep === 2 && (
            <FirstStep
              handleSaveUrl={handleSaveUrl}
              handleBackStep={handleBackStep}
            />
          )}
          {currentStep === 3 && (
            <SecondStep
              handleBackStep={handleBackStep}
              user={user}
              productCount={count}
              handleAddMoreProducts={handleAddMoreProducts}
              addonPurchase={addonPurchase}
              isDemo={isDemo}
            />
          )}
        </>
      )}
    </div>
  );
};

export default Main;
