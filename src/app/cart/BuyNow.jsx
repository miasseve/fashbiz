"use client";

import React, { useState } from "react";
import getStripe from "./getStripe";
import { Elements } from "@stripe/react-stripe-js";
import CheckoutForm from "@/app/cart/CheckoutForm";

const BuyNow = ({ user }) => {
  const stripePromise = getStripe();

  return (
    <div className="w-[400px] ml-auto">
      <Elements stripe={stripePromise}>
        <CheckoutForm user={user} />
      </Elements>
    </div>
  );
};

export default BuyNow;
