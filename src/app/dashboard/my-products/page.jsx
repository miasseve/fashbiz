import { getProductsByEmail } from "@/actions/productActions";
import { auth } from "@/auth";
import React from "react";
import { redirect } from "next/navigation";
import ProductTable from "./ProductTable";

const page = async () => {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  const response = await getProductsByEmail(session.user.email);
  if (response.status != 200) {
    redirect("/login");
  }

  const products = JSON.parse(response.products);
  if(products.length==0)
  {
    return <div>No products found</div>
  }
  return (
    <div>
      <ProductTable products={products} />
    </div>
  );
};

export default page;
