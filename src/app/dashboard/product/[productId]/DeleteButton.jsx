"use client";

import { useRouter } from "next/navigation";
import { deleteProductById } from "@/actions/productActions";
import Swal from "sweetalert2";
import { toast } from "react-toastify";

const DeleteButton = ({ productId }) => {
  const router = useRouter();

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

    try {
      const response = await deleteProductById(productId);
      if (response.status === 200) {
        toast.success("Product deleted successfully!");
        router.push("/dashboard/store");
      } else {
        toast.error("Failed to delete the product.");
      }
    } catch (error) {
      console.error(error);
      toast.error("An error occurred. Please try again.");
    }
  };

  return (
    <button
      onClick={handleDelete}
       className="danger-btn max-w-max"
    >
      Delete Product
    </button>
  );
};

export default DeleteButton;
