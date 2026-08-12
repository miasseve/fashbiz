"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@heroui/react";
import Swal from "sweetalert2";
import { toast } from "react-toastify";
import { FaCartShopping } from "react-icons/fa6";
import { markProductSoldManually } from "@/actions/productActions";

// Free-plan stores don't get automatic Shopify sync, so this is their way
// to mark an in-store sale — it delists the product everywhere the same
// way a real Shopify sale or a barcode scan already does.
const SoldDelistButton = ({ productId, sold }) => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  if (sold) {
    return (
      <div className="flex items-center gap-2 text-red-600 font-semibold">
        <FaCartShopping size={16} />
        Item sold — no longer available
      </div>
    );
  }

  const handleMarkSold = async () => {
    const result = await Swal.fire({
      title: "Mark this product as sold?",
      text: "It will be removed from your webstore and Instagram too.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, mark sold",
      cancelButtonText: "Cancel",
      reverseButtons: true,
      customClass: { confirmButton: "btn-danger" },
    });
    if (!result.isConfirmed) return;

    setLoading(true);
    try {
      const response = await markProductSoldManually(productId);
      if (response.status === 200) {
        toast.success("Marked sold and delisted");
        router.refresh();
      } else {
        toast.error(response.error || "Failed to mark sold");
      }
    } catch (error) {
      console.error(error);
      toast.error("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      onPress={handleMarkSold}
      isLoading={loading}
      isDisabled={loading}
      className="danger-btn flex items-center gap-2"
    >
      <FaCartShopping size={16} />
      Mark Sold / Delist
    </Button>
  );
};

export default SoldDelistButton;
