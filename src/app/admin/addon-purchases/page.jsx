"use client";
import React, { useEffect, useState } from "react";
import { Spinner } from "@heroui/react";

const formatCurrency = (amountInOre, currency = "DKK") => {
  return `${(amountInOre / 100).toFixed(2)} ${currency}`;
};

const ADDON_LABELS = {
  complete_adds: "Complete Adds",
  instagram: "Instagram",
  barcode_label: "Barcode Label",
  webstore: "Webstore",
};

const AddOnPurchasesPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  const fetchData = async () => {
    try {
      const params = new URLSearchParams();
      if (filter !== "all") params.set("status", filter);
      const res = await fetch(`/api/admin/addon-purchases?${params}`);
      const json = await res.json();
      setData(json);
    } catch (error) {
      console.error("Failed to fetch add-on purchases:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchData();
  }, [filter]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <Spinner size="lg" color="success" />
      </div>
    );
  }

  const { purchases = [], totals = {} } = data || {};

  return (
    <div className="space-y-6">
      <h1 className="text-4xl font-bold sm:!pt-[30px] sm:!pr-[30px] sm:!pb-[20px] sm:!pl-[4px] p-1">
        Add-On Purchases
      </h1>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-5">
          <div className="text-[12px] text-gray-500 mb-1">Total Purchases</div>
          <div className="text-2xl font-bold text-gray-800">
            {totals.totalPurchases || 0}
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5">
          <div className="text-[12px] text-gray-500 mb-1">Total Revenue</div>
          <div className="text-2xl font-bold text-green-600">
            {formatCurrency(totals.totalRevenue || 0)}
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5">
          <div className="text-[12px] text-gray-500 mb-1">Used (Linked to Product)</div>
          <div className="text-2xl font-bold text-blue-600">
            {totals.usedCount || 0}
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5">
          <div className="text-[12px] text-gray-500 mb-1">Unused (Pending Use)</div>
          <div className="text-2xl font-bold text-amber-600">
            {totals.unusedCount || 0}
          </div>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {[
          { key: "all", label: "All" },
          { key: "paid", label: "Paid" },
          { key: "pending", label: "Pending" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`px-4 py-2 rounded-lg text-[15px] font-medium transition-all ${
              filter === tab.key
                ? "bg-black text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Purchase table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {purchases.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No add-on purchases found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[12px]">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Store</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Add-Ons</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600">Amount</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Status</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Product</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Paid At</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Created</th>
                </tr>
              </thead>
              <tbody>
                {purchases.map((p) => (
                  <tr key={p._id} className="border-b hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-800">
                        {p.userId?.storename || p.userId?.firstname || "N/A"}
                      </div>
                      <div className="text-xs text-gray-400">{p.userId?.email}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {p.addOns?.map((a) => (
                          <span
                            key={a}
                            className="inline-block px-2 py-0.5 rounded-full text-[11px] font-medium bg-purple-100 text-purple-700"
                          >
                            {ADDON_LABELS[a] || a}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-medium">
                      {formatCurrency(p.totalAmount || 0)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block px-2 py-1 rounded-full text-[11px] font-medium ${
                          p.status === "paid"
                            ? "bg-green-100 text-green-700"
                            : p.status === "pending"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {p.productId ? (
                        <span className="text-blue-600 font-medium">
                          {p.productId.title || p.productId.sku || "Linked"}
                        </span>
                      ) : (
                        <span className="text-gray-400">Not yet used</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {p.paidAt
                        ? new Date(p.paidAt).toLocaleDateString("en-GB", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })
                        : "-"}
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {new Date(p.createdAt).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Info note */}
      <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 text-md text-purple-800">
        <strong>Note:</strong> Add-on purchases allow users without a subscription to upload
        products by paying 10 DKK per feature. Each purchase covers one product upload with the
        selected features (Complete Adds, Instagram, Barcode Label, Webstore).
      </div>
    </div>
  );
};

export default AddOnPurchasesPage;
