import { getUserProducts } from "@/actions/productActions";
import React from "react";
import ProductList from "./ProductList";
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Store",
};

const ProductStore = async () => {
  const response = await getUserProducts();

  if (response.status != 200) {
    throw new Error("Failed to fetch products");
  }

  const products = JSON.parse(response.products);
  if (products.length == 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg w-[50%] text-center">
          <h2 className="text-2xl font-bold mb-4">No Products Found</h2>
          <p className="text-gray-700">Please add products to view them here</p>
        </div>
      </div>
    );
  }
  return (
    <>
      <div className="">
        <ProductList products={products} />
      </div>
    </>
  );
};

export default ProductStore;
