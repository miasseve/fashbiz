import React from "react";
import { getProductById } from "@/actions/productActions";
import ImageCarousel from "@/app/product/components/ImageCarousel";
import Link from "next/link";
import { redirect } from "next/navigation";
import DeleteButton from "./DeleteButton";
import EditButton from "./EditButton";
import AddToCart from "@/app/product/[productId]/AddToCart";
import CopyLinkButton from "./CopyLinkButton";
export const metadata = {
  title: "Product",
};

const Page = async ({ params }) => {
  const { productId } = await params;
  const response = await getProductById(productId);

  if (response.status !== 200) {
    redirect("/");
  }
  const { product, user } = response.data;

  const parsedProduct = JSON.parse(product);
  const parsedUser = JSON.parse(user);

  return (
    <div className="container mx-auto p-0 lg:p-12">
      <div className="flex flex-col sm:flex-row gap-0  lg:shadow-lg bg-[#fff] p-[20px] rounded-lg p-6 lg:p-10">
        <div className="w-full sm:w-1/2 flex justify-center">
          <ImageCarousel images={parsedProduct.images} />
        </div>

        <div className="w-full sm:w-1/2 flex flex-col gap-6 bg-white p-[20px] border-1 border-[#ccc] lg:shadow-none shadow-lg  p-[20px] bg-[#f6f6f6]">
          <h1 className="text-3xl lg:text-4xl font-bold text-gray-900">
            {parsedProduct.title}
          </h1>
          <ul className="space-y-2 text-gray-700">
            <li>
              <span className="font-semibold">Brand :</span>{" "}
              {parsedProduct.brand}
            </li>
            <li>
              <span className="font-semibold">Price :</span>{" "}
              <span className="font-semibold">€{parsedProduct.price}</span>
            </li>
            <li>
              <span className="font-semibold">Description :</span>{" "}
              {parsedProduct.description}
            </li>
          </ul>
          <p>

          </p>
          <AddToCart product={parsedProduct} />
          {/* <Link
            href={`/product/${parsedProduct._id}`}
            target="_blank"
            className="success-btn max-w-max"
          >
            View Product Details
          </Link> */}
          <DeleteButton product={parsedProduct} />
          <EditButton product={parsedProduct} />
          {/* <CopyLinkButton productId={parsedProduct._id} /> */}
          {parsedUser && (
            <div className="mt-6 bg-gray-100 rounded-lg shadow-sm p-4">
              <p className="text-gray-800 italic font-semibold">
                Consignor Details
              </p>
              <p className="text-gray-700 italic">
                <span className="font-semibold"> Name :</span>{" "}
                {parsedUser.firstname} {parsedUser.lastname}
              </p>
              <p className="text-gray-700 italic">
                {" "}
                <span className="font-semibold">Email : </span>
                {parsedUser.email}
              </p>
              <p className="text-gray-700 italic">
                <span className="font-semibold">Address : </span>
                {parsedUser.address}
              </p>
              <p className="text-gray-700 italic">
                <span className="font-semibold">Phone Number : </span>
                {parsedUser.phoneNumber}
              </p>
              <p className="text-gray-700 italic">
                <span className="font-semibold">City : </span>
                {parsedUser.city}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Page;
