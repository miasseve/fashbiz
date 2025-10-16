"use client";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import { removeProductFromCart } from "@/features/cartSlice";
import BuyNow from "./BuyNow";
import Link from "next/link";
import { Button } from "@heroui/button";
import { ArrowLeft } from "lucide-react"; 

const CartItems = ({ storeUser }) => {
  const products = useSelector((state) => state.cart.products);
  const productTotal = useSelector((state) => state.cart.total);
  const [cartProducts, setCartProducts] = useState([]);
  const router=useRouter();
  const dispatch = useDispatch();

  useEffect(() => {
    const groupedProducts = products.reduce((acc, product) => {
      const { consignorName, price, consignorAccount } = product;
      const key = consignorName || "Store Owner";

      if (!acc[key]) {
        acc[key] = {
          products: [],
          total: 0,
          consignorAccount: consignorName ? consignorAccount : "",
        };
      }

      acc[key].products.push(product);
      acc[key].total += price;

      return acc;
    }, {});

    setCartProducts(groupedProducts);
  }, [productTotal]);

  const handleRemove = (product) => {
    dispatch(removeProductFromCart(product));
    setCartProducts((prev) => {
      const updatedCart = { ...prev };
      const { products: consignorProducts } =
        updatedCart[product?.consignorName || "Store Owner"];
      if (consignorProducts) {
        const filteredProducts = consignorProducts.filter(
          (item) => item._id !== product._id
        );
        if (filteredProducts.length === 0) {
          delete updatedCart[product?.consignorName || "Store Owner"];
        } else {
          updatedCart[product?.consignorName || "Store Owner"].products =
            filteredProducts;
        }
        return updatedCart;
      }
    });
  };

  // Calculate grand total for all consignors
  const grandTotal = Object.values(cartProducts).reduce(
    (total, consignor) => total + consignor.total,
    0
  );

  return (
    <div className="bg-fash-gradient mx-auto p-4 max-w-[100%] min-h-screen">
      <div className="bg-white rounded-lg p-4 sm:p-10 sm:max-w-[80%] m-auto">
          <div className="mb-4">
          <Button
            onPress={() => router.push("/dashboard/store")}
            variant="light"
            className="flex items-center gap-2 text-gray-700 hover:text-black"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Store
          </Button>
        </div>
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
                        className="flex items-center border border-gray-300 p-4 mb-4 rounded-lg bg-[#f4f4f4] items-center justify-between"
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

                        <div className="sm:mt-4">
                          <Button
                            onPress={() => handleRemove(product)}
                            className="danger-btn"
                          >
                            Remove
                          </Button>
                        </div>
                      </li>
                    ))}
                  </ul>
                  <div className="text-right">
                    <p className="text-lg font-semibold">Subtotal: €{total}</p>
                  </div>
                </div>
              );
            })}

            {/* Single payment section at the bottom */}
            <div className="mt-8 pt-6 border-t-2 border-gray-200">
              <div className="text-center mb-6">
                <p className="text-3xl font-bold text-gray-800">
                  Grand Total: €{grandTotal}
                </p>
              </div>
              <BuyNow
                storeUser={storeUser}
                allConsignorProducts={cartProducts}
                grandTotal={grandTotal}
              />
            </div>
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
