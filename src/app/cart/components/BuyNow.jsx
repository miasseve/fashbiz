"use client";

import React from "react";
import getStripe from "./getStripe";
import { Elements } from "@stripe/react-stripe-js";
import CheckoutForm from "@/app/cart/components/CheckoutForm";

const BuyNow = ({ storeUser, allConsignorProducts, grandTotal }) => {
  const stripePromise = getStripe();

  return (
    <div className="max-w-[500px] mx-auto">
      <Elements stripe={stripePromise}>
        <CheckoutForm 
          storeUser={storeUser} 
          allConsignorProducts={allConsignorProducts}
          grandTotal={grandTotal}
        />
      </Elements>
    </div>
  );
};

export default BuyNow;