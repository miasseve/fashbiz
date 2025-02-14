"use client";
import React, { useState } from "react";
import { CardElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { Button } from "@heroui/button";

const CheckoutForm = ({ user }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");
  const productTotal = useSelector((state) => state.cart.total);

  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
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
      body: JSON.stringify({
        payment_method: paymentMethod.id,
        total: productTotal,
        userId: user.id,
      }),
    });
    if (res.status == 400) {
      setError(
        "Something went wrong! Please check store owner account is connected to stripe"
      );
      setIsProcessing(false);
    } else {
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
    }
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
      {error && <p style={{ color: "red" }}>{error}</p>}
    </form>
  );
};

export default CheckoutForm;
