"use client";
import React from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardBody, CardFooter, Button } from "@heroui/react";
const ProductItem = ({ product }) => {
  const router = useRouter();
  const handleClick = () => {
    router.push(`/dashboard/product/${product._id}`);
  };
  return (
    <Card className="p-[10px] h-[100%]">
      <CardHeader>
        <h2 className="text-xl font-semibold">{product.title}</h2>
      </CardHeader>

      <CardBody>
        {product.images.length > 0 && (
          <img
            src={product.images[0].url}
            alt={product.title}
            className="rounded-lg w-full  lg:h-[250px]  mx-auto object-cover mb-4"
          />
        )}
        <p className="text-gray-600">
          {product.description.length > 30
            ? product.description.slice(0, 30) + "..."
            : product.description}
        </p>
        <p className="font-bold mt-2 text-lg">€{product.price.toFixed(2)}</p>
      </CardBody>

      <CardFooter>
        <Button
          onPress={handleClick}
          className="text-[1.2rem] px-6 py-6 text-white rounded-lg"
          color="success"
          size="md"
        >
          View Details
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ProductItem;
