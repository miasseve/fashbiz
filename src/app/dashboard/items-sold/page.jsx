import { getUserProductsSold } from "@/actions/productActions";
import React from "react";
import SoldTable from "./SoldTable";

export const dynamic = "force-dynamic";
const page = async () => {
  // const products=[];
  const response = await getUserProductsSold();

  if (response.status != 200) {
    throw new Error(response.error || "Failed to fetch products");
  }
  const products = JSON.parse(response.products);

  // Check if products is a valid array and not empty
  if (!Array.isArray(products) || products.length === 0) {
    return <div>No sold products found.</div>;
  }

  return (
    <div>
      <SoldTable products={products} />
    </div>
  );
};

export default page;
