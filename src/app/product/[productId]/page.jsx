import React from "react";
import { getProductById } from "@/actions/productActions";
import ImageCarousel from "../components/ImageCarousel";
import AddToCart from "./AddToCart";
import { redirect } from "next/navigation";
import BackButton from "./BackButton";
const ProductPage = async ({ params }) => {
  const { productId } = await params;
  const response = await getProductById(productId);

  if (response.status !== 200) {
    redirect("/");
  }

  const { product } = response.data;

  const parsedProduct = JSON.parse(product);

  if (!parsedProduct) {
    return <p>Product not found</p>;
  }

  return (
    
    <div className="bg-fash-gradient  flex sm:flex-col lg:flex-row gap-8 w-full lg:gap-16 p-6 lg:p-12 m-auto item-center">
      <div className="w-full sm:w-[80%] m-auto sm:flex ">
      <div className="lg:w-1/2 flex flex-col items-center border border-[#ccc] p-4 max-h-max">
        <ImageCarousel images={parsedProduct.images} />
      </div>

      <div className="w-full lg:w-1/2 flex flex-col gap-4 sm:pl-10 mt-6 sm:mt-0">
        <h1 className="text-3xl font-bold">{parsedProduct.title}</h1>
        <ul className="space-y-2 text-gray-600">
          <li>
            <strong>Brand:</strong> {parsedProduct.brand}
          </li>
          <li>
            <strong>Price:</strong> €{parsedProduct.price}
          </li>
        </ul>
        <p className="text-gray-800">{parsedProduct.description}</p>
        <AddToCart product={parsedProduct} /> 
        <BackButton />
      </div>
    </div>
    </div>
  );
};

export default ProductPage;
