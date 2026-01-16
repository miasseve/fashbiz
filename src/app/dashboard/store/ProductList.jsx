"use client";
import React, { useState } from "react";
import ProductItem from "./ProductItem";
import { Button } from "@heroui/react";
import { GridIcon, List, CheckSquare, X } from "lucide-react";
import { unlinkProductFromWix } from "@/actions/productActions";
import Swal from "sweetalert2";
import { toast } from "react-toastify";

const ProductList = ({ products }) => {
  const [isGrid, setIsGrid] = useState(true);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState(new Set());

  const handleSelectionChange = (productId, isSelected) => {
    const newSelection = new Set(selectedProducts);
    if (isSelected) {
      newSelection.add(productId);
    } else {
      newSelection.delete(productId);
    }
    setSelectedProducts(newSelection);
  };

  const handleBulkUnlink = async () => {
    const productIds = Array.from(selectedProducts);

    if (productIds.length === 0) {
      toast.alert("Please select at least one product to unlink");
      return;
    }
    const result = await Swal.fire({
      title: `Do you want to unlink this  ${productIds.length} product${productIds.length > 1 ? "s" : ""} from Leestore?`,
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

    try {
      // Replace with your actual API endpoint
      const response = await unlinkProductFromWix(productIds);
      if (response.status === 200) {
         toast.success(`Successfully unlinked ${productIds.length} product${
            productIds.length > 1 ? "s" : ""
          }`);
        setSelectedProducts(new Set());
        setSelectionMode(false);
        // Refresh your products list here
        window.location.reload(); // Or use a better state management approach
      } else {
        const error = await response.json();
        toast.error(`Failed to unlink products: ${error.message || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Error unlinking products:", error);
      toast.alert("An error occurred while unlinking products");
    }
  };

  const toggleSelectionMode = () => {
    setSelectionMode(!selectionMode);
    if (selectionMode) {
      setSelectedProducts(new Set());
    }
  };

  // Count products that can be selected (have wixProductId)
  const selectableProducts = products.filter(
    (p) => p.wixProductId && p.wixProductId !== ""
  );

  return (
    <div className="w-full">
      {/* Control Bar */}
      <div className="flex justify-between items-center mb-4 lg:mt-5 mx-[15px]">
        {/* Selection Controls */}
        <div className="flex gap-3 items-center">
          {!selectionMode ? (
            <Button
              onPress={toggleSelectionMode}
              className="font-semibold p-7 border border-[#06cb03] rounded-[4px] text-black bg-white"
              isDisabled={selectableProducts.length === 0}
            >
              <CheckSquare size={20} />
              Click to Unlink
            </Button>
          ) : (
            <>
              <Button
                onPress={toggleSelectionMode}
                variant="ghost"
                className="font-semibold p-7 border border-gray-300 rounded-[4px] text-black bg-white"
              >
                <X size={20} />
                Cancel
              </Button>

              {selectedProducts.size > 0 && (
                <Button
                  onPress={handleBulkUnlink}
                  className="font-semibold p-7 rounded-[4px] text-white bg-red-600 hover:bg-red-700"
                >
                  Unlink {selectedProducts.size} Product
                  {selectedProducts.size > 1 ? "s" : ""}
                </Button>
              )}
            </>
          )}
        </div>

        {/* View Toggle Button */}
        <Button
          onPress={() => setIsGrid(!isGrid)}
          variant="ghost"
          className="font-semibold p-7 border border-[#06cb03] rounded-[4px] border-white text-black bg-white"
        >
          {isGrid ? <List size={20} /> : <GridIcon size={20} />}
          {/* {isGrid ? "List View" : "Grid View"} */}
        </Button>
      </div>

      {/* Selection Info */}
      {selectionMode && (
        <div className="mx-[15px] mb-4 p-3 w-fit bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>{selectedProducts.size}</strong> of{" "}
            <strong>{selectableProducts.length}</strong> products selected
            {selectableProducts.length < products.length && (
              <span className="ml-2 text-gray-600">
                ({products.length - selectableProducts.length} already unlinked)
              </span>
            )}
          </p>
        </div>
      )}

      {/* Product List */}
      <div
        className={`${
          isGrid
            ? "grid sm:grid-cols-3 grid-cols-1 px-[15px] gap-[15px] lg:p-[10px]"
            : ""
        }`}
      >
        {products.map((product) => (
          <ProductItem
            key={product._id}
            product={product}
            isGrid={isGrid}
            selectionMode={selectionMode}
            isSelected={selectedProducts.has(product._id)}
            onSelectionChange={handleSelectionChange}
          />
        ))}
      </div>
    </div>
  );
};

export default ProductList;
