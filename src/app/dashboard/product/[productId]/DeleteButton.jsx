"use client";

import { useRouter } from "next/navigation";
import { deleteProductByIdAndWix } from "@/actions/productActions";
import Swal from "sweetalert2";
import { useState } from "react";
import { toast } from "react-toastify";

const DeleteButton = ({ product }) => {
  const router = useRouter();
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
    <button
      onClick={handleDelete}
      disabled={loading}
      className={`danger-btn max-w-max ${
        loading ? "opacity-50 cursor-not-allowed" : ""
      }`}
    >
      {loading ? "Deleting..." : "Delete Product"}
    </button>
  );
};

export default DeleteButton;
