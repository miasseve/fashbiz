import React from "react";
import { getProductById } from "@/actions/productActions";
import ImageCarousel from "../components/ImageCarousel";
import AddToCart from "./AddToCart";
import { redirect } from "next/navigation";

const ProductPage = async ({ params }) => {
  const { productId } = await params;
  const response = await getProductById(productId);

  if (response.status !== 200) {
    redirect("/");
  }
 
  const product = response.data ? JSON.parse(response.data) : null;

  if (!product) {
    return <p>Product not found</p>;
  }

  return (
    <div className="flex flex-col lg:flex-row gap-8 lg:gap-16  p-6 lg:p-12 m-auto w-[80%] h-[100vh] item-center">
      <div className="w-full lg:w-1/2 flex flex-col items-center">
        <ImageCarousel images={product.images} />
      </div>

      <div className="w-full lg:w-1/2 flex flex-col gap-4">
        <h1 className="text-3xl font-bold">{product.title}</h1>
        <ul className="space-y-2 text-gray-600">
          <li>
            <strong>Brand:</strong> {product.brand}
          </li>
          <li>
            <strong>Price:</strong> ${product.price}
          </li>
        </ul>
        <p className="text-gray-700">{product.description}</p>
        <AddToCart product={product} />
      </div>
    </div>
  );
};

export default ProductPage;
