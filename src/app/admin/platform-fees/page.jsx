"use client";
import React, { useEffect, useState } from "react";
import { Spinner } from "@heroui/react";
import { toast } from "react-toastify";

const formatCurrency = (amountInOre, currency = "DKK") => {
  return `${(amountInOre / 100).toFixed(2)} ${currency}`;
};

const PlatformFeesPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // "all", "unpaid", "paid"
  const [markingPaid, setMarkingPaid] = useState(null);

  const fetchFees = async () => {
    try {
      const params = new URLSearchParams();
      if (filter === "unpaid") params.set("paid", "false");
      if (filter === "paid") params.set("paid", "true");

      const res = await fetch(`/api/admin/platform-fees?${params}`);
      const json = await res.json();
      setData(json);
    } catch (error) {
      console.error("Failed to fetch platform fees:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchFees();
  }, [filter]);

  const handleMarkPaid = async (userId, storename) => {
    if (!confirm(`Mark all unpaid fees for "${storename}" as paid?`)) return;

    setMarkingPaid(userId);
    try {
      const res = await fetch("/api/admin/platform-fees", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success(`Marked ${json.updated} transaction(s) as paid for ${storename}`);
        fetchFees();
      } else {
        toast.error(json.error || "Failed to update");
      }
    } catch (error) {
      toast.error("Failed to mark as paid");
    } finally {
      setMarkingPaid(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <Spinner size="lg" color="success" />
      </div>
    );
  }

  const { stores = [], totals = {} } = data || {};

  return (
    <div className="space-y-6">
      <h1 className="text-4xl font-bold sm:!pt-[30px] sm:!pr-[30px] sm:!pb-[20px] sm:!pl-[4px] p-1">
        Platform Fees
      </h1>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-5">
          <div className="text-sm text-gray-500 mb-1">Total Sales</div>
          <div className="text-2xl font-bold text-gray-800">
            {formatCurrency(totals.totalSales || 0)}
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5">
          <div className="text-sm text-gray-500 mb-1">Total Fees Earned</div>
          <div className="text-2xl font-bold text-green-600">
            {formatCurrency(totals.totalFees || 0)}
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5">
          <div className="text-sm text-gray-500 mb-1">Fees Collected</div>
          <div className="text-2xl font-bold text-blue-600">
            {formatCurrency(totals.paidFees || 0)}
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5">
          <div className="text-sm text-gray-500 mb-1">Fees Outstanding</div>
          <div className="text-2xl font-bold text-red-600">
            {formatCurrency(totals.unpaidFees || 0)}
          </div>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {[
          { key: "all", label: "All Stores" },
          { key: "unpaid", label: "Unpaid" },
          { key: "paid", label: "Paid" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              filter === tab.key
                ? "bg-black text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Store fee table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {stores.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No transactions with platform fees found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Store</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Plan</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600">Transactions</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600">Total Sales</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600">Total Fees</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600">Collected</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600">Outstanding</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Last Sale</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {stores.map((store) => (
                  <tr key={store.userId} className="border-b hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-800">{store.storename}</div>
                      <div className="text-xs text-gray-400">{store.email}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                          store.subscriptionType?.includes("Pro")
                            ? "bg-purple-100 text-purple-700"
                            : store.subscriptionType?.includes("Basic")
                            ? "bg-blue-100 text-blue-700"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {store.subscriptionType || "N/A"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-medium">{store.transactionCount}</td>
                    <td className="px-4 py-3 text-right">{formatCurrency(store.totalSales)}</td>
                    <td className="px-4 py-3 text-right font-medium text-green-600">
                      {formatCurrency(store.totalFees)}
                    </td>
                    <td className="px-4 py-3 text-right text-blue-600">
                      {formatCurrency(store.paidFees)}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-red-600">
                      {store.unpaidFees > 0 ? formatCurrency(store.unpaidFees) : "-"}
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {store.lastTransaction
                        ? new Date(store.lastTransaction).toLocaleDateString("en-GB", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })
                        : "-"}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {store.unpaidFees > 0 && (
                        <button
                          onClick={() => handleMarkPaid(store.userId, store.storename)}
                          disabled={markingPaid === store.userId}
                          className="px-3 py-1.5 bg-green-600 text-white text-xs font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 transition-all"
                        >
                          {markingPaid === store.userId ? "Marking..." : "Mark Paid"}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Info note */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
        <strong>Note:</strong> Platform fees are calculated on Shopify webstore transactions.
        Webstore Basic stores pay 4% per transaction, Webstore Pro stores pay 2% per transaction.
        Use &quot;Mark Paid&quot; after collecting fees from a store owner.
      </div>
    </div>
  );
};

export default PlatformFeesPage;
