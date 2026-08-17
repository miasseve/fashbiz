"use client";
import React, { useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Spinner } from "@heroui/react";
import { toast } from "react-toastify";
import { FaArrowLeft, FaTrash, FaStore, FaEdit } from "react-icons/fa";
import { CATEGORIES, SUBCATEGORIES } from "@/lib/taxonomy";

// Full address shown alongside every store name in the reassign picker —
// two stores can share a name (or a very similar one), and only the address
// makes it unambiguous which one is actually being picked.
const storeAddressLine = (s) =>
  [s.address, s.city, s.country].filter(Boolean).join(", ");

const emptyForm = {
  title: "",
  brand: "",
  category: "",
  subcategory: "",
  price: "",
  size: "",
  fabric: "",
  colorName: "",
  condition_grade: "",
  condition_notes: "",
  description: "",
  sku: "",
};

const AdminProductDetailPage = () => {
  const { productId } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);

  // Store reassignment — separate from the rest of the edit form since it's
  // a search-and-pick control, not a plain field. Holds the FULL selected
  // store object (not just an id) so the header display can update
  // immediately on save without a second fetch.
  const [stores, setStores] = useState([]);
  const [storeQuery, setStoreQuery] = useState("");
  const [reassignStore, setReassignStore] = useState(null);

  useEffect(() => {
    fetch("/api/admin/users")
      .then((res) => res.json())
      .then((data) => setStores((data.users || []).filter((u) => u.role === "store")))
      .catch(() => {});
  }, []);

  const storeMatches = useMemo(() => {
    const q = storeQuery.trim().toLowerCase();
    if (!q) return [];
    return stores.filter((s) => (s.storename || "").toLowerCase().includes(q)).slice(0, 8);
  }, [stores, storeQuery]);

  const startEditing = (p) => {
    setReassignStore(null);
    setStoreQuery("");
    setForm({
      title: p.title || "",
      brand: p.brand || "",
      // A bad/legacy category won't match any real option — start blank so
      // the dropdown forces picking a real one instead of silently keeping it.
      category: CATEGORIES.includes(p.category) ? p.category : "",
      subcategory: p.subcategory || "",
      price: p.price ?? "",
      size: p.size?.join(", ") || "",
      fabric: p.fabric || "",
      colorName: p.color?.name || "",
      condition_grade: p.condition_grade || "",
      condition_notes: p.condition_notes || "",
      description: p.description || "",
      sku: p.sku || "",
    });
    setEditing(true);
  };

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const res = await fetch(`/api/admin/products/${productId}`);
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Failed to load");
        setProduct(json.product);
        if (searchParams.get("edit") === "true") startEditing(json.product);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    if (productId) fetchDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const handleSave = async () => {
    if (!form.category) {
      toast.error("Please pick a category");
      return;
    }
    setSaving(true);
    try {
      const body = reassignStore ? { ...form, storeId: reassignStore._id } : form;
      const res = await fetch(`/api/admin/products/${productId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to save");
      setProduct((prev) => ({
        ...prev,
        ...form,
        price: Number(form.price),
        size: form.size.split(",").map((s) => s.trim()).filter(Boolean),
        color: { ...prev.color, name: form.colorName },
        ...(reassignStore ? { userId: reassignStore } : {}),
      }));
      toast.success("Product updated");
      setEditing(false);
    } catch (err) {
      toast.error(err.message || "Something went wrong while saving.");
    } finally {
      setSaving(false);
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
        <div className="text-sm uppercase text-gray-500 font-semibold tracking-wide mb-1">{label}</div>
        <div className="text-lg text-gray-900 font-semibold break-words">{value}</div>
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
        <div className="flex items-center gap-2">
          {!editing && (
            <button
              onClick={() => startEditing(product)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg font-semibold text-amber-600 bg-amber-50 hover:bg-amber-100 border border-amber-200 transition-colors"
            >
              <FaEdit className="text-sm" /> Edit Product
            </button>
          )}
          <button
            onClick={() => setShowConfirm(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg font-semibold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 transition-colors"
          >
            <FaTrash className="text-sm" /> Delete Product
          </button>
        </div>
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
            <span className="font-semibold">
              {reassignStore ? reassignStore.storename : storeName}
            </span>
            {reassignStore ? (
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                Pending — save to confirm
              </span>
            ) : (
              product.userId?.email && <span className="text-gray-400">· {product.userId.email}</span>
            )}
          </div>

          {editing ? (
            <div className="space-y-4 border-t border-gray-100 pt-4">
              <div>
                <span className="text-sm uppercase text-gray-500 font-semibold tracking-wide">
                  Reassign to a different store
                </span>
                {reassignStore ? (
                  <div className="mt-1 flex items-center justify-between gap-3 rounded-lg border border-gray-300 px-3 py-2.5 bg-gray-50">
                    <div className="min-w-0">
                      <div className="font-semibold text-gray-900 truncate">{reassignStore.storename}</div>
                      <div className="text-sm text-gray-500 truncate">{storeAddressLine(reassignStore) || "No address on file"}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setReassignStore(null)}
                      className="shrink-0 text-sm font-semibold text-indigo-600 hover:text-indigo-800"
                    >
                      Change
                    </button>
                  </div>
                ) : (
                  <>
                    <input
                      value={storeQuery}
                      onChange={(e) => setStoreQuery(e.target.value)}
                      placeholder="Search store by name…"
                      className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2.5 text-base"
                    />
                    {storeMatches.length > 0 && (
                      <div className="mt-1 max-h-[220px] overflow-y-auto rounded-lg border border-gray-300 bg-white">
                        {storeMatches.map((s) => (
                          <button
                            type="button"
                            key={s._id}
                            onClick={() => { setReassignStore(s); setStoreQuery(""); }}
                            className="block w-full text-left px-3 py-2.5 border-b border-gray-100 last:border-b-0 hover:bg-gray-50"
                          >
                            <div className="font-semibold text-gray-900">{s.storename}</div>
                            <div className="text-sm text-gray-500">{storeAddressLine(s) || "No address on file"}</div>
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-sm uppercase text-gray-500 font-semibold tracking-wide">Title</span>
                  <input
                    value={form.title}
                    onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                    className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2.5 text-base"
                  />
                </label>
                <label className="block">
                  <span className="text-sm uppercase text-gray-500 font-semibold tracking-wide">Brand</span>
                  <input
                    value={form.brand}
                    onChange={(e) => setForm((f) => ({ ...f, brand: e.target.value }))}
                    className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2.5 text-base"
                  />
                </label>

                <label className="block">
                  <span className="text-sm uppercase text-gray-500 font-semibold tracking-wide">
                    Category <span className="text-red-500">*</span>
                  </span>
                  <select
                    value={form.category}
                    onChange={(e) => setForm((f) => ({ ...f, category: e.target.value, subcategory: "" }))}
                    className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2.5 text-base bg-white"
                  >
                    <option value="">Select category…</option>
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="text-sm uppercase text-gray-500 font-semibold tracking-wide">Sub Category</span>
                  <select
                    value={form.subcategory}
                    onChange={(e) => setForm((f) => ({ ...f, subcategory: e.target.value }))}
                    disabled={!form.category}
                    className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2.5 text-base bg-white disabled:bg-gray-50"
                  >
                    <option value="">Select sub category…</option>
                    {(SUBCATEGORIES[form.category] || []).map((sc) => (
                      <option key={sc} value={sc}>{sc}</option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="text-sm uppercase text-gray-500 font-semibold tracking-wide">Price (DKK)</span>
                  <input
                    type="number"
                    value={form.price}
                    onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                    className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2.5 text-base"
                  />
                </label>
                <label className="block">
                  <span className="text-sm uppercase text-gray-500 font-semibold tracking-wide">Size (comma separated)</span>
                  <input
                    value={form.size}
                    onChange={(e) => setForm((f) => ({ ...f, size: e.target.value }))}
                    className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2.5 text-base"
                  />
                </label>

                <label className="block">
                  <span className="text-sm uppercase text-gray-500 font-semibold tracking-wide">Fabric</span>
                  <input
                    value={form.fabric}
                    onChange={(e) => setForm((f) => ({ ...f, fabric: e.target.value }))}
                    className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2.5 text-base"
                  />
                </label>
                <label className="block">
                  <span className="text-sm uppercase text-gray-500 font-semibold tracking-wide">Color</span>
                  <input
                    value={form.colorName}
                    onChange={(e) => setForm((f) => ({ ...f, colorName: e.target.value }))}
                    className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2.5 text-base"
                  />
                </label>

                <label className="block">
                  <span className="text-sm uppercase text-gray-500 font-semibold tracking-wide">Condition</span>
                  <select
                    value={form.condition_grade}
                    onChange={(e) => setForm((f) => ({ ...f, condition_grade: e.target.value }))}
                    className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2.5 text-base bg-white"
                  >
                    <option value="">—</option>
                    <option value="A">A — like new</option>
                    <option value="B">B — good</option>
                    <option value="C">C — fair</option>
                  </select>
                </label>
                <label className="block">
                  <span className="text-sm uppercase text-gray-500 font-semibold tracking-wide">SKU</span>
                  <input
                    value={form.sku}
                    onChange={(e) => setForm((f) => ({ ...f, sku: e.target.value }))}
                    className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2.5 text-base"
                  />
                </label>
              </div>

              <label className="block">
                <span className="text-sm uppercase text-gray-500 font-semibold tracking-wide">Condition Notes</span>
                <textarea
                  value={form.condition_notes}
                  onChange={(e) => setForm((f) => ({ ...f, condition_notes: e.target.value }))}
                  rows={2}
                  className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2.5 text-base"
                />
              </label>
              <label className="block">
                <span className="text-sm uppercase text-gray-500 font-semibold tracking-wide">Description</span>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  rows={3}
                  className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2.5 text-base"
                />
              </label>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => { setReassignStore(null); setEditing(false); }}
                  disabled={saving}
                  className="px-5 py-2.5 rounded-lg font-semibold text-gray-700 border border-gray-300 hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60"
                >
                  {saving ? <><Spinner size="sm" color="white" /> Saving...</> : "Save Changes"}
                </button>
              </div>
            </div>
          ) : (
            <>
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
            </>
          )}

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
