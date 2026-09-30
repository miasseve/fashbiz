"use client";
import React, { useEffect, useState, useMemo } from "react";
import { Spinner } from "@heroui/react";
import {
  MdLock,
  MdCheckCircle,
  MdCancel,
  MdSchedule,
  MdSend,
  MdRefresh,
} from "react-icons/md";
import { FaShopify } from "react-icons/fa";

const EMPTY_FORM = {
  userId: "",
  shopDomain: "",
  email: "",
};

const STATUS_STYLES = {
  connected: {
    label: "Connected",
    icon: <MdCheckCircle />,
    className: "text-green-700",
  },
  pending: {
    label: "Pending",
    icon: <MdSchedule />,
    className: "text-amber-600",
  },
  failed: {
    label: "Failed",
    icon: <MdCancel />,
    className: "text-red-500",
  },
};

const ShopifyConnectionsPage = () => {
  const [connections, setConnections] = useState([]);
  const [storeOwners, setStoreOwners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY_FORM);
  const [ownerSearch, setOwnerSearch] = useState("");
  const [sending, setSending] = useState(false);
  const [resendingId, setResendingId] = useState(null);
  const [formError, setFormError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const fetchConnections = async () => {
    try {
      const res = await fetch("/api/admin/shopify-connections");
      const data = await res.json();
      setConnections(data.connections || []);
    } catch {
      /* silent — the table just stays empty */
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
    fetchConnections();
    fetchStoreOwners();
  }, []);

  // Search by store name, owner name or email.
  const filteredOwners = useMemo(() => {
    const term = ownerSearch.trim().toLowerCase();
    if (!term) return storeOwners;
    return storeOwners.filter((u) =>
      [u.storename, u.firstname, u.lastname, u.email]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(term)
    );
  }, [storeOwners, ownerSearch]);

  const selectedOwner = storeOwners.find((u) => u._id === form.userId) || null;

  const handleSelectOwner = (userId) => {
    const owner = storeOwners.find((u) => u._id === userId);
    setForm((f) => ({
      ...f,
      userId,
      // Prefill the registered login email, still editable below.
      email: owner?.email || "",
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    setSuccessMessage("");

    if (!form.userId) {
      setFormError("Please choose a store owner.");
      return;
    }
    if (!form.shopDomain.trim()) {
      setFormError("Please enter the Shopify store domain.");
      return;
    }

    setSending(true);
    try {
      const res = await fetch("/api/admin/shopify-connections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: form.userId,
          shopDomain: form.shopDomain.trim(),
          email: form.email.trim(),
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setFormError(data.error || "Failed to send the connection link.");
        return;
      }

      setSuccessMessage(data.message || "Connection link sent.");
      setForm(EMPTY_FORM);
      setOwnerSearch("");
      fetchConnections();
    } catch {
      setFormError("Network error. Please try again.");
    } finally {
      setSending(false);
    }
  };

  const handleResend = async (connection) => {
    const target = connection.recipientEmail || connection.userEmail;
    if (!connection.userId) {
      setFormError("This connection has no store owner attached, so no link can be sent.");
      return;
    }
    if (!confirm(`Send a new connection link for ${connection.shopDomain} to ${target}?`)) {
      return;
    }

    setResendingId(connection.id);
    setFormError("");
    setSuccessMessage("");
    try {
      const res = await fetch("/api/admin/shopify-connections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: connection.userId,
          shopDomain: connection.shopDomain,
          email: target,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setFormError(data.error || "Failed to resend the connection link.");
        return;
      }

      setSuccessMessage(data.message || "Connection link resent.");
      fetchConnections();
    } catch {
      setFormError("Network error. Please try again.");
    } finally {
      setResendingId(null);
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
      <div>
        <h1 className="text-4xl font-bold sm:!pt-[30px] sm:!pr-[30px] sm:!pb-[20px] sm:!pl-[4px] p-1">
          Shopify Connections
        </h1>
        <p className="text-base text-gray-600 px-1 -mt-4">
          Send a store owner a link to connect their own Shopify store.
        </p>
      </div>

      {/* Security notice */}
      <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
        <MdLock className="text-amber-500 text-xl flex-shrink-0 mt-0.5" />
        <p className="text-md text-amber-800">
          <span className="font-semibold">The store owner approves the connection themselves.</span>{" "}
          They authorize it on Shopify — no login details are shared with leStores, and access tokens are
          encrypted and never displayed here. Links expire after 7 days and can only be used once.
        </p>
      </div>

      {/* Send connection link */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h3 className="text-2xl font-bold text-gray-900 mb-4">Send a connection link</h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Store owner search */}
          <div>
            <label className="block text-md font-semibold text-gray-700 mb-1.5">
              Find store owner
            </label>
            <input
              type="text"
              value={ownerSearch}
              onChange={(e) => setOwnerSearch(e.target.value)}
              placeholder="Search by store name, name or email"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-md focus:outline-none focus:ring-2 focus:ring-gray-400"
            />
          </div>

          {/* Store owner select */}
          <div>
            <label className="block text-md font-semibold text-gray-700 mb-1.5">
              Store owner
            </label>
            <select
              value={form.userId}
              onChange={(e) => handleSelectOwner(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-md bg-white focus:outline-none focus:ring-2 focus:ring-gray-400"
            >
              <option value="">— Select store owner —</option>
              {filteredOwners.map((u) => (
                <option key={u._id} value={u._id}>
                  {u.storename || `${u.firstname || ""} ${u.lastname || ""}`.trim()} ({u.email})
                </option>
              ))}
            </select>
            {ownerSearch && filteredOwners.length === 0 && (
              <p className="text-md text-gray-500 mt-1.5">
                No store owners match &ldquo;{ownerSearch}&rdquo;.
              </p>
            )}
          </div>

          {/* Shop domain */}
          <div>
            <label className="block text-md font-semibold text-gray-700 mb-1.5">
              Shopify store domain
            </label>
            <input
              type="text"
              value={form.shopDomain}
              onChange={(e) => setForm((f) => ({ ...f, shopDomain: e.target.value }))}
              placeholder="their-store.myshopify.com"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-md focus:outline-none focus:ring-2 focus:ring-gray-400"
            />
          </div>

          {/* Recipient email */}
          <div>
            <label className="block text-md font-semibold text-gray-700 mb-1.5">
              Send link to{" "}
              <span className="text-gray-400 font-normal">
                (prefilled with their registered email)
              </span>
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              placeholder={selectedOwner?.email || "owner@example.com"}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-md focus:outline-none focus:ring-2 focus:ring-gray-400"
            />
          </div>

          {formError && <p className="text-md text-red-500 font-medium">{formError}</p>}
          {successMessage && (
            <p className="text-md text-green-700 font-medium">{successMessage}</p>
          )}

          <div className="flex gap-3 pt-1">
            <button
              type="submit"
              disabled={sending}
              className="flex items-center gap-2 bg-gray-900 text-white text-md font-semibold px-5 py-2.5 rounded-lg hover:bg-gray-700 disabled:opacity-50 transition-colors"
            >
              {sending ? <Spinner size="sm" color="white" /> : <MdSend />}
              {sending ? "Sending..." : "Send connection link"}
            </button>
          </div>
        </form>
      </div>

      {/* Connections table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-x-auto">
        {connections.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <FaShopify className="text-4xl mb-3" />
            <p className="text-base font-medium">No Shopify connections yet.</p>
            <p className="text-md mt-1">Send a connection link to get started.</p>
          </div>
        ) : (
          <table className="w-full text-[15px]">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left px-4 py-3.5 font-bold text-gray-700">Shop Domain</th>
                <th className="text-left px-4 py-3.5 font-bold text-gray-700">Store</th>
                <th className="text-left px-4 py-3.5 font-bold text-gray-700">Status</th>
                <th className="text-left px-4 py-3.5 font-bold text-gray-700">Connected</th>
                <th className="text-left px-4 py-3.5 font-bold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {connections.map((c) => {
                const status = STATUS_STYLES[c.status] || STATUS_STYLES.pending;
                return (
                  <tr
                    key={c.id}
                    className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors"
                  >
                    <td className="px-4 py-3.5">
                      <div className="font-semibold text-gray-900">{c.shopDomain}</div>
                      {c.connectedVia === "manual" && (
                        <span className="inline-block mt-0.5 text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-full px-2 py-0.5">
                          Added manually
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-gray-700">
                      {c.storeName ? (
                        <div>
                          <div className="font-medium">{c.storeName}</div>
                          <div className="text-xs text-gray-400">{c.userEmail}</div>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-md">Unassigned</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-flex items-center gap-1 text-md font-semibold ${status.className}`}
                      >
                        {status.icon} {status.label}
                      </span>
                      {c.status === "pending" && c.linkExpiresAt && (
                        <div className="text-xs text-gray-400 mt-0.5">
                          Link expires {formatDate(c.linkExpiresAt)}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-gray-500 text-md whitespace-nowrap">
                      {formatDate(c.connectedAt)}
                    </td>
                    <td className="px-4 py-3.5">
                      <button
                        onClick={() => handleResend(c)}
                        disabled={resendingId === c.id || !c.userId}
                        className="flex items-center gap-1 text-md font-medium text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg px-2.5 py-1.5 transition-colors disabled:opacity-50"
                      >
                        {resendingId === c.id ? <Spinner size="sm" /> : <MdRefresh />}
                        Resend link
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default ShopifyConnectionsPage;
