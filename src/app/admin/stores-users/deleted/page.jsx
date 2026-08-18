"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Spinner } from "@heroui/react";
import { toast } from "react-toastify";
import { FaUndo, FaArrowLeft } from "react-icons/fa";

const DeletedStoresPage = () => {
  const [backups, setBackups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [restoreTarget, setRestoreTarget] = useState(null);
  const [restoring, setRestoring] = useState(false);

  const fetchBackups = async () => {
    try {
      const res = await fetch("/api/admin/stores/deleted");
      const data = await res.json();
      setBackups(data.backups || []);
    } catch (error) {
      console.error("Failed to fetch deleted stores:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBackups();
  }, []);

  const handleConfirmRestore = async () => {
    if (!restoreTarget) return;
    setRestoring(true);
    try {
      const res = await fetch(`/api/admin/stores/deleted/${restoreTarget._id}/restore`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to restore.");
        return;
      }
      toast.success(data.message || "Restored.");
      setRestoreTarget(null);
      fetchBackups();
    } catch (err) {
      console.error("Restore request failed:", err);
      toast.error("Something went wrong while restoring.");
    } finally {
      setRestoring(false);
    }
  };

  const getRoleBadge = (role) => {
    const colors = {
      store: "bg-green-100 text-green-700",
      brand: "bg-purple-100 text-purple-700",
      consignor: "bg-blue-100 text-blue-700",
    };
    return colors[role] || "bg-gray-100 text-gray-700";
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <Spinner size="lg" color="success" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/admin/stores-users"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 text-md font-semibold mb-2"
          >
            <FaArrowLeft className="text-sm" />
            Back to Stores & Users
          </Link>
          <h1 className="text-4xl font-bold">Deleted Stores</h1>
          <p className="text-gray-500 mt-1">
            A backup is saved automatically before any store, brand, or consignor account
            is deleted. Restore brings back the account and everything linked to it —
            products, transactions, subscriptions, and more — exactly as it was.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
        {backups.length === 0 ? (
          <p className="text-gray-500 text-center py-12">Nothing deleted yet.</p>
        ) : (
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left px-4 py-3.5 font-bold text-gray-700">Name</th>
                <th className="text-left px-4 py-3.5 font-bold text-gray-700">Role</th>
                <th className="text-left px-4 py-3.5 font-bold text-gray-700">Email</th>
                <th className="text-left px-4 py-3.5 font-bold text-gray-700">CVR Number</th>
                <th className="text-center px-4 py-3.5 font-bold text-gray-700">Products</th>
                <th className="text-left px-4 py-3.5 font-bold text-gray-700">Deleted</th>
                <th className="text-left px-4 py-3.5 font-bold text-gray-700">Deleted By</th>
                <th className="text-left px-4 py-3.5 font-bold text-gray-700">Status</th>
                <th className="text-left px-4 py-3.5 font-bold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {backups.map((b) => (
                <tr key={b._id} className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-3.5 font-semibold text-gray-800 whitespace-nowrap">
                    {b.displayName}
                  </td>
                  <td className="px-4 py-3.5">
                    <span
                      className={`capitalize px-2.5 py-1 rounded-full text-[12px] font-semibold ${getRoleBadge(b.role)}`}
                    >
                      {b.role}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-gray-700">{b.email}</td>
                  <td className="px-4 py-3.5 text-gray-700">
                    {b.businessNumber || <span className="text-gray-300">-</span>}
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    <span className="inline-flex items-center justify-center bg-gray-100 text-gray-800 font-bold rounded-full w-8 h-8 text-[12px]">
                      {b.productCount}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-gray-600 whitespace-nowrap">
                    {new Date(b.deletedAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </td>
                  <td className="px-4 py-3.5 text-gray-600 whitespace-nowrap">
                    {b.deletedByName || <span className="text-gray-300">-</span>}
                  </td>
                  <td className="px-4 py-3.5">
                    {b.restoredAt ? (
                      <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-green-700">
                        <span className="w-2 h-2 bg-green-500 rounded-full" />
                        Restored
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-amber-600">
                        <span className="w-2 h-2 bg-amber-500 rounded-full" />
                        Deleted
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3.5">
                    {!b.restoredAt && (
                      <button
                        onClick={() => setRestoreTarget(b)}
                        title="Restore"
                        className="inline-flex items-center justify-center w-9 h-9 text-green-600 hover:text-green-800 bg-green-50 hover:bg-green-100 border border-green-200 rounded-lg transition-colors"
                      >
                        <FaUndo className="text-sm" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Restore confirmation modal */}
      {restoreTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => !restoring && setRestoreTarget(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl w-full max-w-3xl p-10"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-5">
              <div className="flex-shrink-0 w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                <FaUndo className="text-green-600 text-2xl" />
              </div>
              <div className="flex-1">
                <h3 className="text-3xl font-bold text-gray-900">Restore this account?</h3>
                <p className="mt-2 text-lg text-gray-600 leading-relaxed">
                  This brings back{" "}
                  <span className="font-semibold text-gray-900">{restoreTarget.displayName}</span>{" "}
                  ({restoreTarget.email}) and everything that was linked to it —{" "}
                  {restoreTarget.productCount} product{restoreTarget.productCount !== 1 ? "s" : ""},
                  transactions, subscriptions, and more — exactly as it was before deletion.
                </p>
              </div>
            </div>

            <div className="mt-8 flex justify-end gap-3">
              <button
                onClick={() => setRestoreTarget(null)}
                disabled={restoring}
                className="px-5 py-2.5 rounded-lg font-semibold text-gray-700 border border-gray-300 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmRestore}
                disabled={restoring}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-white bg-green-600 hover:bg-green-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {restoring ? (
                  <>
                    <Spinner size="sm" color="white" />
                    Restoring...
                  </>
                ) : (
                  <>
                    <FaUndo className="text-sm" />
                    Restore
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

export default DeletedStoresPage;
