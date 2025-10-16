"use client";
import React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@heroui/button";
import { useDispatch } from "react-redux";
import { addProductToCart } from "@/features/cartSlice";
import { FiShoppingCart } from "react-icons/fi";
const AddToCart = ({ product }) => {
  const router = useRouter();
  const dispatch = useDispatch();
  const handleAddToCart = () => {
    dispatch(addProductToCart(product));
    router.push("/cart");
  };

  return (
    <Button type="submit" className="success-btn" onPress={handleAddToCart}>
      <FiShoppingCart size={18} />
      Add To Cart
    </Button>
  );
};

export default AddToCart;
