import React from "react";
import { getProductById } from "@/actions/productActions";
import ImageCarousel from "@/app/product/components/ImageCarousel";
import Link from "next/link";
import { redirect } from "next/navigation";
import DeleteButton from "./DeleteButton";
import EditButton from "./EditButton";
import AddToCart from "@/app/product/[productId]/AddToCart";
import CopyLinkButton from "./CopyLinkButton";
import GenerateBarcode from "./GenerateBarcode";
import UnlinkProduct from "./UnlinkProduct";

export const metadata = {
  title: "Product",
};

const Page = async ({ params }) => {
  const { productId } = await params;
  const response = await getProductById(productId);

  if (response.status !== 200) {
    redirect("/");
  }

  const { product, user, userRole } = response.data;
  const parsedProduct = JSON.parse(product);
  const parsedUser = JSON.parse(user);

  return (
    <div className="container mx-auto p-0 lg:p-12">
      <div className="flex flex-col sm:flex-row gap-0 lg:shadow-lg bg-[#fff] p-[20px] rounded-lg p-6 lg:p-10">
        <div className="w-full sm:w-1/2 flex justify-center">
          <ImageCarousel images={parsedProduct.images} />
        </div>

        <div className="w-full sm:w-1/2 flex flex-col gap-6 bg-white p-[20px] border-1 border-[#ccc] lg:shadow-none shadow-lg p-[20px] bg-[#f6f6f6] sm:mt-[0px] mt-[120px]">
          {/* Title and Price Section */}
          <div className="space-y-3">
            <h1 className="text-3xl lg:text-4xl font-bold text-gray-900">
              {parsedProduct.title}
            </h1>
            {parsedProduct.collect !== true && !parsedProduct.pointsValue && (
              <div className="inline-block bg-gradient-to-r from-red-600 to-pink-600 text-white px-5 py-2 rounded-lg font-bold text-2xl shadow-md">
                Price: €{parsedProduct.price}
              </div>
            )}
            {parsedProduct.collect === true && !parsedProduct.pointsValue && (
              <div className="inline-block bg-gradient-to-r from-red-600 to-pink-600 text-white px-5 py-2 rounded-lg font-bold text-2xl shadow-md">
                Brand Price: {parsedProduct.brandPrice} DKK
              </div>
            )}
            {parsedProduct.collect !== true && parsedProduct.pointsValue && (
              <div className="inline-block bg-gradient-to-r from-red-600 to-pink-600 text-white px-5 py-2 rounded-lg font-bold text-2xl shadow-md">
                Points: {parsedProduct.pointsValue}
              </div>
            )}
          </div>

          {/* Product Details Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 p-4 rounded-xl border-2 border-gray-200 hover:border-red-300 transition-all hover:-translate-y-0.5 hover:shadow-md">
              <div className="text-sm uppercase text-gray-500 font-semibold tracking-wide mb-1.5">
                Brand
              </div>
              <div className="text-xl text-gray-900 font-semibold">
                {parsedProduct.brand}
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-xl border-2 border-gray-200 hover:border-red-300 transition-all hover:-translate-y-0.5 hover:shadow-md">
              <div className="text-sm uppercase text-gray-500 font-semibold tracking-wide mb-1.5">
                Color
              </div>
              <div className="text-xl text-gray-900 font-semibold">
                {parsedProduct.color?.name || "N/A"}
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-xl border-2 border-gray-200 hover:border-red-300 transition-all hover:-translate-y-0.5 hover:shadow-md">
              <div className="text-sm uppercase text-gray-500 font-semibold tracking-wide mb-1.5">
                Sub Category
              </div>
              <div className="text-xl text-gray-900 font-semibold">
                {parsedProduct.subcategory}
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-xl border-2 border-gray-200 hover:border-red-300 transition-all hover:-translate-y-0.5 hover:shadow-md">
              <div className="text-sm uppercase text-gray-500 font-semibold tracking-wide mb-1.5">
                Size
              </div>
              <div className="text-xl text-gray-900 font-semibold break-words">
                {parsedProduct.size?.length
                  ? parsedProduct.size.join(", ")
                  : "N/A"}
              </div>
            </div>

            {parsedProduct.fabric && (
              <div className="bg-gray-50 p-4 rounded-xl border-2 border-gray-200 hover:border-red-300 transition-all hover:-translate-y-0.5 hover:shadow-md col-span-2">
                <div className="text-sm uppercase text-gray-500 font-semibold tracking-wide mb-1.5">
                  Fabric
                </div>
                <div className="text-xl text-gray-900 font-semibold">
                  {parsedProduct.fabric}
                </div>
              </div>
            )}
          </div>

          {/* Description Section */}
          {parsedProduct.description && (
            <div className="bg-gray-50 p-5 rounded-xl border-2 border-gray-200">
              <div className="text-sm uppercase text-gray-500 font-semibold tracking-wide mb-2.5">
                Description
              </div>
              <div className="text-gray-700 leading-relaxed text-[15px] break-words">
                {parsedProduct.description}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          {/* Primary Action - Add to Cart */}
          {(!parsedProduct.collect || parsedProduct.pointsValue == null) && (
            <AddToCart product={parsedProduct} />
          )}

          {/* Generate Barcode */}
          {(userRole === "brand" || parsedProduct.collect) && (
            <GenerateBarcode
              barcode={parsedProduct.barcode}
              price={parsedProduct.brandPrice}
              size={parsedProduct.size}
              currency="DKK"
            />
          )}

          {userRole !== "brand" && parsedProduct.collect !== true && (
            <div className="space-y-3 mt-4">
              <div className="grid grid-cols-1 sm:grid-cols-1 gap-3">
                <GenerateBarcode
                  barcode={parsedProduct.barcode}
                  price={parsedProduct.price > 1 ? parsedProduct.price : null}
                  points={
                    parsedProduct.pointsValue ? parsedProduct.pointsValue : null
                  }
                  size={parsedProduct.size}
                  currency="€"
                />
                <UnlinkProduct product={parsedProduct} />
              </div>
            </div>
          )}

          <div className="space-y-3 mt-4">
            {/* Secondary Actions Grid */}
            {userRole !== "brand" && (
              <div className="grid grid-cols-2 gap-3">
                <EditButton product={parsedProduct} />
                <CopyLinkButton productId={parsedProduct._id} />
              </div>
            )}
          </div>
          {/* Delete Button */}
          {parsedProduct.collect !== true && (
            <DeleteButton product={parsedProduct} />
          )}

          {/* Consignor Details */}
          {parsedUser && (
            <div className="mt-6 bg-gray-50 rounded-xl border-2 border-gray-200 p-5">
              <p className="text-gray-800 font-bold text-lg mb-3">
                Consignor Details
              </p>
              <div className="space-y-2 text-gray-700">
                <p>
                  <span className="font-semibold">Name:</span>{" "}
                  {parsedUser.firstname} {parsedUser.lastname}
                </p>
                <p>
                  <span className="font-semibold">Email:</span>{" "}
                  {parsedUser.email}
                </p>
                <p>
                  <span className="font-semibold">Address:</span>{" "}
                  {parsedUser.address}
                </p>
                <p>
                  <span className="font-semibold">Phone Number:</span>{" "}
                  {parsedUser.phoneNumber}
                </p>
                <p>
                  <span className="font-semibold">City:</span> {parsedUser.city}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Page;
