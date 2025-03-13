"use client";

import React from "react";
import getStripe from "./getStripe";
import { Elements } from "@stripe/react-stripe-js";
import CheckoutForm from "@/app/cart/components/CheckoutForm";

const BuyNow = ({ user }) => {
  const stripePromise = getStripe();

  return (
    <div className="w-[300px] ml-auto">
      <Elements stripe={stripePromise}>
        <CheckoutForm user={user} />
      </Elements>
    </div>
  );
};

export default BuyNow;
