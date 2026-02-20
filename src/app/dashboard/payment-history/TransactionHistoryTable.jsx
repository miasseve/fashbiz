"use client";
import React, { useState, useMemo } from "react";
import {
  Table,
  TableHeader,
  TableBody,
  TableColumn,
  TableRow,
  TableCell,
} from "@heroui/table";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
} from "@heroui/react";
import { FiExternalLink, FiEye } from "react-icons/fi";

const ITEMS_PER_PAGE = 10;

const TransactionHistoryTable = ({ transactions }) => {
  const [activeTab, setActiveTab] = useState("all");
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  const filteredTransactions = useMemo(() => {
    setCurrentPage(1);
    if (activeTab === "all") return transactions;
    return transactions.filter((t) => t.channel === activeTab);
  }, [transactions, activeTab]);

  const totalPages = Math.ceil(filteredTransactions.length / ITEMS_PER_PAGE);
  const paginatedTransactions = filteredTransactions.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const counts = useMemo(() => {
    const shopify = transactions.filter((t) => t.channel === "shopify").length;
    const ree = transactions.filter((t) => t.channel === "ree").length;
    return { all: transactions.length, shopify, ree };
  }, [transactions]);

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatDateTime = (dateStr) => {
    return new Date(dateStr).toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatAmount = (amount, currency) => {
    return `${(amount / 100).toFixed(2)} ${(currency || "DKK").toUpperCase()}`;
  };

  const downloadCSV = () => {
    if (!filteredTransactions || filteredTransactions.length === 0) return;

    const headers = [
      "Date",
      "Order ID",
      "Product Name",
      "SKU",
      "Brand",
      "Customer Name",
      "Customer Email",
      "Amount",
      "Currency",
      "Channel",
      "Status",
      "Payment Method",
      "Consignor Name",
      "Consignor Email",
      "Fulfillment",
    ];

    const rows = filteredTransactions.map((t) => [
      formatDate(t.createdAt),
      t.shopifyOrderNumber || t.orderId,
      `"${t.productName || "N/A"}"`,
      t.productSku || "",
      `"${t.productBrand || ""}"`,
      `"${t.customerName || ""}"`,
      t.customerEmail || "",
      (t.amount / 100).toFixed(2),
      (t.currency || "DKK").toUpperCase(),
      t.channel === "shopify" ? "Web (Shopify)" : "Store (Ree)",
      t.status,
      t.paymentMethod || "",
      `"${t.consignorName || "Store Owner"}"`,
      t.consignorEmail || "",
      t.fulfillmentMethod || "",
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers, ...rows].map((e) => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `transactions_${activeTab}_${new Date().toISOString().split("T")[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const tabs = [
    { key: "all", label: "View All", count: counts.all },
    { key: "shopify", label: "Web (Shopify)", count: counts.shopify },
    { key: "ree", label: "Store (Ree)", count: counts.ree },
  ];

  const getStatusStyle = (status) => {
    switch (status) {
      case "completed":
      case "available":
        return "bg-green-100 text-green-700";
      case "pending":
        return "bg-yellow-100 text-yellow-700";
      case "refunded":
        return "bg-orange-100 text-orange-700";
      case "failed":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const formatStatus = (status) => {
    if (!status) return "--";
    if (status === "available") return "Completed";
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  // Generate page numbers with ellipsis for large page counts
  const getPageNumbers = () => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const pages = [];
    if (currentPage <= 3) {
      pages.push(1, 2, 3, 4, "...", totalPages);
    } else if (currentPage >= totalPages - 2) {
      pages.push(1, "...", totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
    } else {
      pages.push(1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages);
    }
    return pages;
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">
          Transaction History
        </h1>
        <Button onPress={downloadCSV} className="success-btn">
          Download CSV
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <p className="text-[12px] text-gray-600 uppercase font-bold tracking-wider mb-1">
            Total Transactions
          </p>
          <p className="text-xl font-bold text-gray-900">
            {filteredTransactions.length}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <p className="text-[12px] text-gray-600 uppercase font-bold tracking-wider mb-1">
            Total Revenue
          </p>
          <p className="text-xl font-bold text-gray-900">
            {(
              filteredTransactions.reduce((sum, t) => sum + t.amount, 0) / 100
            ).toFixed(2)}{" "}
            DKK
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <p className="text-[12px] text-gray-600 uppercase font-bold tracking-wider mb-1">
            Avg. Transaction
          </p>
          <p className="text-xl font-bold text-gray-900">
            {filteredTransactions.length > 0
              ? (
                  filteredTransactions.reduce((sum, t) => sum + t.amount, 0) /
                  filteredTransactions.length /
                  100
                ).toFixed(2)
              : "0.00"}{" "}
            DKK
          </p>
        </div>
      </div>

      {/* Table card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        {/* Tab bar inside card */}
        <div className="flex flex-col items-center gap-2 md:flex-row md:items-center md:justify-between border-b border-gray-100 px-5 pt-4 pb-0">
          <div className="flex gap-1 bg-gray-200 rounded-lg p-1">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-2 rounded-md text-[12px] font-medium transition-all ${
                  activeTab === tab.key
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {tab.label}{" "}
                <span
                  className={`ml-1 px-1.5 py-0.5 rounded-full text-[12px] ${
                    activeTab === tab.key
                      ? "bg-gray-200 text-gray-700"
                      : "bg-gray-200 text-gray-500"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
          <p className="text-[12px] text-gray-500 pb-2">
            Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1}
            {" - "}
            {Math.min(currentPage * ITEMS_PER_PAGE, filteredTransactions.length)}{" "}
            of {filteredTransactions.length}
          </p>
        </div>

        {/* Table */}
        {paginatedTransactions.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-lg">No transactions found for this filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table
              isStriped
              aria-label="Transaction History Table"
              classNames={{
                wrapper: "shadow-none rounded-none",
                th: "bg-gray-50 text-gray-500 text-[12px] uppercase font-bold tracking-wider",
              }}
            >
              <TableHeader>
                <TableColumn>Date</TableColumn>
                <TableColumn>Order #</TableColumn>
                <TableColumn>Product</TableColumn>
                <TableColumn>Customer</TableColumn>
                <TableColumn>Amount</TableColumn>
                <TableColumn>Channel</TableColumn>
                <TableColumn>Status</TableColumn>
                <TableColumn>Actions</TableColumn>
              </TableHeader>
              <TableBody>
                {paginatedTransactions.map((tx) => (
                  <TableRow key={tx._id}>
                    <TableCell className="whitespace-nowrap text-[12px] text-gray-600">
                      {formatDate(tx.createdAt)}
                    </TableCell>
                    <TableCell className="font-mono text-[12px] text-gray-500">
                      {tx.shopifyOrderNumber
                        ? `#${tx.shopifyOrderNumber}`
                        : tx.orderId?.length > 14
                          ? tx.orderId.slice(0, 14) + "..."
                          : tx.orderId}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium text-[12px] text-gray-800">
                          {tx.productName || "N/A"}
                        </p>
                        {tx.productSku && (
                          <p className="text-[12px] text-gray-500">
                            SKU: {tx.productSku}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-[12px] text-gray-700">{tx.customerName || "--"}</p>
                        {tx.customerEmail && (
                          <p className="text-[12px] text-gray-500">
                            {tx.customerEmail}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-semibold text-[12px] text-gray-900 whitespace-nowrap">
                      {formatAmount(tx.amount, tx.currency)}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-md font-semibold ${
                          tx.channel === "shopify"
                            ? "bg-green-100 text-green-700"
                            : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        {tx.channel === "shopify" ? "Shopify" : "Store"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-block px-2 py-1 rounded-full text-md font-medium ${getStatusStyle(tx.status)}`}
                      >
                        {formatStatus(tx.status)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <button
                        onClick={() => setSelectedTransaction(tx)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-md font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
                      >
                        <FiEye size={13} />
                        View
                      </button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex flex-wrap items-center justify-center gap-2 px-5 py-4 border-t border-gray-100">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 sm:px-4 py-2 rounded-lg text-[12px] font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            {getPageNumbers().map((page, idx) =>
              page === "..." ? (
                <span key={`ellipsis-${idx}`} className="px-2 text-gray-400">
                  ...
                </span>
              ) : (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-9 h-9 sm:w-10 sm:h-10 rounded-lg text-[12px] font-semibold transition-colors ${
                    currentPage === page
                      ? "bg-black text-white"
                      : "border border-gray-200 text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {page}
                </button>
              )
            )}
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 sm:px-4 py-2 rounded-lg text-[12px] font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Transaction detail modal */}
      <Modal
        isOpen={!!selectedTransaction}
        onOpenChange={(open) => {
          if (!open) setSelectedTransaction(null);
        }}
        size="md"
        placement="center"
        backdrop="blur"
        scrollBehavior="inside"
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="text-[12px] font-bold text-gray-900">
                Transaction Details
              </ModalHeader>
              <ModalBody>
                <div className="space-y-3">
                  {/* Product info */}
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-1">
                      Product
                    </p>
                    <p className="text-[12px] font-semibold text-gray-900">
                      {selectedTransaction?.productName || "N/A"}
                    </p>
                    <div className="flex gap-4 mt-1">
                      {selectedTransaction?.productSku && (
                        <p className="text-[12px] text-gray-700">
                          SKU: {selectedTransaction.productSku}
                        </p>
                      )}
                      {selectedTransaction?.productBrand && (
                        <p className="text-[12px] text-gray-700">
                          Brand: {selectedTransaction.productBrand}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Customer info */}
                  {(selectedTransaction?.customerName ||
                    selectedTransaction?.customerEmail) && (
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-1">
                        Customer
                      </p>
                      <p className="text-[12px] font-semibold text-gray-900">
                        {selectedTransaction.customerName || "--"}
                      </p>
                      {selectedTransaction.customerEmail && (
                        <p className="text-[12px] text-gray-700 mt-0.5">
                          {selectedTransaction.customerEmail}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Financial details */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-1">
                        Amount
                      </p>
                      <p className="text-[12px] font-bold text-gray-900">
                        {selectedTransaction &&
                          formatAmount(
                            selectedTransaction.amount,
                            selectedTransaction.currency
                          )}
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-1">
                        Channel
                      </p>
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                          selectedTransaction?.channel === "shopify"
                            ? "bg-green-100 text-green-700"
                            : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        {selectedTransaction?.channel === "shopify"
                          ? "Web (Shopify)"
                          : "Store (Ree)"}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-1">
                        Payment Method
                      </p>
                      <p className="text-[12px] font-semibold text-gray-900">
                        {selectedTransaction?.paymentMethod || "--"}
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-1">
                        Status
                      </p>
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusStyle(selectedTransaction?.status)}`}
                      >
                        {formatStatus(selectedTransaction?.status)}
                      </span>
                    </div>
                  </div>

                  {/* Fulfillment & Date */}
                  <div className="grid grid-cols-2 gap-3">
                    {selectedTransaction?.fulfillmentMethod && (
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-1">
                          Fulfillment
                        </p>
                        <p className="text-[12px] font-semibold text-gray-900">
                          {selectedTransaction.fulfillmentMethod === "shipping"
                            ? "Shipping"
                            : selectedTransaction.fulfillmentMethod === "pickup"
                              ? "Store Pickup"
                              : "In-Store"}
                        </p>
                      </div>
                    )}
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-1">
                        Date
                      </p>
                      <p className="text-[12px] font-semibold text-gray-900">
                        {selectedTransaction &&
                          formatDateTime(selectedTransaction.createdAt)}
                      </p>
                    </div>
                  </div>

                  {/* Consignor info */}
                  {selectedTransaction?.consignorName &&
                    selectedTransaction.consignorName !== "" && (
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-1">
                          Consignor
                        </p>
                        <p className="text-[12px] font-semibold text-gray-900">
                          {selectedTransaction.consignorName}
                        </p>
                        {selectedTransaction.consignorEmail && (
                          <p className="text-[12px] text-gray-500 mt-0.5">
                            {selectedTransaction.consignorEmail}
                          </p>
                        )}
                      </div>
                    )}

                  {/* Shipping address (Shopify) */}
                  {selectedTransaction?.shippingAddress?.address1 && (
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-1">
                        Shipping Address
                      </p>
                      <p className="text-[12px] text-gray-900">
                        {[
                          selectedTransaction.shippingAddress.address1,
                          selectedTransaction.shippingAddress.address2,
                        ]
                          .filter(Boolean)
                          .join(", ")}
                      </p>
                      <p className="text-[12px] text-gray-900">
                        {[
                          selectedTransaction.shippingAddress.city,
                          selectedTransaction.shippingAddress.province,
                          selectedTransaction.shippingAddress.zip,
                        ]
                          .filter(Boolean)
                          .join(", ")}
                      </p>
                      <p className="text-[12px] text-gray-900">
                        {selectedTransaction.shippingAddress.country}
                      </p>
                    </div>
                  )}

                  {/* Shopify order link */}
                  {selectedTransaction?.shopifyOrderUrl && (
                    <a
                      href={selectedTransaction.shopifyOrderUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-[12px] font-medium text-blue-600 hover:text-blue-700 hover:underline"
                    >
                      View on Shopify <FiExternalLink size={14} />
                    </a>
                  )}

                  {/* Order ID */}
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-1">
                      Order ID
                    </p>
                    <p className="text-[12px] font-mono text-gray-700">
                      {selectedTransaction?.shopifyOrderNumber
                        ? `#${selectedTransaction.shopifyOrderNumber}`
                        : selectedTransaction?.orderId}
                    </p>
                  </div>
                </div>
              </ModalBody>
              <ModalFooter>
                <Button onPress={onClose} className="success-btn px-6">
                  Close
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
};

export default TransactionHistoryTable;
