"use client";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { removeProductFromCart } from "@/features/cartSlice";
import BuyNow from "./BuyNow";
import { Button } from "@heroui/button";

const CartItems = ({ user }) => {
  const products = useSelector((state) => state.cart.products);
  const productTotal = useSelector((state) => state.cart.total);
  const [cartProducts, setCartProducts] = useState([]);
  const [total, setTotal] = useState(0);
  const dispatch = useDispatch();

  useEffect(() => {
    setCartProducts(products);
    setTotal(productTotal);
  }, [productTotal]);

  const handleRemove = (product) => {
    dispatch(removeProductFromCart(product));
    setCartProducts((prev) => prev.filter((item) => item._id !== product._id));
  };

  return (
    <div className="mx-auto p-4  max-w-[100%] sm:max-w-[80%] m-auto h-screen">
      <h2 className="text-[30px] font-semibold mb-4 text-center">
        Shopping Cart
      </h2>
      {cartProducts.length > 0 ? (
        <>
          <ul>
            {cartProducts.map((product, index) => (
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
                  <h3 className="font-medium mb-2 ml-4">
                    {product.title}
                  </h3>
                </div>

                <span className=" w-[30%]">
                €{product.price}
                </span>

                <div className="">
                  <div className="mt-4">
                    <Button
                      onPress={() => handleRemove(product)}
                      color="danger"
                      className="text-white px-4 py-2 rounded-md focus:outline-none"
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
          <div>
            <p>Total : €{total}</p>
          </div>
          <BuyNow user={user} />
        </>
      ) : (
        <p className="text-gray-600">Your cart is empty.</p>
      )}
    </div>
  );
};

export default CartItems;
