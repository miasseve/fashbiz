"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ProductItem from "./ProductItem";
import { Button } from "@heroui/react";
import { GridIcon, List, CheckSquare, X, InstagramIcon } from "lucide-react";
import {
  unlinkProductFromWix,
  createBulkInstagramPosts,
  getInstagramPendingStatus,
} from "@/actions/productActions";
import Swal from "sweetalert2";
import { toast } from "react-toastify";

const ProductList = ({ products, instagramPending }) => {
  const hasPostInProgress = instagramPending?.hasPending || false;
  const [isGrid, setIsGrid] = useState(true);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState(new Set());

  const [instagramMode, setInstagramMode] = useState(false);
  const [selectedInstagramProducts, setSelectedInstagramProducts] = useState(
    new Set(),
  );
  const [isCreatingPosts, setIsCreatingPosts] = useState(false);
  const router = useRouter();

  // Poll for Instagram post completion and auto-refresh
  useEffect(() => {
    if (!hasPostInProgress) return;

    const interval = setInterval(async () => {
      const result = await getInstagramPendingStatus();
      if (!result.hasPending) {
        clearInterval(interval);
        toast.success("Instagram post completed!");
        router.refresh();
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [hasPostInProgress, router]);

  const handleSelectionChange = (productId, isSelected) => {
    const newSelection = new Set(selectedProducts);
    if (isSelected) {
      newSelection.add(productId);
    } else {
      newSelection.delete(productId);
    }
    setSelectedProducts(newSelection);
  };

  const handleInstagramSelectionChange = (productId, isSelected) => {
    if (isCreatingPosts) return;
    const newSelection = new Set(selectedInstagramProducts);
    if (isSelected) {
      // Enforce maximum 5 products limit for Instagram
      if (newSelection.size >= 5) {
        toast.error("Maximum 5 products can be selected for Instagram posting");
        return;
      }
      newSelection.add(productId);
    } else {
      newSelection.delete(productId);
    }
    setSelectedInstagramProducts(newSelection);
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
        toast.success(
          `Successfully unlinked ${productIds.length} product${
            productIds.length > 1 ? "s" : ""
          }`,
        );
        setSelectedProducts(new Set());
        setSelectionMode(false);
        // Refresh your products list here
        window.location.reload(); // Or use a better state management approach
      } else {
        const error = await response.json();
        toast.error(
          `Failed to unlink products: ${error.message || "Unknown error"}`,
        );
      }
    } catch (error) {
      console.error("Error unlinking products:", error);
      toast.alert("An error occurred while unlinking products");
    }
  };

  const handleBulkInstagramPost = async () => {
    const productIds = Array.from(selectedInstagramProducts);

    if (productIds.length === 0) {
      toast.error("Please select at least one product to post");
      return;
    }

    const result = await Swal.fire({
      title: `Create Instagram posts for ${productIds.length} product${productIds.length > 1 ? "s" : ""}?`,
      html: `
        <p>Posts will be queued and processed automatically.</p>
        <p style="margin-top:8px; font-size:13px; color:#666;">
          ⏳ It may take up to <b>3 minutes</b> for the post to appear on Instagram.
        </p>
      `,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Yes, create posts!",
      cancelButtonText: "Cancel",
      reverseButtons: true,
      customClass: {
        confirmButton: "btn-danger",
      },
    });

    if (!result.isConfirmed) return;

    try {
      setIsCreatingPosts(true);
      const response = await createBulkInstagramPosts(productIds);

      if (response.status === 200) {
        toast.success(
          `Successfully queued Instagram post for ${response.data.productsQueued} product${
            response.data.productsQueued > 1 ? "s" : ""
          }`,
        );
        setSelectedInstagramProducts(new Set());
        setInstagramMode(false);
        router.refresh();
      } else {
        toast.error(
          `Failed to create posts: ${response.error || "Unknown error"}`,
        );
      }
    } catch (error) {
      console.error("Error creating Instagram posts:", error);
      toast.error("An error occurred while creating posts");
    } finally {
      setIsCreatingPosts(false);
    }
  };
  const toggleSelectionMode = () => {
    setSelectionMode(!selectionMode);
    if (selectionMode) {
      setSelectedProducts(new Set());
    }
  };
  const toggleInstagramMode = () => {
    setInstagramMode(!instagramMode);
    setSelectionMode(false);
    if (instagramMode) {
      setSelectedInstagramProducts(new Set());
    }
  };

  // Count products that can be selected (have wixProductId)
  const selectableProducts = products.filter(
    (p) => p.wixProductId && p.wixProductId !== "",
  );

  // Count products that can have Instagram posts (don't have existing posts)
  const instagramEligibleProducts = products.filter((p) => !p.hasInstagramPost);

  return (
    <div className="w-full">
      {/* Control Bar */}
      <div className="flex justify-between items-center mb-4 lg:mt-5 mx-[15px] flex-wrap gap-3">
        {/* Left Controls */}
        <div className="flex flex-col gap-3 w-full">
          {/* Top row: Unlink + Menu (same row even on mobile) */}
          <div className="flex justify-between items-center gap-3">
            {!selectionMode && !instagramMode ? (
              <>
                <Button
                  onPress={toggleSelectionMode}
                  className="font-semibold p-7 border border-[#06cb03] rounded-[4px] text-black bg-white"
                  isDisabled={selectableProducts.length === 0}
                >
                  <CheckSquare size={20} />
                  Click to Unlink
                </Button>

                <Button
                  onPress={() => setIsGrid(!isGrid)}
                  variant="ghost"
                  className="font-semibold p-7 border border-[#06cb03] rounded-[4px] text-black bg-white"
                >
                  {isGrid ? <List size={20} /> : <GridIcon size={20} />}
                </Button>
              </>
            ) : null}
          </div>

          {/* Bottom row: Instagram button (mobile bottom, desktop inline) */}
          {!selectionMode && !instagramMode && (
            <Button
              onPress={toggleInstagramMode}
              className="font-semibold p-7 border border-blue-500 rounded-[4px] text-black bg-white w-full sm:w-[30%]"
              isDisabled={
                instagramEligibleProducts.length === 0 || hasPostInProgress
              }
            >
              <InstagramIcon size={20} />
              {hasPostInProgress
                ? "Instagram Post in Progress..."
                : "Create Instagram Posts"}
            </Button>
          )}

          {/* Selection Mode */}
          {selectionMode && (
            <div className="flex gap-3 flex-wrap">
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
            </div>
          )}

          {/* Instagram Mode */}
          {instagramMode && (
            <div className="flex gap-3 flex-wrap">
              <Button
                onPress={toggleInstagramMode}
                variant="ghost"
                isDisabled={isCreatingPosts}
                className="font-semibold p-7 border border-gray-300 rounded-[4px] text-black bg-white"
              >
                <X size={20} />
                Cancel
              </Button>

              {selectedInstagramProducts.size > 0 && (
                <Button
                  onPress={handleBulkInstagramPost}
                  isLoading={isCreatingPosts}
                  isDisabled={isCreatingPosts}
                  className="font-semibold p-7 rounded-[4px] text-white bg-blue-600 hover:bg-blue-700"
                >
                  <InstagramIcon size={20} />
                  {isCreatingPosts
                    ? "Processing..."
                    : `Post ${selectedInstagramProducts.size} to Instagram`}
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Instagram Processing Banner */}
      {hasPostInProgress && !instagramMode && (
        <div className="mx-[15px] mb-4 p-3 bg-amber-50 border border-amber-300 rounded-lg flex items-center gap-2">
          <div className="animate-spin h-4 w-4 border-2 border-amber-600 border-t-transparent rounded-full" />
          <p className="text-sm text-amber-800">
            <strong>Instagram post is being processed.</strong>{" "}
            {instagramPending?.pendingPost?.productCount > 0 &&
              `${instagramPending.pendingPost.productCount} product${instagramPending.pendingPost.productCount > 1 ? "s" : ""} queued. `}
            This may take a few minutes. The page will update automatically.
          </p>
        </div>
      )}

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

      {/* Instagram Selection Info */}
      {instagramMode && (
        <div className="mx-[15px] mb-4 p-3 w-fit bg-blue-50 border border-blue-200 rounded-lg">
          {isCreatingPosts ? (
            <p className="text-sm text-blue-800">Processing Post...</p>
          ) : (
            <>
              <p className="text-sm text-blue-800">
                <strong>{`${selectedInstagramProducts.size}`}</strong> of{" "}
                <strong>5 max</strong> products selected for Instagram
                {instagramEligibleProducts.length < products.length && (
                  <span className="ml-2 text-gray-600">
                    ({products.length - instagramEligibleProducts.length}{" "}
                    already posted)
                  </span>
                )}
              </p>
              {selectedInstagramProducts.size >= 5 && (
                <p className="text-xs text-orange-600 mt-1">
                  ⚠️ Maximum limit reached (5 products)
                </p>
              )}
            </>
          )}
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
            instagramMode={instagramMode}
            isSelected={selectedProducts.has(product._id)}
            isInstagramSelected={selectedInstagramProducts.has(product._id)}
            onSelectionChange={handleSelectionChange}
            onInstagramSelectionChange={handleInstagramSelectionChange}
            instagramLimitReached={selectedInstagramProducts.size >= 10}
          />
        ))}
      </div>
    </div>
  );
};

export default ProductList;
