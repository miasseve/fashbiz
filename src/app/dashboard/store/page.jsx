
import { getUserProducts } from "@/actions/productActions";
import React from "react";

import ProductItem from "./ProductItem";
export const dynamic = 'force-dynamic';
const ProductStore = async () => {
  const products = await getUserProducts();
  const productData = JSON.parse(products);
  return (
    <>
      {/* <h1 className="text-3xl font-bold mb-6">Your Store</h1> */}
      <div className="grid lg:grid-cols-3  grid-cols-1 lg:gap-[17px] gap-[20px] lg:p-[10px] pl-[20px] pr-[20px]">
        {productData.length > 0 ? (
          productData.map((product,index) => (
           
          <div key={index} className="">
              <ProductItem product={product} /> 
              </div>
                        
          ))
        ) : (
          <p className="text-center text-gray-600 w-full">No products found.</p>
        )}
    </div>
    </>
  );
};

export default ProductStore;
