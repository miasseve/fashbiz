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
        <p className="text-gray-600">
          Connect your account to Stripe for easy and secure payment processing.
        </p>
        <Button
          onPress={handleStripeOnboarding}
          disabled={loading}
          className="success-btn w-auto max-w-max"
        >
          {loading ? "Loading" : "Connect with Stripe"}
        </Button>
        {error && <p className="text-red-500">{error}</p>}
      </div>
    </div>
  );
};

export default StripeConnect;
