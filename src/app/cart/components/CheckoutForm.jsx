"use client";
import React, { useState } from "react";
import { CardElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import { Button } from "@heroui/button";
import {
  deleteProductsFromWix,
  soldProductsByIds,
} from "@/actions/productActions";
import { removeMultipleProductsFromCart } from "@/features/cartSlice";
import { toast } from "react-toastify";

const CheckoutForm = ({ user, consignorProducts }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");
  const dispatch = useDispatch();
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
      setError("Invalid card details.");
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
        userId: user.id,
        userName: user.name,
        userEmail: user.email,
        groupedProducts: consignorProducts,
      }),
    });
    const data = await res.json();

    if (data.error) {
      toast.error(`Payment failed: ${data.error}`);
      return;
    }

    if (data.requires_action) {
      const { error: confirmError, paymentIntent } =
        await stripe.confirmCardPayment(data.client_secret);

      if (confirmError) {
        toast.error("Payment confirmation failed: " + confirmError.message);
      } else if (paymentIntent.status === "succeeded") {
        const productIds = consignorProducts.products.map(
          (product) => product._id
        );
        await deleteProductsFromWix(consignorProducts.products);
        await soldProductsByIds(productIds);
        toast.success("Payment succeeded!");
        dispatch(removeMultipleProductsFromCart(productIds));
        // router.push("/thankyou");
      }
    } else {
      const productIds = consignorProducts.products.map(
        (product) => product._id
      );
      await deleteProductsFromWix(consignorProducts.products);
      await soldProductsByIds(productIds);
      toast.success("Payment succeeded!");
      dispatch(removeMultipleProductsFromCart(productIds));
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="text-right mt-[30px] mt-[20px]">
        <CardElement />
        <Button
          type="submit"
          className="auth-btn ml-auto mt-8"
          disabled={isProcessing}
        >
          {isProcessing ? "Processing..." : "Pay Now"}
        </Button>
        {error && <p style={{ color: "red" }}>{error}</p>}
      </form>
    </>
  );
};

export default CheckoutForm;
