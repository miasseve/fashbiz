"use client";
import React, { useState, useEffect, useCallback } from "react";
import { Card, Button, Spinner, Chip } from "@heroui/react";
import { GoShieldCheck } from "react-icons/go";
import { useRouter } from "next/navigation";
import axios from "axios";
import { toast } from "react-toastify";
import Image from "next/image";

const ReviewQueueClient = () => {
  const router = useRouter();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 1 });
  const [reviewingId, setReviewingId] = useState(null);

  const fetchProducts = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const res = await axios.get(`/api/ai/review-queue?page=${page}&limit=12`);
      setProducts(res.data.products);
      setPagination(res.data.pagination);
    } catch (err) {
      console.error("Failed to fetch review queue:", err);
      toast.error("Failed to load review queue");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleMarkReviewed = async (productId) => {
    setReviewingId(productId);
    try {
      await axios.patch("/api/ai/review-queue", { productId });
      setProducts((prev) => prev.filter((p) => p._id !== productId));
      setPagination((prev) => ({ ...prev, total: prev.total - 1 }));
      toast.success("Product marked as reviewed");
    } catch (err) {
      console.error("Failed to mark reviewed:", err);
      toast.error("Failed to update product");
    } finally {
      setReviewingId(null);
    }
  };

  const handleViewProduct = (productId) => {
    router.push(`/dashboard/product/${productId}`);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <Spinner size="lg" color="success" label="Loading review queue..." />
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-white p-6 sm:p-8 md:p-10 rounded-lg shadow-lg sm:w-[50%] w-[100%] text-center">
          <div className="flex justify-center mb-5">
            <div className="bg-green-100 rounded-full p-5">
              <GoShieldCheck className="text-green-500 text-4xl" />
            </div>
          </div>
          <h2 className="text-2xl font-bold mb-3">No products need review</h2>
          <p className="text-base sm:text-2xl text-gray-700">
            All products have sufficient AI confidence. Products with confidence below 60% will appear here for manual review.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold">Review Queue</h1>
          <p className="text-sm text-gray-500">
            {pagination.total} product{pagination.total !== 1 ? "s" : ""} with low AI confidence need review
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {products.map((product) => (
          <Card
            key={product._id}
            className="p-4 shadow-sm border border-orange-200 bg-orange-50/30"
          >
            {/* Product Image */}
            {product.images?.[0]?.url && (
              <div className="relative w-full h-40 mb-3 rounded-lg overflow-hidden bg-gray-100">
                <Image
                  src={product.images[0].url}
                  alt={product.title || "Product"}
                  fill
                  className="object-contain"
                  sizes="(max-width: 640px) 90vw, (max-width: 1024px) 45vw, 30vw"
                />
              </div>
            )}

            {/* Product Info */}
            <div className="space-y-1.5">
              <h3 className="font-medium text-sm line-clamp-1">
                {product.title || "Untitled"}
              </h3>

              <div className="flex items-center gap-2 flex-wrap">
                <Chip size="sm" color="warning" variant="flat">
                  Confidence: {product.aiConfidenceScore != null
                    ? `${(product.aiConfidenceScore * 100).toFixed(0)}%`
                    : "N/A"}
                </Chip>
                {product.category && (
                  <Chip size="sm" variant="flat">
                    {product.category}
                  </Chip>
                )}
              </div>

              <div className="text-xs text-gray-500 space-y-0.5">
                {product.brand && <p>Brand: {product.brand}</p>}
                {product.size && (
                  <p>Size: {Array.isArray(product.size) ? product.size.join(", ") : product.size}</p>
                )}
                <p>SKU: {product.sku}</p>
                <p>Added: {new Date(product.createdAt).toLocaleDateString()}</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 mt-3">
              <Button
                size="sm"
                variant="flat"
                onPress={() => handleViewProduct(product._id)}
                className="flex-1"
              >
                Edit
              </Button>
              <Button
                size="sm"
                color="success"
                variant="flat"
                isLoading={reviewingId === product._id}
                onPress={() => handleMarkReviewed(product._id)}
                className="flex-1"
              >
                Approve
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          <Button
            size="sm"
            variant="flat"
            isDisabled={pagination.page <= 1}
            onPress={() => fetchProducts(pagination.page - 1)}
          >
            Previous
          </Button>
          <span className="flex items-center text-sm text-gray-500">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <Button
            size="sm"
            variant="flat"
            isDisabled={pagination.page >= pagination.totalPages}
            onPress={() => fetchProducts(pagination.page + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
};

export default ReviewQueueClient;
