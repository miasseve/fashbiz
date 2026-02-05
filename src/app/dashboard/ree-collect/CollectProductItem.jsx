"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, Button, user } from "@heroui/react";
import { MdDelete, MdModeEdit } from "react-icons/md";
import { deleteProductById } from "@/actions/productActions";
import { Dot } from "lucide-react";
import { toast } from "react-toastify";
import { FaEye } from "react-icons/fa";

const CollectProductItem = ({ product, isGrid, userRole }) => {
  const router = useRouter();
  const [isHovered, setIsHovered] = useState(false);

  const handleEdit = async (productId) => {
    router.push(`/dashboard/product/${productId}`);
  };

  const handleDelete = async (productId) => {
    try {
      const response = await deleteProductById(productId);
      if (response.status === 200) {
        toast.success(response.message || "Product deleted successfully");
      } else {
        toast.error(response.error || "Failed to delete product");
      }
      router.refresh();
    } catch (err) {
      console.error("Error deleting product:", err);
      toast.error("An error occurred while deleting the product");
      router.refresh();
    }
  };

  return (
    <>
      {isGrid ? (
        <div
          className="relative group"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <Card className="p-[10px] h-full w-full max-w-full md:max-w-md lg:max-w-lg border-none rounded-xl shadow-[0_1px_2px_rgba(0,0,0,0.2)]">
            {product.images.length > 0 && (
              <div className="overflow-hidden rounded-lg">
                <img
                  src={product.images[0].url}
                  alt={product.title}
                  className="w-full lg:h-[250px] mx-auto object-contain mb-4 rounded-lg 
                    transition-transform duration-300 ease-in-out group-hover:scale-110"
                />
              </div>
            )}

            <div className="relative bg-white rounded-2xl overflow-hidden">
              {/* Content */}
              <div className="p-6 pb-0">
                {/* Category / Brand */}
                <p className="text-pink-500 uppercase font-semibold text-[12px] flex items-center gap-2 mb-2">
                  {userRole === "store" ? (
                    <>
                      • Brand:{" "}
                      <span className="font-bold">{product.brand}</span>
                    </>
                  ) : (
                    <>
                      Store:{" "}
                      <span className="font-semibold text-gray-800">
                        {product?.userId?.storename}
                      </span>
                    </>
                  )}
                </p>

                {/* Product Title */}
                <h2 className="text-2xl font-semibold text-gray-800 mb-3">
                  I Don't Care T-Shirt
                </h2>
              </div>

              {/* Store / Brand */}

              <div className="flex justify-between items-center px-6">
                {/* Price */}
                <p className="text-[17px] sm:text-[16px] font-bold text-center">
                  {product.brandPrice} DKK
                </p>

                {/* Action Buttons */}
                <div className="bottom-4 right-4 flex gap-3">
                  <button
                    onClick={() => handleEdit(product._id)}
                    className="rounded-lg bg-white border border-[#d4d4d4] px-[6px] py-[4px] hover:bg-black hover:text-white transition-all duration-300"
                  >
                    {userRole === "store" ? (
                      <MdModeEdit size={21} />
                    ) : (
                      <FaEye size={21} />
                    )}
                  </button>

                  {userRole === "store" && (
                    <button
                      onClick={() => handleDelete(product._id)}
                      className="rounded-lg bg-white border border-[#d4d4d4] px-[6px] py-[4px] hover:bg-black hover:text-white transition-all duration-300"
                    >
                      <MdDelete size={21} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </Card>
        </div>
      ) : (
        // Line (List) view layout
        <div
          className="flex bg-white p-[10px] rounded-[8px] mb-6 group"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {/* Product Image */}
          {product.images.length > 0 && (
            <div className="overflow-hidden rounded-lg">
              <img
                src={product.images[0].url}
                alt={product.title}
                className="w-[15rem] h-[15rem] rounded-lg sm:me-[2rem] me-[1rem] object-contain
        transition-transform duration-300 ease-in-out group-hover:scale-110"
              />
            </div>
          )}

          {/* Right Content */}
          <div className="flex flex-col flex-1 justify-between">
            {/* Top Content */}
            <div className="sm:pt-3 pt-2">
              <p className="text-pink-500 uppercase font-semibold text-[12px] sm:text-[16px] flex items-center gap-2 mb-2">
                {userRole === "store" ? (
                  <>
                    • Brand: <span className="font-bold">{product.brand}</span>
                  </>
                ) : (
                  <>
                    Store:
                    <span className="font-semibold text-gray-800">
                      {product?.userId?.storename}
                    </span>
                  </>
                )}
              </p>

              <h2 className="text-2xl sm:text-4xl font-semibold text-gray-800 mb-3">
                I Don't Care T-Shirt
              </h2>
            </div>

            {/* Bottom Section */}
            <div className="flex justify-between items-center mt-4">
              {/* Price */}
              <p className="text-[17px] sm:text-[16px] font-bold">
                {product.brandPrice} DKK
              </p>

              {/* Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => handleEdit(product._id)}
                  className="rounded-lg bg-white border border-[#d4d4d4] px-[6px] py-[4px] 
          hover:bg-black hover:text-white transition-all duration-300"
                >
                  {userRole === "store" ? (
                    <MdModeEdit size={21} />
                  ) : (
                    <FaEye size={21} />
                  )}
                </button>

                {userRole === "store" && (
                  <button
                    onClick={() => handleDelete(product._id)}
                    className="rounded-lg bg-white border border-[#d4d4d4] px-[6px] py-[4px] 
            hover:bg-black hover:text-white transition-all duration-300"
                  >
                    <MdDelete size={21} />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CollectProductItem;
