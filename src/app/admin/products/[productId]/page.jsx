"use client";
import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Spinner } from "@heroui/react";
import { toast } from "react-toastify";
import { FaArrowLeft, FaTrash, FaStore } from "react-icons/fa";

const AdminProductDetailPage = () => {
  const { productId } = useParams();
  const router = useRouter();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const res = await fetch(`/api/admin/products/${productId}`);
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Failed to load");
        setProduct(json.product);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    if (productId) fetchDetails();
  }, [productId]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/products/${productId}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to delete");
      toast.success("Product deleted");
      router.push("/admin/products");
    } catch (err) {
      toast.error(err.message || "Something went wrong while deleting.");
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <Spinner size="lg" color="success" />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="p-6">
        <p className="text-lg text-red-600">{error || "Product not found."}</p>
        <button
          onClick={() => router.push("/admin/products")}
          className="mt-4 inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-800 font-semibold"
        >
          <FaArrowLeft /> Back to Products
        </button>
      </div>
    );
  }

  const status = product.sold
    ? { label: "Sold", cls: "text-orange-700 bg-orange-100" }
    : product.archived
    ? { label: "Archived", cls: "text-gray-600 bg-gray-100" }
    : { label: "Active", cls: "text-green-700 bg-green-100" };

  const storeName = product.userId
    ? product.userId.storename || `${product.userId.firstname} ${product.userId.lastname}`
    : "Unknown";

  const Field = ({ label, value }) =>
    value === null || value === undefined || value === "" ? null : (
      <div className="bg-gray-50 p-3 rounded-xl border border-gray-200">
        <div className="text-xs uppercase text-gray-500 font-semibold tracking-wide mb-1">{label}</div>
        <div className="text-base text-gray-900 font-semibold break-words">{value}</div>
      </div>
    );

  return (
    <div className="space-y-6 px-2 sm:px-0">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <button
          onClick={() => router.push("/admin/products")}
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 font-semibold"
        >
          <FaArrowLeft /> Back to Products
        </button>
        <button
          onClick={() => setShowConfirm(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg font-semibold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 transition-colors"
        >
          <FaTrash className="text-sm" /> Delete Product
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          {product.images && product.images.length > 0 ? (
            <div className="space-y-2">
              <img
                src={product.images[0].url}
                alt={product.title}
                className="w-full aspect-square object-cover rounded-xl border border-gray-200"
              />
              {product.images.length > 1 && (
                <div className="flex gap-2 flex-wrap">
                  {product.images.slice(1).map((img, i) => (
                    <img
                      key={i}
                      src={img.url}
                      alt=""
                      className="w-16 h-16 object-cover rounded-lg border border-gray-200"
                    />
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="w-full aspect-square rounded-xl border border-gray-200 bg-gray-50 flex items-center justify-center text-gray-300">
              No Image
            </div>
          )}
        </div>

        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-gray-900">{product.title}</h1>
            <span className={`px-3 py-1 rounded-full text-sm font-semibold shrink-0 ${status.cls}`}>
              {status.label}
            </span>
          </div>

          <div className="flex items-center gap-2 text-gray-600">
            <FaStore className="text-gray-400" />
            <span className="font-semibold">{storeName}</span>
            {product.userId?.email && <span className="text-gray-400">· {product.userId.email}</span>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Price" value={product.price > 1 ? `${product.price} DKK` : null} />
            <Field label="Points Value" value={product.pointsValue} />
            <Field label="Brand" value={product.brand} />
            <Field label="Category" value={product.category} />
            <Field label="Sub Category" value={product.subcategory} />
            <Field label="Color" value={product.color?.name} />
            <Field label="Size" value={product.size?.join(", ")} />
            <Field label="Fabric" value={product.fabric} />
            <Field label="Condition" value={product.condition_grade} />
            <Field label="SKU" value={product.sku} />
            <Field label="Barcode" value={product.barcode} />
            <Field
              label="Created"
              value={
                product.createdAt
                  ? new Date(product.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })
                  : null
              }
            />
          </div>

          {product.condition_notes && <Field label="Condition Notes" value={product.condition_notes} />}
          {product.description && <Field label="Description" value={product.description} />}

          <div className="flex flex-wrap gap-2 pt-2">
            {product.shopifyProductId && (
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-green-50 text-green-700 border border-green-200">
                Synced to Shopify
              </span>
            )}
            {product.wixProductId && (
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                Linked to Webstore
              </span>
            )}
            {product.hasInstagramPost && (
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                Posted to Instagram
              </span>
            )}
            {product.needsReview && (
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                Needs Review
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Delete confirmation modal — same pattern as the Stores & Users list */}
      {showConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => !deleting && setShowConfirm(false)}
        >
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl p-8" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start gap-5">
              <div className="flex-shrink-0 w-14 h-14 rounded-full bg-red-100 flex items-center justify-center">
                <FaTrash className="text-red-600 text-xl" />
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-gray-900">Delete this product?</h3>
                <p className="mt-2 text-gray-600 leading-relaxed">
                  You're about to permanently delete{" "}
                  <span className="font-semibold text-gray-900">{product.title}</span>. This also removes it
                  from Shopify if it was synced there. This cannot be undone.
                </p>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                disabled={deleting}
                className="px-5 py-2.5 rounded-lg font-semibold text-gray-700 border border-gray-300 hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-white bg-red-600 hover:bg-red-700 disabled:opacity-60"
              >
                {deleting ? (
                  <>
                    <Spinner size="sm" color="white" /> Deleting...
                  </>
                ) : (
                  <>
                    <FaTrash className="text-sm" /> Delete permanently
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProductDetailPage;
