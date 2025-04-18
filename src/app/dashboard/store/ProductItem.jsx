"use client";
import React from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardBody, CardFooter, Button } from "@heroui/react";

const ProductItem = ({ product, isGrid }) => {
  const router = useRouter();
  const handleClick = () => {
    router.push(`/dashboard/product/${product._id}`);
  };

  return (
    <>
      {isGrid ? (
        <>
          <Card
            className={`p-[10px] h-full border-none rounded-none shadow-[0_1px_2px_rgba(0,0,0,0.2)]} p-0`}
          >
            {product.images.length > 0 && (
              <img
                src={product.images[0].url}
                alt={product.title}
                className="rounded-lg w-full lg:h-[250px] mx-auto object-cover mb-4 "
              />
            )}

            <div className="p-8">
              <h2 className="text-[15px] font-semibold uppercase mb-[10px]">
                {product.title}
              </h2>
              <p className="text-gray-600 text-2xl lg:text-md mb-[15px]">
                {product.description.length > 30
                  ? product.description.slice(0, 90) + "..."
                  : product.description}
              </p>
              <p className="font-bold mt-2 text-2xl lg:text-md mb-[10px] flex items-center justify-between">
                <span className="font-regular">Price : </span>
                <span> €{product.price.toFixed(2)}</span>
              </p>
              {/* </CardBody> */}

              <Button onPress={handleClick} className="success-btn ">
                View Details
              </Button>
            </div>
          </Card>
        </>
      ) : (
        // Line (List) view layout
        <div className="flex items-center bg-[white] p-[10px] rounded-[8px] items-start mb-6 ">
          {product.images.length > 0 && (
            <img
              src={product.images[0].url}
              alt={product.title}
              className="w-[15rem] h-[15rem]  rounded-lg me-[2rem] object-cover"
            />
          )}
          <div className="flex gap-[15px] flex-col">
            <div className="flex-1 gap-3">
              <h2 className="text-[20px] font-semibold">{product.title}</h2>
              <p className="text-gray-600">
                {product.description.length > 60
                  ? product.description.slice(0, 60) + "..."
                  : product.description}
              </p>
              <p className="font-bold text-md mt-1">
                €{product.price.toFixed(2)}
              </p>
            </div>
            <Button
              onPress={handleClick}
              className="text-[12px] px-[3rem] py-[1rem] text-white rounded-lg w-min"
              color="success"
              size="md"
            >
              View
            </Button>
          </div>
        </div>
      )}
    </>
  );
};

export default ProductItem;
