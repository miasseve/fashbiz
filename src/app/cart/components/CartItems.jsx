"use client";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { removeProductFromCart } from "@/features/cartSlice";
import BuyNow from "./BuyNow";
import Link from "next/link";
import { Button } from "@heroui/button";

const CartItems = ({ user }) => {
  const products = useSelector((state) => state.cart.products);
  const productTotal = useSelector((state) => state.cart.total);
  const [cartProducts, setCartProducts] = useState([]);
  const dispatch = useDispatch();

  useEffect(() => {
    const groupedProducts = products.reduce((acc, product) => {
      const { consignorName, price, consignorAccount } = product;
      if (!consignorName) return acc;
      if (!acc[consignorName]) {
        acc[consignorName] = {
          products: [],
          total: 0,
          consignorAccount: consignorAccount,
        };
      }

      acc[consignorName].products.push(product);
      acc[consignorName].total += price;
      return acc;
    }, {});

    setCartProducts(groupedProducts);
  }, [productTotal]);

  const handleRemove = (product) => {
    dispatch(removeProductFromCart(product));
    setCartProducts((prev) => {
      const updatedCart = { ...prev };
      const { products: consignorProducts } =
        updatedCart[product.consignorName];
      if (consignorProducts) {
        const filteredProducts = consignorProducts.filter(
          (item) => item._id !== product._id
        );
        if (filteredProducts.length === 0) {
          delete updatedCart[product.consignorName];
        } else {
          updatedCart[product.consignorName].products = filteredProducts;
        }
        return updatedCart;
      }
    });
  };

  return (
    <div className="mx-auto p-4 max-w-[100%] sm:max-w-[80%] min-h-screen">
      <div className="bg-white rounded-lg  p-10">
        <h2 className="text-[30px] font-semibold mb-4 text-center">
          Shopping Cart
        </h2>

        {Object.keys(cartProducts).length > 0 ? (
          <>
            {Object.keys(cartProducts).map((consignorName) => {
              const { products: consignorProducts, total } =
                cartProducts[consignorName];

              return (
                <div key={consignorName} className="mb-6">
                  <h3 className="text-2xl font-semibold mb-2">
                    Seller: {consignorName}
                  </h3>

                  <ul>
                    {consignorProducts.map((product, index) => (
                      <li
                        key={index}
                        className="flex border border-gray-300 p-4 mb-4 rounded-lg bg-[#f4f4f4] items-center justify-between"
                      >
                        <div className="flex-shrink-0 mr-4 flex items-center w-[50%] sm:w-[30%]">
                          <img
                            src={product.images[0].url}
                            alt={product.title}
                            className="w-[40px] sm:w-[70px] h-[40px] sm:h-[70px] rounded-md"
                          />
                          <h3 className="text-[1.5rem] mb-2 ml-4">
                            {product.title}
                          </h3>
                        </div>

                        <span className="w-[30%]">€{product.price}</span>

                        <div className="mt-4">
                          <Button
                            onPress={() => handleRemove(product)}
                            color="danger"
                            className="text-white px-4 py-2 rounded-md focus:outline-none"
                          >
                            Remove
                          </Button>
                        </div>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-6 text-center">
                    <p className="text-2xl font-semibold mb-4 sm:mb-0">
                      Total: €{total}
                    </p>
                    <BuyNow
                      user={user}
                      consignorProducts={cartProducts[consignorName]}
                    />
                  </div>
                </div>
              );
            })}
          </>
        ) : (
          <>
            <div className="flex flex-col items-center justify-center">
              <p className="text-gray-600 text-center mb-4">
                Your cart is empty.
              </p>
              <Link href="/dashboard/store">
                <Button
                  color="primary"
                  className="bg-[#0c0907] text-white py-6 px-6 rounded-lg text-lg"
                >
                  Go to Dashboard
                </Button>
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CartItems;
