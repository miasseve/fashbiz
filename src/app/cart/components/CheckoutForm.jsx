"use client";
import React, { useState } from "react";
import { CardElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { useDispatch } from "react-redux";
import { Button } from "@heroui/button";
import {
  deleteProductsFromWix,
  soldProductsByIds,
} from "@/actions/productActions";
import { removeMultipleProductsFromCart } from "@/features/cartSlice";
import { toast } from "react-toastify";

const CheckoutForm = ({ storeUser, allConsignorProducts, grandTotal }) => {
  const dispatch = useDispatch();
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Validate required fields
    if (!customerName.trim()) {
      setError("Customer name is required.");
      return;
    }

    if (!customerEmail.trim()) {
      setError("Customer email is required.");
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(customerEmail)) {
      setError("Please enter a valid email address.");
      return;
    }

    if (!stripe || !elements) return;
    setIsProcessing(true);

    const { error, paymentMethod } = await stripe.createPaymentMethod({
      type: "card",
      card: elements.getElement(CardElement),
      billing_details: {
        name: customerName,
        email: customerEmail,
      },
    });

    if (error) {
      setError("Invalid card details.");
      setIsProcessing(false);
      return;
    }

    try {
      // Process payments for all consignors sequentially
      const consignorNames = Object.keys(allConsignorProducts);
      const allProductIds = [];
      const allProducts = [];
      let customerId = null; // Track customer ID for reusing payment method

      for (let i = 0; i < consignorNames.length; i++) {
        const consignorName = consignorNames[i];
        const consignorData = allConsignorProducts[consignorName];

        // Collect product IDs and products for cleanup later
        const productIds = consignorData.products.map((product) => product._id);
        allProductIds.push(...productIds);
        allProducts.push(...consignorData.products);

        // Make payment for this consignor
        const res = await fetch("/api/payment-intent", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            payment_method: paymentMethod.id,
            userId: storeUser.id,
            userName: storeUser.name,
            userEmail: storeUser.email,
            customerName: customerName,
            customerEmail: customerEmail,
            groupedProducts: consignorData,
            customerId: customerId, // Pass customer ID for subsequent payments
          }),
        });

        const data = await res.json();

        if (data?.error) {
          setIsProcessing(false);
          toast.error(`Payment failed for ${consignorName}: ${data.error}`);
          return;
        }

        // Store customer ID from first successful response for subsequent payments
        if (data.customer_id && !customerId) {
          customerId = data.customer_id;
        }

        if (data?.requires_action) {
          const { error: confirmError, paymentIntent } =
            await stripe.confirmCardPayment(data.client_secret, {
              payment_method: {
                card: elements.getElement(CardElement),
                billing_details: {
                  name: customerName,
                  email: customerEmail,
                },
              },
            });

          if (confirmError) {
            setIsProcessing(false);
            toast.error(
              `Payment confirmation failed for ${consignorName}: ${confirmError.message}`
            );
            return;
          } else if (paymentIntent.status !== "succeeded") {
            setIsProcessing(false);
            toast.error(`Payment not completed for ${consignorName}`);
            return;
          }
        }

        // Show progress
        if (consignorNames.length > 1) {
          toast.info(
            `Payment ${i + 1} of ${
              consignorNames.length
            } completed for ${consignorName}`
          );
        }
      }

      // All payments succeeded - clean up cart and products
      try {
        await deleteProductsFromWix(allProducts);
        await soldProductsByIds(allProductIds);
        dispatch(removeMultipleProductsFromCart(allProductIds));
        toast.success(
          `All payments completed successfully! Total: €${grandTotal}`
        );
      } catch (cleanupError) {
        console.error("Cleanup error:", cleanupError);
        toast.warning(
          "Payments completed but there was an issue updating inventory"
        );
      }
    } catch (error) {
      setIsProcessing(false);
      toast.error(`Payment processing error: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const cardElementOptions = {
    style: {
      base: {
        fontSize: "16px",
        color: "#424770",
        "::placeholder": {
          color: "#aab7c4",
        },
      },
    },
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Customer Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Customer Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter customer name"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Customer Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter customer email"
              required
            />
          </div>
        </div>

        {/* Card Details */}
        <div className="p-4 border border-gray-300 rounded-lg bg-gray-50">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Card Details <span className="text-red-500">*</span>
          </label>
          <CardElement options={cardElementOptions} />
        </div>

        <div className="text-center">
          <Button
            type="submit"
            className="auth-btn w-full py-3 text-lg"
            disabled={isProcessing || !stripe}
          >
            {isProcessing ? "Processing Payment..." : `Pay €${grandTotal} Now`}
          </Button>
        </div>

        {error && (
          <div className="text-red-600 text-center mt-2">
            <p>{error}</p>
          </div>
        )}

        {isProcessing && (
          <div className="text-center mt-2">
            <p className="text-sm text-gray-600">
              Processing payments for {Object.keys(allConsignorProducts).length}{" "}
              seller(s)...
            </p>
          </div>
        )}
      </form>
    </>
  );
};

export default CheckoutForm;
