"use client";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import React, { useState } from "react";
import axios from "axios";

import { useForm } from "react-hook-form";
const AccountForm = () => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    mode: "onTouched",
  });

  const onSubmit = async (data) => {
    console.log(data, "ss"); // You can log or handle form data here

    try {
      const response = await axios.post("/api/stripe", {
        account: data.account, // Assume accountId is a field in the form
      });
      console.log("API Response:", response.data); // Log or handle the API response
      if (response.data.url) {
        window.location.href = response.data.url; // This will redirect the user to the Stripe onboarding page
      } else {
        console.error("No URL received in the response");
      }
    } catch (error) {
      console.error("API Error:", error.message); // Handle the error
    }
  };

  const [loading, setLoading] = useState(false);

  const handleStripeOnboarding = async () => {
    setLoading(true); // Set loading state while the request is being made

    // Make the API call to your backend to create the Stripe account
    try {
      const response = await axios.get("/api/stripe");
      console.log("API Response:", response.data); // Log or handle the API response
      if (response.data.url) {
        window.location.href = response.data.url; // This will redirect the user to the Stripe onboarding page
      } else {
        console.error("No URL received in the response");
      }
    } catch (error) {
      console.error("API request failed:", error);
    } finally {
      setLoading(false); // Reset loading state
    }
  };

  return (
    <div>
      <Button onPress={handleStripeOnboarding} disabled={loading}>
        {loading ? "Loading..." : "Connect Stripe Account"}
      </Button>
      {/* <form className="w-full mb-8" onSubmit={handleSubmit(onSubmit)}>
                <div className="mb-8">
                  <Input
                    placeholder="Enter Your Stripe Account ID"
                    type="text"
                    size="lg"
                    {...register("account", {
                      required: "Account ID is required",
                    })}
                  />
                  {errors.account && (
                    <span style={{ color: "red", fontSize: "12px" }}>
                      {errors.account.message}
                    </span>
                  )}
                </div>
                <div className="mb-4 bg">
                  <Button
                    isLoading={isSubmitting}
                    color="primary"
                    type="submit"
                    className="bg-[#0c0907] text-white py-6 px-6 rounded-lg text-lg"
                  >
                    Verify
                  </Button>
                </div>
                </form> */}
    </div>
  );
};

export default AccountForm;
