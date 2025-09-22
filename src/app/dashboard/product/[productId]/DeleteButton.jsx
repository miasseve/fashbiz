"use client";

import { useRouter } from "next/navigation";
import { deleteProductByIdAndWix } from "@/actions/productActions";
import { removeProductById } from "@/features/cartSlice"; 
import Swal from "sweetalert2";
import { useState } from "react";
import { toast } from "react-toastify";
import { Button } from "@heroui/react";
import { useDispatch } from "react-redux";

const DeleteButton = ({ product }) => {
  const router = useRouter();
   const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const handleDelete = async () => {
    const result = await Swal.fire({
      title: "Are you sure you want to delete this product?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete it!",
      cancelButtonText: "No, keep it",
      reverseButtons: true,
      customClass: {
        confirmButton: "btn-danger",
      },
    });

    if (!result.isConfirmed) return;
    setLoading(true);
    try {
      const response = await deleteProductByIdAndWix(product);
      if (response.status === 200) {
        dispatch(removeProductById(product._id));
        toast.success("Product deleted successfully!");
        router.push("/dashboard/store");
      } else {
        toast.error("Failed to delete the product.");
      }
    } catch (error) {
      console.error(error);
      toast.error("An error occurred. Please try again.");
    } finally {
      setLoading(false); // Stop loader (just in case)
    }
  };

  return (
    <Button
      onPress={handleDelete}
      disabled={loading}
      className={`danger-btn`}
    >
      {loading ? "Deleting..." : "Delete Product"}
    </Button>
  );
};

export default DeleteButton;
