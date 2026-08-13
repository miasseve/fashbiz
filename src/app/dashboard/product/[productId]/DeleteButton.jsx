"use client";

import { useRouter } from "next/navigation";
import { deleteProductByIdAndWix } from "@/actions/productActions";
import { removeProductById } from "@/features/cartSlice";
import Swal from "sweetalert2";
import { useState } from "react";
import { toast } from "react-toastify";
import { Button } from "@heroui/react";
import { useDispatch } from "react-redux";
import { FiTrash2 } from "react-icons/fi";
const DeleteButton = ({ product, compact = false }) => {
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
      const response = await deleteProductByIdAndWix(product, { deleteDb: true, deleteWix: !!product?.wixProductId, deleteShopify: !!product?.shopifyProductId });
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

  if (compact) {
    return (
      <button
        type="button"
        onClick={handleDelete}
        disabled={loading}
        title="Delete product"
        className="w-11 h-11 flex items-center justify-center rounded-full bg-red-50 text-red-600 hover:bg-red-100 disabled:opacity-50"
      >
        <FiTrash2 size={19} />
      </button>
    );
  }

  return (
    <Button onPress={handleDelete} disabled={loading} className={`danger-btn`}>
      <FiTrash2 size={18} />
      {loading ? "Deleting..." : "Delete Product"}
    </Button>
  );
};

export default DeleteButton;
