import { getUserProducts } from "@/actions/productActions";
import React from "react";
import ProductList from "./ProductList";
export const dynamic = "force-dynamic";

export const metadata = {
  title: 'Store',
}

const ProductStore = async () => {
  
  const response = await getUserProducts();

  if (response.status != 200) {
    throw new Error("Failed to fetch products");
  }
  
  const products = JSON.parse(response.products);
  if(products.length==0)
    {
      return <div>No products found</div>
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
