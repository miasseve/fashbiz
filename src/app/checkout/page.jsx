"use client";
import React, { useEffect } from "react";
import axios from "axios";
import { Button } from "@heroui/react";
import Link from "next/link";
import DeliveryDetials from "./DeliveryDetials";
import { set } from "mongoose";
const Page = () => {
  const [products, setProducts] = React.useState([]);
  const [total, setTotal] = React.useState(0);
  const [subTotal, setSubTotal] = React.useState(0);
  const [discount, setDiscount] = React.useState(0);
  useEffect(() => {
    // Function to send the GET request using axios
    const fetchCheckoutData = async () => {
      try {
        // Send the GET request to /api/checkout
        const response = await axios.get("/api/checkout");
        console.log("response", response);
        // Handle the response data
        console.log("Checkout data:", response.data.products);
        setTotal(response.data.total.formattedAmount);
        setSubTotal(response.data.subtotal.formattedAmount);
        setDiscount(response.data.discount.formattedAmount);
        setProducts(response.data.products);
        // You can store the data in state or handle it here
      } catch (error) {
        console.error("Error fetching checkout data:", error);
      }
    };

    // Call the function to fetch checkout data when the component mounts
    fetchCheckoutData();
  }, []); // Empty dependency array means it runs only once, on component mount

  return (
    <div>
      <p>Checkout</p>
      <div>
        Order Summary
        <Link href="https://www.le-stores.com/cart-page">Edit Cart</Link>
        {products.length > 0 ? (
          <>
            <ul>
              {products.map((product, index) => (
                <li
                  key={index}
                  className="flex border border-gray-300 p-4 mb-4 rounded-lg bg-[#f4f4f4] flex items-center justify-between"
                >
                  <div className="flex-shrink-0 w-24 mr-4 flex items-center justify-start w-[50%] sm:w-[30%]">
                    <img
                      src={product.images[0].url}
                      alt={product.title}
                      className="w-[70px]  h-[70px] rounded-md"
                    />
                    <h3 className="font-medium mb-2 ml-4">{product.title}</h3>
                  </div>

                  <span className=" w-[30%]">€{product.price}</span>
                </li>
              ))}
            </ul>
            <div></div>
          </>
        ) : (
          <p className="text-gray-600">Your cart is empty.</p>
        )}
        <p>Subtotal: {subTotal}</p>
        <p>Delivery:{discount}</p>
        <p>Total: {total}</p>
      </div>
      <DeliveryDetials />
    </div>
  );
};

export default Page;
