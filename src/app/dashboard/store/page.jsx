import { getUserProducts } from "@/actions/productActions";
import React from "react";
import ProductList from "./ProductList";
export const dynamic = "force-dynamic";
const ProductStore = async () => {
  const response = await getUserProducts();

  if (response.status != 200) {
    throw new Error("Failed to fetch products");
  }
  
  const products = JSON.parse(response.products);

  return (
    <>
      <div className="">
           <ProductList products={products} />
      </div>
    </>
  );
};

export default ProductStore;
