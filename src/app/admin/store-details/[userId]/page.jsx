"use client";
import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Spinner } from "@heroui/react";
import { FaArrowLeft, FaInstagram, FaFacebook, FaGlobe, FaStore, FaShopify } from "react-icons/fa";
import { MdCheckCircle, MdCancel, MdWarning, MdToggleOn, MdToggleOff } from "react-icons/md";

const PLAN_COLORS = {
  Pro: "bg-indigo-100 text-indigo-700",
  Business: "bg-amber-100 text-amber-700",
  free: "bg-gray-100 text-gray-600",
  Free: "bg-gray-100 text-gray-600",
};

const StoreDetailPage = () => {
  const { userId } = useParams();
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [shopifyCreated, setShopifyCreated] = useState(false);
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const res = await fetch(`/api/admin/store-details/${userId}`);
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Failed to load");
        setData(json);
        setShopifyCreated(json.user.shopifyStoreCreated || false);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    if (userId) fetchDetails();
  }, [userId]);

  const handleToggleShopifyCreated = async () => {
    const newValue = !shopifyCreated;
    setToggling(true);
    try {
      const res = await fetch(`/api/admin/store-details/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shopifyStoreCreated: newValue }),
      });
      if (res.ok) setShopifyCreated(newValue);
    } catch (err) {
      console.error("Failed to update shopify status:", err);
    } finally {
      setToggling(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <Spinner size="lg" color="success" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <p className="text-red-500 text-lg">{error || "Store not found"}</p>
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 font-medium"
        >
          <FaArrowLeft /> Go back
        </button>
      </div>
    );
  }

  const { user, productStats } = data;
  const plan = user.subscriptionType || "free";
  const initials =
    `${user.firstname?.[0] || ""}${user.lastname?.[0] || ""}`.toUpperCase() || "?";

  const shopifyStatus = () => {
    if (productStats.shopifyConnected) {
      return {
        icon: <MdCheckCircle className="text-green-500 text-xl" />,
        label: "Connected",
        sub: `${productStats.shopifySynced} of ${productStats.total} products synced to Shopify`,
        badge: "bg-green-50 border-green-200 text-green-700",
      };
    }
    if (productStats.total > 0) {
      return {
        icon: <MdWarning className="text-amber-500 text-xl" />,
        label: "Not Synced",
        sub: `${productStats.total} products exist in REE but none are on Shopify yet`,
        badge: "bg-amber-50 border-amber-200 text-amber-700",
      };
    }
    return {
      icon: <MdCancel className="text-gray-400 text-xl" />,
      label: "Not Set Up",
      sub: "No products added yet. Shopify sync happens when products are added on a Pro/Business plan.",
      badge: "bg-gray-50 border-gray-200 text-gray-600",
    };
  };

  const shopify = shopifyStatus();
  const branding = user.branding || {};
  const hasBranding =
    branding.logoUrl ||
    branding.storeDescription ||
    branding.primaryColor !== "#000000" ||
    branding.socialLinks?.instagram ||
    branding.socialLinks?.facebook ||
    branding.socialLinks?.website;

  const formatDate = (d) =>
    d
      ? new Date(d).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })
      : "—";

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors font-medium text-md"
        >
          <FaArrowLeft /> Back
        </button>
        <h1 className="text-3xl font-bold text-gray-900">Store Details</h1>
      </div>

      {/* Profile Card */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-start gap-5">
          {/* Avatar */}
          <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xl flex-shrink-0 overflow-hidden">
            {user.profileImage ? (
              <img src={user.profileImage} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              initials
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h2 className="text-2xl font-bold text-gray-900">
                {user.firstname} {user.lastname}
              </h2>
              <span
                className={`text-sm font-semibold px-2.5 py-0.5 rounded-full ${
                  PLAN_COLORS[plan] || "bg-gray-100 text-gray-600"
                }`}
              >
                {plan === "free" ? "Free Plan" : `${plan} Plan`}
              </span>
              <span
                className={`text-sm font-semibold px-2.5 py-0.5 rounded-full ${
                  user.isActive
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-600"
                }`}
              >
                {user.isActive ? "Active" : "Inactive"}
              </span>
            </div>

            {user.storename && (
              <div className="flex items-center gap-1.5 text-gray-500 text-md mb-3">
                <FaStore className="text-gray-400" />
                {user.storename}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1.5 text-[12px]">
              <div>
                <span className="font-semibold text-gray-600">Email: </span>
                <span className="text-gray-800">{user.email}</span>
              </div>
              {user.phone && (
                <div>
                  <span className="font-semibold text-gray-600">Phone: </span>
                  <span className="text-gray-800">{user.phone}</span>
                </div>
              )}
              {(user.country || user.city) && (
                <div>
                  <span className="font-semibold text-gray-600">Location: </span>
                  <span className="text-gray-800">
                    {[user.city, user.country].filter(Boolean).join(", ")}
                  </span>
                </div>
              )}
              {user.businessNumber && (
                <div>
                  <span className="font-semibold text-gray-600">CVR/VAT: </span>
                  <span className="text-gray-800">{user.businessNumber}</span>
                </div>
              )}
              <div>
                <span className="font-semibold text-gray-600">Joined: </span>
                <span className="text-gray-800">{formatDate(user.createdAt)}</span>
              </div>
              {plan !== "free" && user.subscriptionEnd && (
                <div>
                  <span className="font-semibold text-gray-600">Plan expires: </span>
                  <span className="text-gray-800">{formatDate(user.subscriptionEnd)}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Subscription Card */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h3 className="text-[12px] font-bold text-gray-900 mb-4">Subscription</h3>
        <div className="flex flex-wrap items-center gap-4">
          <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border ${
            plan === "Business"
              ? "bg-amber-50 border-amber-200"
              : plan === "Pro"
              ? "bg-indigo-50 border-indigo-200"
              : "bg-gray-50 border-gray-200"
          }`}>
            <span className={`text-2xl font-bold ${
              plan === "Business" ? "text-amber-700" : plan === "Pro" ? "text-indigo-700" : "text-gray-600"
            }`}>
              {plan === "free" ? "Free" : plan}
            </span>
            <span className={`text-md font-medium ${
              plan === "Business" ? "text-amber-600" : plan === "Pro" ? "text-indigo-500" : "text-gray-500"
            }`}>
              Plan
            </span>
          </div>
          <div className="text-[12px] text-gray-600 space-y-1">
            {user.subscriptionStart && (
              <div><span className="font-semibold">Started:</span> {formatDate(user.subscriptionStart)}</div>
            )}
            {user.subscriptionEnd && plan !== "free" && (
              <div><span className="font-semibold">Expires:</span> {formatDate(user.subscriptionEnd)}</div>
            )}
            {plan === "free" && (
              <div className="text-gray-400">No active paid plan</div>
            )}
          </div>
        </div>
      </div>

      {/* Shopify Store Setup Card */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h3 className="text-[12px] font-bold text-gray-900 mb-1">Shopify Store Status</h3>
        <p className="text-[12px] text-gray-500 mb-4">Track the two-phase setup process for this store owner.</p>

        {/* Phase 1 — Developer Setup */}
        <div className={`rounded-xl border p-4 mb-3 ${shopifyCreated ? "bg-green-50 border-green-200" : "bg-gray-50 border-gray-200"}`}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="mt-0.5">
                {shopifyCreated
                  ? <MdCheckCircle className="text-green-500 text-xl" />
                  : <MdCancel className="text-gray-400 text-xl" />}
              </div>
              <div>
                <p className="font-semibold text-md text-gray-900">
                  Phase 1 — Developer Setup
                  {shopifyCreated
                    ? <span className="ml-2 text-[12px] font-semibold text-green-700 bg-green-100 px-2 py-0.5 rounded-full">Done</span>
                    : <span className="ml-2 text-[12px] font-semibold text-gray-500 bg-gray-200 px-2 py-0.5 rounded-full">Pending</span>}
                </p>
                <p className="text-[12px] text-gray-500 mt-0.5">
                  A dedicated Shopify store has been created and connected to REE for this store owner.
                </p>
              </div>
            </div>
            <button
              onClick={handleToggleShopifyCreated}
              disabled={toggling}
              className={`flex-shrink-0 flex items-center gap-1.5 text-[12px] font-semibold px-3 py-1.5 rounded-lg border transition-colors ${
                shopifyCreated
                  ? "bg-white border-red-200 text-red-600 hover:bg-red-50"
                  : "bg-white border-green-200 text-green-700 hover:bg-green-50"
              } disabled:opacity-50`}
            >
              {toggling ? <Spinner size="sm" /> : shopifyCreated
                ? <><MdToggleOff className="text-base" /> Mark Undone</>
                : <><MdToggleOn className="text-base" /> Mark Done</>}
            </button>
          </div>
        </div>

        {/* Phase 2 — Product Sync */}
        <div className={`rounded-xl border p-4 ${shopify.badge}`}>
          <div className="flex items-start gap-3">
            <div className="mt-0.5">{shopify.icon}</div>
            <div>
              <p className="font-semibold text-md">
                Phase 2 — Product Sync
                <span className="ml-2 text-[12px] font-normal opacity-80">({shopify.label})</span>
              </p>
              <p className="text-[12px] mt-0.5 opacity-80">{shopify.sub}</p>
            </div>
          </div>
        </div>

        {/* Product breakdown */}
        {productStats.total > 0 && (
          <div className="mt-4 grid grid-cols-3 gap-3">
            <div className="text-center bg-gray-50 rounded-lg py-3">
              <p className="text-2xl font-bold text-gray-900">{productStats.total}</p>
              <p className="text-md text-gray-500 mt-0.5">Total Products</p>
            </div>
            <div className="text-center bg-green-50 rounded-lg py-3">
              <p className="text-2xl font-bold text-green-700">{productStats.shopifySynced}</p>
              <p className="text-md text-gray-500 mt-0.5">Synced to Shopify</p>
            </div>
            <div className="text-center bg-red-50 rounded-lg py-3">
              <p className="text-2xl font-bold text-red-600">{productStats.sold}</p>
              <p className="text-md text-gray-500 mt-0.5">Sold</p>
            </div>
          </div>
        )}
      </div>

      {/* Branding Card */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[12px] font-bold text-gray-900">Store Branding</h3>
          {hasBranding ? (
            <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-green-700 bg-green-50 border border-green-200 rounded-full px-2.5 py-1">
              <MdCheckCircle className="text-green-500" /> Configured
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-500 bg-gray-50 border border-gray-200 rounded-full px-2.5 py-1">
              <MdWarning className="text-amber-400" /> Not configured yet
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Logo */}
          <div>
            <p className="text-md font-semibold text-gray-600 mb-2">Store Logo</p>
            {branding.logoUrl ? (
              <img
                src={branding.logoUrl}
                alt="Store logo"
                className="w-24 h-24 object-contain rounded-lg border border-gray-200 bg-gray-50 p-2"
              />
            ) : (
              <div className="w-24 h-24 rounded-lg border-2 border-dashed border-gray-200 bg-gray-50 flex items-center justify-center text-gray-400 text-sm">
                No logo
              </div>
            )}
          </div>

          {/* Brand Colors */}
          <div>
            <p className="text-[12px] font-semibold text-gray-600 mb-2">Brand Colors</p>
            <div className="space-y-2">
              {[
                { label: "Primary", value: branding.primaryColor || "#000000" },
                { label: "Secondary", value: branding.secondaryColor || "#ffffff" },
                { label: "Accent", value: branding.accentColor || "#ff6b6b" },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center gap-2.5">
                  <div
                    className="w-7 h-7 rounded-md border border-gray-200 flex-shrink-0"
                    style={{ backgroundColor: value }}
                  />
                  <span className="text-md text-gray-600">{label}</span>
                  <span className="text-md text-gray-400 font-mono">{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Store Description */}
          {branding.storeDescription && (
            <div className="sm:col-span-2">
              <p className="text-md font-semibold text-gray-600 mb-1.5">Store Description</p>
              <p className="text-md text-gray-700 bg-gray-50 rounded-lg px-3 py-2 border border-gray-100">
                {branding.storeDescription}
              </p>
            </div>
          )}

          {/* Social Links */}
          <div className="sm:col-span-2">
            <p className="text-md font-semibold text-gray-600 mb-2">Social Links</p>
            <div className="flex flex-wrap gap-3">
              {branding.socialLinks?.instagram ? (
                <a
                  href={branding.socialLinks.instagram}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-md text-pink-600 bg-pink-50 border border-pink-200 rounded-lg px-3 py-1.5 hover:bg-pink-100 transition-colors"
                >
                  <FaInstagram /> Instagram
                </a>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-md text-gray-400 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5">
                  <FaInstagram /> No Instagram
                </span>
              )}
              {branding.socialLinks?.facebook ? (
                <a
                  href={branding.socialLinks.facebook}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-md text-blue-600 bg-blue-50 border border-blue-200 rounded-lg px-3 py-1.5 hover:bg-blue-100 transition-colors"
                >
                  <FaFacebook /> Facebook
                </a>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-md text-gray-400 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5">
                  <FaFacebook /> No Facebook
                </span>
              )}
              {branding.socialLinks?.website ? (
                <a
                  href={branding.socialLinks.website}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-md text-indigo-600 bg-indigo-50 border border-indigo-200 rounded-lg px-3 py-1.5 hover:bg-indigo-100 transition-colors"
                >
                  <FaGlobe /> Website
                </a>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-md text-gray-400 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5">
                  <FaGlobe /> No Website
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StoreDetailPage;
