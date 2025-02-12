"use client";
import React, { useState } from "react";
import { CardElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { useRouter } from "next/navigation";
import { Button } from "@heroui/button";

const CheckoutForm = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return; 

    setIsProcessing(true);

    const { error, paymentMethod } = await stripe.createPaymentMethod({
      type: "card",
      card: elements.getElement(CardElement),
    });

    if (error) {
      setIsProcessing(false);
      return;
    }

    // Make a request to the backend to create a payment intent or session
    const res = await fetch("/api/payment-intent", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ payment_method: paymentMethod.id }),
    });

    const paymentIntent = await res.json();
    const { client_secret } = paymentIntent;

    // Confirm the payment
    const { error: confirmError } = await stripe.confirmCardPayment(
      client_secret,
      {
        payment_method: paymentMethod.id,
      }
    );

    if (confirmError) {
      console.error(confirmError);
      setIsProcessing(false);
      return;
    }

    // Payment was successful
    router.push("/thankyou");
  };

  return (
    <form onSubmit={handleSubmit} className="text-right">
      <CardElement />
      <Button
        color="primary"
        type="submit"
        className="bg-[#0c0907] text-white py-6 px-6 rounded-lg text-lg mt-4"
        disabled={isProcessing}
      >
        {isProcessing ? "Processing..." : "Pay Now"}
      </Button>
    </form>
  );
};

export default CheckoutForm;
