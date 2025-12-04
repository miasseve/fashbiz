import { getUserProductsSold } from "@/actions/productActions";
import React from "react";
import SoldTable from "./SoldTable";
import { MdOutlineProductionQuantityLimits } from "react-icons/md";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Items Sold",
};

const page = async () => {
  // const products=[];
  const response = await getUserProductsSold();

  if (response.status != 200) {
    throw new Error(response.error || "Failed to fetch products");
  }
  const products = JSON.parse(response.products);

  // Check if products is a valid array and not empty
  if (!Array.isArray(products) || products.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg w-[50%] text-center">
          <MdOutlineProductionQuantityLimits
            className="mx-auto mb-4"
            size={48}
          />
          <h2 className="text-2xl font-bold mb-4">No sold products found.</h2>
          <p className="text-gray-700">
            There are no payment transactions for sold products available at the
            moment.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen">
      <SoldTable products={products} />
    </div>
  );
};

export default page;
