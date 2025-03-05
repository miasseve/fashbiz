"use client";
import React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@heroui/button";
import { useDispatch } from "react-redux";
import { addProductToCart } from "@/features/cartSlice";
const AddToCart = ({ product }) => {
  const router = useRouter();
  const dispatch = useDispatch();
  const handleAddToCart = () => {
    console.log(product,'prodyct')
    dispatch(addProductToCart(product));
    router.push("/cart");
  };

  return (
    <Button
      color="danger"
      type="submit"
      className="text-white py-6 px-6 rounded-lg text-lg mt-4 w-[30%]"
      onPress={handleAddToCart}
    >
      Add To Cart
    </Button>
  );
};

export default AddToCart;
