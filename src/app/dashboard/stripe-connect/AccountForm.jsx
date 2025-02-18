"use client";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import React, { useState } from "react";
import axios from "axios";
import { storeAccountId } from "@/actions/accountAction";

import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
const AccountForm = ({ accountId }) => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    mode: "onTouched",
    defaultValues: {
      account: accountId || "",
    },
  });

  const onSubmit = async (data) => {
    try {
      const res = await storeAccountId(data);
      if (res.status === 200) {
        toast.success(res.message);
      } else {
        toast.error(res.message);
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
            Save
          </Button>
        </div>
      </form> */}
      <div className="p-4 flex flex-col gap-[12px]">
        <p>Stripe Connect</p>
        <Button
          onPress={handleStripeOnboarding}
          color="success"
          disabled={loading}
          className="text-white lg:w-[25%]"
        >
          {loading ? "Loading..." : "Connect with Stripe"}
        </Button>
      </div>
    </div>
  );
};

export default AccountForm;
