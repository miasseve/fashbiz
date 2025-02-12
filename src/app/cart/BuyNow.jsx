"use client";

import React, { useState } from "react";
import getStripe from "./getStripe";
import { Elements } from "@stripe/react-stripe-js";
import CheckoutForm from "@/app/cart/CheckoutForm";

const BuyNow = () => {
  const stripePromise = getStripe();

  return (
    <div className="w-[400px] ml-auto">
        <Elements stripe={stripePromise}>
          <CheckoutForm />
        </Elements>
    </div>
  );
};

export default BuyNow;
