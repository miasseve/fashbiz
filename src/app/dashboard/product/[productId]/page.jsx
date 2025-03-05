import React from "react";
import { getProductById } from "@/actions/productActions";
import ImageCarousel from "@/app/product/components/ImageCarousel";
import Link from "next/link";
import { redirect } from "next/navigation";

const Page = async ({ params }) => {
  const { productId } = await params;
  const response = await getProductById(productId);
  console.log(response,'responsee')
  if (response.status !== 200) {
    redirect("/");
  }
  const {product,user}=response.data;
  console.log(JSON.parse(user),'user')
  const parsedProduct = JSON.parse(product);
  const parsedUser = JSON.parse(user);
 console.log(parsedProduct,'parsedProduct')
  return (
    <div className="container mx-auto p-0 lg:p-12">
      <div className="flex flex-col lg:flex-row gap-12 lg:bg-white lg:shadow-lg rounded-lg p-6 lg:p-10">
        <div className="w-full lg:w-1/2 flex justify-center">
          <ImageCarousel images={parsedProduct.images} />
        </div>

        <div className="w-full lg:w-1/2 flex flex-col gap-6 bg-white  lg:shadow-none shadow-lg p-[10px] lg:p-0">
          <h1 className="text-3xl lg:text-4xl font-bold text-gray-900">{parsedProduct.title}</h1>
          <ul className="space-y-2 text-gray-700">
            <li>
              <strong>Brand:</strong> {parsedProduct.brand}
            </li>
            <li>
              <strong>Price:</strong> <span className="text-lg font-semibold text-blue-600">${parsedProduct.price}</span>
            </li>
          </ul>
          <p className="text-gray-600 leading-relaxed">{parsedProduct.description}</p>
          <Link
            href={`/product/${parsedProduct._id}`}
            target="_blank"
            className="text-blue-600 hover:text-blue-800 font-semibold border-b-2 border-blue-600 hover:border-blue-800 transition duration-200 lg:w-[40%] w-[70%]"
          >
            View Product Details
          </Link>

          <div className="mt-6 p-4 bg-gray-100 rounded-lg shadow-sm">
            <p className="text-gray-800 font-semibold">Consignor Details</p>
            <p className="text-gray-700 italic">Name : {parsedUser.firstname} {parsedUser.lastname}</p>
            <p className="text-gray-700 italic">Email : {parsedUser.email}</p>
            <p className="text-gray-700 italic">Address : {parsedUser.address}</p>
            <p className="text-gray-700 italic">Phone Number: {parsedUser.phoneNumber}</p>            
            <p className="text-gray-700 italic">City :{parsedUser.city}</p>
            
          </div>
        </div>
      </div>
    </div>
  );
};

export default Page;