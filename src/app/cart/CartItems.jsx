"use client";
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { removeProductFromCart } from "@/features/cartSlice";
import BuyNow from "./BuyNow";

const CartItems = () => {
  const products = useSelector((state) => state.cart.products);
  const productTotal = useSelector((state) => state.cart.total);
  
  const dispatch = useDispatch(); // Initialize the dispatch function

  // Function to handle removing a product from the cart
  const handleRemove = (product) => {
    dispatch(removeProductFromCart(product)); // Dispatch the remove action with the product to remove
  };

  return (
    <div className="mx-auto p-4 my-[30px] max-w-[100%] sm:max-w-[80%] m-auto">
      <h2 className="text-[30px] font-semibold mb-4 text-center">Shopping Cart</h2>
      {products.length > 0 ? (
        <>
        <ul>
          {products.map((product,index) => (
            <li
              key={index}
              className="flex border border-gray-300 p-4 mb-4 rounded-lg bg-white flex items-center justify-between"
            >
              {/* Image Section */}
              <div className="flex-shrink-0 w-24 mr-4 flex items-center justify-start w-[50%] sm:w-[30%]">
                <img
                  src={product.images[0].url}
                  alt={product.title}
                  className="w-[70px]  h-[70px] rounded-md"
                />
                 <h3 className="text-lg font-medium mb-2 ml-4">{product.title}</h3>
              </div>

             
              <span className="text-xl font-semibold w-[30%]">${product.price}</span>

              {/* Product Details */}
              <div className="">
                
              
                <div className="mt-4">
                  <button
                    onClick={() => handleRemove(product)}
                    className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 focus:outline-none"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
        <BuyNow/>
        </>
      ) : (
        <p className="text-gray-600">Your cart is empty.</p>
      )}
    </div>
  );
};

export default CartItems;
