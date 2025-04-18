"use client";
import React from "react";
import { Button } from "@heroui/react";
import { useRouter } from "next/navigation";
import axios from "axios";

const StripeButton = ({ accountId }) => {
  const router = useRouter();

  const handleButton = async () => {
    try {
      const response = await axios.post("/api/stripe", { accountId });
      if (response.data.url) {
        window.location.href = response.data.url;
      }
    } catch (error) {
      console.error("Error during Stripe onboarding:", error);
    }
    router.push("/dashboard/stripe-connect");
  };

  return (
    <div className="flex flex-col gap-[12px] p-4">
      <p>
        Your account is connected with Stripe, but some details are still
        pending. Please complete them to enable payouts and accept payments.
      </p>
      <Button onPress={handleButton}  className="danger-btn w-auto max-w-max">
        Complete your Stripe details to enable payouts
      </Button>
    </div>
  );
};

export default StripeButton;
