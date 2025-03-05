import { getUserProducts } from "@/actions/productActions";
import React from "react";
import ProductItem from "./ProductItem";
export const dynamic = "force-dynamic";
const ProductStore = async () => {
  const response = await getUserProducts();

  if (response.status != 200) {
    throw new Error("Failed to fetch products");
  }
  const products = JSON.parse(response.products);
  return (
    <>
      <div className="grid lg:grid-cols-3  grid-cols-1 lg:gap-[17px] gap-[20px] lg:p-[10px] pl-[20px] pr-[20px]">
        {products.length > 0 ? (
          products.map((product, index) => (
            <div key={index} className="">
              <ProductItem product={product} />
            </div>
          ))
        ) : (
          <p className="text-gray-600 w-full">No products found.</p>
        )}
      </div>
    </>
  );
};

export default ProductStore;
