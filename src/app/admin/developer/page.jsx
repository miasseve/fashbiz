"use client";
import React, { useEffect, useState } from "react";
import { Spinner } from "@heroui/react";
import { MdLock, MdAdd, MdEdit, MdDelete, MdVisibility, MdVisibilityOff, MdCheckCircle, MdCancel } from "react-icons/md";
import { FaStore } from "react-icons/fa";

const EMPTY_FORM = {
  userId: "",
  storeDomain: "",
  accessToken: "",
  apiSecret: "",
  isBaseStore: false,
};

const DeveloperPage = () => {
  const [stores, setStores] = useState([]);
  const [storeOwners, setStoreOwners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [showToken, setShowToken] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [formError, setFormError] = useState("");

  const fetchStores = async () => {
    try {
      const res = await fetch("/api/developer/shopify-stores");
      const data = await res.json();
      setStores(data.stores || []);
    } catch {
      /* silent */
    } finally {
      setLoading(false);
    }
  };

  const fetchStoreOwners = async () => {
    try {
      const res = await fetch("/api/admin/users");
      const data = await res.json();
      setStoreOwners((data.users || []).filter((u) => u.role === "store"));
    } catch {
      /* silent */
    }
  };

  useEffect(() => {
    fetchStores();
    fetchStoreOwners();
  }, []);

  const openAdd = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setShowToken(false);
    setShowSecret(false);
    setFormError("");
    setShowForm(true);
  };

  const openEdit = (store) => {
    setEditingId(store._id);
    setForm({
      userId: store.userId || "",
      storeDomain: store.storeDomain,
      accessToken: "",
      apiSecret: "",
      isBaseStore: store.isBaseStore,
    });
    setShowToken(false);
    setShowSecret(false);
    setFormError("");
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    if (!form.storeDomain.trim()) {
      setFormError("Store domain is required.");
      return;
    }
    if (!editingId && (!form.accessToken.trim() || !form.apiSecret.trim())) {
      setFormError("Access Token and API Secret are required when adding a new store.");
      return;
    }

    setSaving(true);
    try {
      const url = editingId
        ? `/api/developer/shopify-stores/${editingId}`
        : "/api/developer/shopify-stores";
      const method = editingId ? "PUT" : "POST";

      const body = {
        storeDomain: form.storeDomain.trim(),
        isBaseStore: form.isBaseStore,
        userId: form.userId || null,
      };
      if (form.accessToken.trim()) body.accessToken = form.accessToken.trim();
      if (form.apiSecret.trim()) body.apiSecret = form.apiSecret.trim();

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (!res.ok) {
        setFormError(data.error || "Failed to save.");
        return;
      }

      closeForm();
      fetchStores();
    } catch {
      setFormError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (storeId) => {
    if (!confirm("Delete this store's credentials? This cannot be undone.")) return;
    setDeletingId(storeId);
    try {
      await fetch(`/api/developer/shopify-stores/${storeId}`, { method: "DELETE" });
      fetchStores();
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (d) =>
    d
      ? new Date(d).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })
      : "—";

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <Spinner size="lg" color="success" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold sm:!pt-[30px] sm:!pr-[30px] sm:!pb-[20px] sm:!pl-[4px] p-1">
            Developer
          </h1>
          <p className="text-base text-gray-600 px-1 -mt-4">Manage Shopify store credentials per store owner.</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 bg-gray-900 text-white text-[12px] font-semibold px-4 py-2.5 rounded-lg hover:bg-gray-700 transition-colors"
        >
          <MdAdd className="text-md" /> Add Store
        </button>
      </div>

      {/* Security notice */}
      <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
        <MdLock className="text-amber-500 text-xl flex-shrink-0 mt-0.5" />
        <p className="text-md text-amber-800">
          <span className="font-semibold">Credentials are encrypted at rest.</span>
          Tokens are never shown in plaintext after saving — only a masked preview is displayed.
          This section is visible to developer accounts only.
        </p>
      </div>

      {/* Add / Edit Form */}
      {showForm && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            {editingId ? "Edit Store Credentials" : "Add New Store"}
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Base Store toggle */}
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="isBaseStore"
                checked={form.isBaseStore}
                onChange={(e) => setForm((f) => ({ ...f, isBaseStore: e.target.checked, userId: e.target.checked ? "" : f.userId }))}
                className="w-4 h-4 cursor-pointer"
              />
              <label htmlFor="isBaseStore" className="text-sm font-semibold text-gray-700 cursor-pointer">
                This is the base store (not tied to a specific owner)
              </label>
            </div>

            {/* Store owner dropdown — only if not base store */}
            {!form.isBaseStore && (
              <div>
                <label className="block text-md font-semibold text-gray-700 mb-1.5">
                  Assign to Store Owner
                </label>
                <select
                  value={form.userId}
                  onChange={(e) => setForm((f) => ({ ...f, userId: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-md bg-white focus:outline-none focus:ring-2 focus:ring-gray-400"
                >
                  <option value="">— Select store owner —</option>
                  {storeOwners.map((u) => (
                    <option key={u._id} value={u._id}>
                      {u.firstname} {u.lastname} ({u.storename || u.email})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Domain */}
            <div>
              <label className="block text-md font-semibold text-gray-700 mb-1.5">
                Store Domain
              </label>
              <input
                type="text"
                value={form.storeDomain}
                onChange={(e) => setForm((f) => ({ ...f, storeDomain: e.target.value }))}
                placeholder="yourstore.myshopify.com"
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-md focus:outline-none focus:ring-2 focus:ring-gray-400"
              />
            </div>

            {/* Access Token */}
            <div>
              <label className="block text-md font-semibold text-gray-700 mb-1.5">
                Admin API Access Token {editingId && <span className="text-gray-400 font-normal">(leave blank to keep existing)</span>}
              </label>
              <div className="relative">
                <input
                  type={showToken ? "text" : "password"}
                  value={form.accessToken}
                  onChange={(e) => setForm((f) => ({ ...f, accessToken: e.target.value }))}
                  placeholder={editingId ? "Leave blank to keep existing token" : "shpat_xxxxxxxxxxxx"}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-md pr-10 focus:outline-none focus:ring-2 focus:ring-gray-400"
                />
                <button
                  type="button"
                  onClick={() => setShowToken((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showToken ? <MdVisibilityOff /> : <MdVisibility />}
                </button>
              </div>
            </div>

            {/* API Secret */}
            <div>
              <label className="block text-md font-semibold text-gray-700 mb-1.5">
                API Secret Key {editingId && <span className="text-gray-400 font-normal">(leave blank to keep existing)</span>}
              </label>
              <div className="relative">
                <input
                  type={showSecret ? "text" : "password"}
                  value={form.apiSecret}
                  onChange={(e) => setForm((f) => ({ ...f, apiSecret: e.target.value }))}
                  placeholder={editingId ? "Leave blank to keep existing secret" : "shpss_xxxxxxxxxxxx"}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-md pr-10 focus:outline-none focus:ring-2 focus:ring-gray-400"
                />
                <button
                  type="button"
                  onClick={() => setShowSecret((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showSecret ? <MdVisibilityOff /> : <MdVisibility />}
                </button>
              </div>
            </div>

            {formError && (
              <p className="text-md text-red-500 font-medium">{formError}</p>
            )}

            <div className="flex gap-3 pt-1">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 bg-gray-900 text-white text-md font-semibold px-5 py-2.5 rounded-lg hover:bg-gray-700 disabled:opacity-50 transition-colors"
              >
                {saving ? <Spinner size="sm" color="white" /> : null}
                {saving ? "Saving..." : editingId ? "Save Changes" : "Add Store"}
              </button>
              <button
                type="button"
                onClick={closeForm}
                className="text-md font-semibold text-gray-600 border border-gray-300 px-5 py-2.5 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Stores Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-x-auto">
        {stores.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <FaStore className="text-4xl mb-3" />
            <p className="text-base font-medium">No store credentials added yet.</p>
            <p className="text-md mt-1">Click "Add Store" to configure the first store.</p>
          </div>
        ) : (
          <table className="w-full text-[15px]">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left px-4 py-3.5 font-bold text-gray-700">Store Domain</th>
                <th className="text-left px-4 py-3.5 font-bold text-gray-700">Store Owner</th>
                <th className="text-left px-4 py-3.5 font-bold text-gray-700">Access Token</th>
                <th className="text-left px-4 py-3.5 font-bold text-gray-700">API Secret</th>
                <th className="text-left px-4 py-3.5 font-bold text-gray-700">Status</th>
                <th className="text-left px-4 py-3.5 font-bold text-gray-700">Updated</th>
                <th className="text-left px-4 py-3.5 font-bold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {stores.map((store) => (
                <tr key={store._id} className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-3.5">
                    <div className="font-semibold text-gray-900">{store.storeDomain}</div>
                    {store.isBaseStore && (
                      <span className="inline-block mt-0.5 text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-full px-2 py-0.5">
                        Base Store
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3.5 text-gray-700">
                    {store.user ? (
                      <div>
                        <div className="font-medium">{store.user.firstname} {store.user.lastname}</div>
                        <div className="text-xs text-gray-400">{store.user.storename || store.user.email}</div>
                      </div>
                    ) : store.isBaseStore ? (
                      <span className="text-gray-400 text-md">— (Base Store)</span>
                    ) : (
                      <span className="text-gray-400 text-md">Unassigned</span>
                    )}
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="font-mono text-md text-gray-600 bg-gray-100 px-2 py-0.5 rounded">
                      {store.accessTokenMasked}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="font-mono text-md text-gray-600 bg-gray-100 px-2 py-0.5 rounded">
                      {store.apiSecretMasked}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    {store.isActive ? (
                      <span className="inline-flex items-center gap-1 text-md font-semibold text-green-700">
                        <MdCheckCircle /> Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-md font-semibold text-red-500">
                        <MdCancel /> Inactive
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3.5 text-gray-500 text-md whitespace-nowrap">
                    {formatDate(store.updatedAt)}
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openEdit(store)}
                        className="flex items-center gap-1 text-md font-medium text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg px-2.5 py-1.5 transition-colors"
                      >
                        <MdEdit /> Edit
                      </button>
                      <button
                        onClick={() => handleDelete(store._id)}
                        disabled={deletingId === store._id}
                        className="flex items-center gap-1 text-md font-medium text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg px-2.5 py-1.5 transition-colors disabled:opacity-50"
                      >
                        {deletingId === store._id ? <Spinner size="sm" /> : <MdDelete />}
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default DeveloperPage;
