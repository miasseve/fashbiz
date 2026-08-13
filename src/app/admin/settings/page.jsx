"use client";
import React, { useEffect, useState } from "react";
import { Spinner } from "@heroui/react";
import { MdVisibility, MdVisibilityOff, MdCheckCircle, MdCancel } from "react-icons/md";
import { toast } from "react-toastify";
import {
  setShopifyStorefrontPassword,
  hasShopifyStorefrontPassword,
} from "@/actions/siteSettingsActions";

const SettingsPage = () => {
  // Shopify storefront password — Shopify's launch/coming-soon password
  // wall. Stored here so Ree can auto-append ?password=... to every
  // storefront link it generates, instead of needing to disable the wall
  // in Shopify itself.
  const [passwordSet, setPasswordSet] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchStatus = async () => {
    try {
      const res = await hasShopifyStorefrontPassword();
      if (res.status === 200) setPasswordSet(res.isSet);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleSave = async () => {
    if (!passwordInput.trim()) return;
    setSaving(true);
    try {
      const res = await setShopifyStorefrontPassword(passwordInput);
      if (res.status === 200) {
        toast.success("Storefront password saved");
        setPasswordInput("");
        setPasswordSet(true);
      } else {
        toast.error(res.error || "Failed to save");
      }
    } catch {
      toast.error("Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleClear = async () => {
    if (!confirm("Remove the stored storefront password? Ree-generated links will stop bypassing the Shopify password wall.")) return;
    setSaving(true);
    try {
      const res = await setShopifyStorefrontPassword("");
      if (res.status === 200) {
        toast.success("Storefront password removed");
        setPasswordSet(false);
      } else {
        toast.error(res.error || "Failed to remove");
      }
    } catch {
      toast.error("Failed to remove");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold sm:!pt-[30px] sm:!pr-[30px] sm:!pb-[20px] sm:!pl-[4px] p-1">
          Settings
        </h1>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h3 className="text-2xl font-bold text-gray-900 mb-1">Shopify Storefront Password</h3>
        <p className="text-md text-gray-600 mb-4">
          If the Shopify storefront has a password wall enabled (Shopify's "coming soon" screen),
          enter it here — every webstore/product link Ree generates will automatically include it,
          so shared links open straight to the product instead of the password prompt.
        </p>

        {loading ? (
          <Spinner size="sm" />
        ) : (
          <>
            <div className="flex items-center gap-2 mb-4">
              {passwordSet ? (
                <span className="inline-flex items-center gap-1 text-md font-semibold text-green-700">
                  <MdCheckCircle /> Password is set
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-md font-semibold text-gray-400">
                  <MdCancel /> No password set
                </span>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
              <div className="flex-1">
                <label className="block text-md font-semibold text-gray-700 mb-1.5">
                  {passwordSet ? "Update password" : "Storefront password"}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    placeholder="Enter the Shopify storefront password"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-md pr-10 focus:outline-none focus:ring-2 focus:ring-gray-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <MdVisibilityOff /> : <MdVisibility />}
                  </button>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving || !passwordInput.trim()}
                  className="flex items-center gap-2 bg-gray-900 text-white text-md font-semibold px-5 py-2.5 rounded-lg hover:bg-gray-700 disabled:opacity-50 transition-colors"
                >
                  {saving ? <Spinner size="sm" color="white" /> : null}
                  Save
                </button>
                {passwordSet && (
                  <button
                    type="button"
                    onClick={handleClear}
                    disabled={saving}
                    className="text-md font-semibold text-red-600 border border-red-200 px-5 py-2.5 rounded-lg hover:bg-red-50 disabled:opacity-50 transition-colors"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default SettingsPage;
