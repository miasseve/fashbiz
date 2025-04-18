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
    dispatch(addProductToCart(product));
    router.push("/cart");
  };

  return (
    <Button
      type="submit"
      className="danger-btn max-w-max"
      onPress={handleAddToCart}
    >
      Add To Cart
    </Button>
  );
};

export default AddToCart;
