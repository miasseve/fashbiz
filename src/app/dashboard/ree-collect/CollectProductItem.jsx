"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, Button, user } from "@heroui/react";
import { MdDelete, MdModeEdit } from "react-icons/md";
import { deleteProductById } from "@/actions/productActions";
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
          <Card className="p-[10px] h-full w-full max-w-sm md:max-w-md lg:max-w-lg border-none rounded-xl shadow-[0_1px_2px_rgba(0,0,0,0.2)]">
            {product.images.length > 0 && (
              <div className="overflow-hidden rounded-lg">
                <img
                  src={product.images[0].url}
                  alt={product.title}
                  className="w-full lg:h-[250px] mx-auto object-cover mb-4 rounded-lg 
                    transition-transform duration-300 ease-in-out group-hover:scale-110"
                />
              </div>
            )}

            <div className="p-8">
              <h2 className="text-[15px] font-semibold uppercase mb-[10px]">
                {product.title}
              </h2>
              <p className="text-pink-500 font-medium text-xl">
                {userRole === "store" ? (
                  <>
                    Brand: <span className="font-bold">{product.brand}</span>
                  </>
                ) : (
                  <>
                    Store:{" "}
                    <span className="font-bold">
                      {product?.userId?.storename}
                    </span>
                  </>
                )}
              </p>
              <p className="font-bold mt-2 text-2xl lg:text-md mb-[10px] flex items-center">
                <span>{product.brandPrice} DKK</span>
              </p>
            </div>
            {/* Action Buttons - List View */}
            <div
              className={`absolute bottom-4 right-4 flex gap-2 transition-opacity duration-200 opacity-100
                `}
            >
              {/* ${isHovered ? "opacity-100" : "opacity-0"} */}
              <button
                onClick={() => handleEdit(product._id)}
                className="text-gray-800 rounded-lg shadow-lg transition-all duration-200"
                aria-label="Edit product"
              >
                {userRole === "store" ? (
                  <MdModeEdit size={24} />
                ) : (
                  <FaEye size={24} title="Preview" />
                )}
              </button>
              {userRole === "store" && (
                <>
                  <button
                    onClick={() => handleDelete(product._id)}
                    className="text-gray-800 p-2 rounded-lg shadow-lg transition-all duration-200"
                    aria-label="Delete product"
                  >
                    <MdDelete size={24} />
                  </button>
                </>
              )}
            </div>
          </Card>
        </div>
      ) : (
        // Line (List) view layout
        <div
          className="relative flex items-center bg-[white] p-[10px] rounded-[8px] items-start mb-6 group"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {product.images.length > 0 && (
            <div className="overflow-hidden rounded-lg">
              <img
                src={product.images[0].url}
                alt={product.title}
                className="w-[15rem] h-[15rem] rounded-lg me-[2rem] object-cover 
                  transition-transform duration-300 ease-in-out group-hover:scale-110"
              />
            </div>
          )}

          <div className="flex gap-[15px] flex-col">
            <div className="flex-1 gap-3">
              <h2 className="text-[20px] font-semibold">{product.title}</h2>
              <p className="text-pink-500 font-medium text-xl">
                Brand: <span className="font-bold">{product.brand}</span>
              </p>
              <p className="font-bold text-md mt-1">
                {product.brandPrice.toFixed(2)} DKK
              </p>
            </div>
          </div>
          {/* Action Buttons - List View */}
          <div
            className={`absolute top-4 right-4 flex gap-2 transition-opacity duration-200 opacity-100
                `}
          >
            {/* ${isHovered ? "opacity-100" : "opacity-0"} */}
            <button
              onClick={() => handleEdit(product?._id)}
              className="text-gray-800 rounded-lg shadow-lg transition-all duration-200"
              aria-label="Edit product"
            >
              {userRole === "store" ? (
                <MdModeEdit size={20} />
              ) : (
                <FaEye size={20} title="Preview"/>
              )}
            </button>
            {userRole === "store" && (
              <button
                onClick={() => handleDelete(product?._id)}
                className="text-gray-800 p-2 rounded-lg shadow-lg transition-all duration-200"
                aria-label="Delete product"
              >
                <MdDelete size={20} />
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default CollectProductItem;
