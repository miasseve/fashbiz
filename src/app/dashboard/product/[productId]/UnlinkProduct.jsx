"use client";
import { useRouter } from "next/navigation";
import { deleteProductByIdAndWix } from "@/actions/productActions";
import { removeProductById } from "@/features/cartSlice";
import Swal from "sweetalert2";
import { useState } from "react";
import { toast } from "react-toastify";
import { Button } from "@heroui/react";
import { useDispatch } from "react-redux";
import { GoUnlink } from "react-icons/go";
const UnlinkProduct = ({ product }) => {
  const router = useRouter();
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const isUnlinked = !product?.wixProductId;
  const handleUnlink = async () => {
    const result = await Swal.fire({
      title: "Do you want to unlink this product from Leestore?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, unlink it!",
      cancelButtonText: "No, keep it",
      reverseButtons: true,
      customClass: {
        confirmButton: "btn-danger",
      },
    });

    if (!result.isConfirmed) return;
    setLoading(true);
    try {
      const response = await deleteProductByIdAndWix(product, {
        deleteDb: false,
        deleteWix: true,
      });
      if (response.status === 200) {
        dispatch(removeProductById(product._id));
        toast.success("Product unlinked from Leestore successfully!");
        router.push("/dashboard/store");
      } else {
        toast.error("Failed to unlink the product.");
      }
    } catch (error) {
      console.error(error);
      toast.error(
        "An error occurred while unlinking the product. Please try again."
      );
    } finally {
      setLoading(false); // Stop loader (just in case)
    }
  };

  return (
    <Button
      onPress={!isUnlinked ? handleUnlink : undefined}
      disabled={loading || isUnlinked}
      className={`auth-btn ${
        isUnlinked ? "bg-gray-400 opacity-60 grayscale" : ""
      }`}
    >
      <GoUnlink size={18} />
      {isUnlinked
        ? "Unlinked"
        : loading
        ? "Unlinking..."
        : "Unlink Product"}
    </Button>
  );
};

export default UnlinkProduct;
