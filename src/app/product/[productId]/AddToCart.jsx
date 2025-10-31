"use client";
import React,{ useState} from "react";
import { useRouter } from "next/navigation";
import { Button } from "@heroui/button";
import { useDispatch } from "react-redux";
import { addProductToCart } from "@/features/cartSlice";
import { FiShoppingCart } from "react-icons/fi";
import { addProductToCart as addProductToCartAction} from "@/actions/productActions";

const AddToCart = ({ product }) => {
  const router = useRouter();
  const dispatch = useDispatch();
  const [errorMessage, setErrorMessage] = useState("");
  const handleAddToCart = async () => {
    dispatch(addProductToCart(product));
    try {
      const res = await addProductToCartAction({
        productId: product._id,
        title: product.title,
        price: product.price,
        images:product.images,
      });

      if (res.status != 200) {
        setErrorMessage("Failed to add Product to cart.Please try again !!");
        console.log("error in adding Product to cart",res.message);
      }
    } catch (err) {
      console.error("Add to cart error:", err);
    }
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
