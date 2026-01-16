"use client";
import { Button } from "@heroui/button";
import React, { useState } from "react";
import axios from "axios";

const StripeConnect = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleStripeOnboarding = async () => {
    setLoading(true);

    try {
      const response = await axios.get("/api/stripe");
      if (response.status == 200) {
        window.location.href = response.data.url;
      } else {
        setError("Failed to initiate Stripe onboarding");
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="p-4 flex flex-col gap-[12px]">
        <p className="text-gray-600 text-center">
          Connect your account to Stripe for easy and secure payment processing.
        </p>
        <div className="flex justify-center">
          <Button
            onPress={handleStripeOnboarding}
            disabled={loading}
            className="
                relative
                w-auto max-w-max
                px-6 py-3
                text-white font-semibold
                rounded-lg
                bg-gradient-to-r from-green-500 to-emerald-500
                shadow-[0_8px_30px_rgba(34,197,94,0.6)]
                hover:shadow-[0_10px_40px_rgba(34,197,94,0.75)]
                transition-all duration-300
              "
          >
            <svg
              className="w-4 h-4 sm:w-5 sm:h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
            {loading ? "Loading..." : "Connect with Stripe"}
          </Button>
        </div>
        {error && <p className="text-red-500">{error}</p>}
      </div>
    </div>
  );
};

export default StripeConnect;
