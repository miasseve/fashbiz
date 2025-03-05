"use client";
import React, { useState } from "react";
import { CardElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { useRouter } from "next/navigation";
import { useSelector, useDispatch } from "react-redux";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import {
  deleteProductsFromWix,
  soldProductsByIds,
} from "@/actions/productActions";
import { clearCart } from "@/features/cartSlice";


const CheckoutForm = ({ user }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");
  // const [customerName, setCustomerName] = useState("");
  // const [customerEmail, setCustomerEmail] = useState("");
  // const handleEmailChange = (e) => {
  //   setCustomerEmail(e.target.value); // Update state with the input value
  // };

  // const handleNameChange = (e) => {
  //   setCustomerName(e.target.value); // Update state with the input value
  // };

  const products = useSelector((state) => state.cart.products);
  const productTotal = useSelector((state) => state.cart.total);
  const dispatch = useDispatch();
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if(customerName=="" || customerEmail==""){
      setError("Please enter customer details");
      return  
    }
    
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
        product:products[0]
      }),
    });
    if (res.status == 400) {
      setError(
        "Something went wrong! Please check store owner account is connected to stripe"
      );
      setIsProcessing(false);
    } else {
   
        await soldProductsByIds(products);
        await deleteProductsFromWix(products);
        dispatch(clearCart());
        router.push("/thankyou");
      // }
    }
  };

  return (
    <>
     {/* <Input
      placeholder="Customer Name"
      type="text" // You can use 'email' type to trigger native email validation
      size="lg"
      value={customerName} // Bind the value of input to the state
      onChange={handleNameChange} // Update state on user input
   
    />
      <Input
      placeholder="Customer Email"
      type="email" // You can use 'email' type to trigger native email validation
      size="lg"
      value={customerEmail} // Bind the value of input to the state
      onChange={handleEmailChange} // Update state on user input
   
    /> */}
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
    </>
  );
};

export default CheckoutForm;
