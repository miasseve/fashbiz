"use client";
import React, { useEffect, useState, useMemo } from "react";
import { Spinner } from "@heroui/react";
import { FaSearch, FaReply, FaTrash } from "react-icons/fa";
import { toast } from "react-toastify";

const TABS = [
  { key: "public", label: "Public Messages" },
  { key: "dashboard", label: "Dashboard Messages" },
];

const FILTERS = [
  { key: "all", label: "All" },
  { key: "unread", label: "Unread" },
  { key: "resolved", label: "Resolved" },
];

const AdminSupportPage = () => {
  const [allTickets, setAllTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("public");
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [submittingReply, setSubmittingReply] = useState(false);
  const perPage = 10;

  const fetchTickets = async () => {
    try {
      const res = await fetch(`/api/admin/support?type=${activeTab}`);
      const data = await res.json();
      setAllTickets(data.tickets || []);
    } catch (error) {
      console.error("Failed to fetch support tickets:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchTickets();
  }, [activeTab]);

  // Reset page on filter/tab change
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, statusFilter, search]);

  // Client-side filtering for status + search
  const filteredTickets = useMemo(() => {
    let list = allTickets;

    // Status filter
    if (statusFilter === "unread") {
      list = list.filter((t) => !t.isRead);
    } else if (statusFilter === "resolved") {
      list = list.filter((t) => t.status === "resolved");
    }

    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.email.toLowerCase().includes(q) ||
          (t.subject && t.subject.toLowerCase().includes(q)) ||
          t.message.toLowerCase().includes(q) ||
          (t.storename && t.storename.toLowerCase().includes(q))
      );
    }

    return list;
  }, [allTickets, statusFilter, search]);

  const totalPages = Math.ceil(filteredTickets.length / perPage);
  const paginatedTickets = filteredTickets.slice(
    (currentPage - 1) * perPage,
    currentPage * perPage
  );

  // Counts for tab badges
  const publicCount = useMemo(() => {
    if (activeTab === "public") return allTickets.length;
    return null;
  }, [allTickets, activeTab]);

  const dashboardCount = useMemo(() => {
    if (activeTab === "dashboard") return allTickets.length;
    return null;
  }, [allTickets, activeTab]);

  // Update a ticket locally after PATCH
  const updateTicketLocal = (ticketId, updates) => {
    setAllTickets((prev) =>
      prev.map((t) => (t._id === ticketId ? { ...t, ...updates } : t))
    );
  };

  const handleMarkRead = async (ticketId) => {
    try {
      const res = await fetch("/api/admin/support", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticketId, isRead: true }),
      });
      if (res.ok) {
        updateTicketLocal(ticketId, { isRead: true });
      }
    } catch (error) {
      toast.error("Failed to mark as read");
    }
  };

  const handleStatusChange = async (ticketId, newStatus) => {
    try {
      const res = await fetch("/api/admin/support", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticketId, status: newStatus }),
      });
      if (res.ok) {
        updateTicketLocal(ticketId, { status: newStatus });
        toast.success("Status updated");
      }
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  const handleSubmitReply = async (ticketId) => {
    if (!replyText.trim()) return;
    setSubmittingReply(true);
    try {
      const res = await fetch("/api/admin/support", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticketId, adminReply: replyText }),
      });
      const data = await res.json();
      if (res.ok) {
        updateTicketLocal(ticketId, {
          adminReply: replyText,
          repliedAt: new Date().toISOString(),
          status: data.ticket?.status || "in_progress",
          isRead: true,
        });
        setReplyingTo(null);
        setReplyText("");
        toast.success("Reply sent");
      } else {
        toast.error(data.error || "Failed to send reply");
      }
    } catch (error) {
      toast.error("Something went wrong");
    } finally {
      setSubmittingReply(false);
    }
  };

  const handleDelete = async (ticketId) => {
    if (!window.confirm("Are you sure you want to delete this ticket?")) return;
    try {
      const res = await fetch("/api/admin/support", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticketId }),
      });
      if (res.ok) {
        setAllTickets((prev) => prev.filter((t) => t._id !== ticketId));
        toast.success("Ticket deleted");
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to delete ticket");
      }
    } catch (error) {
      toast.error("Something went wrong");
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      new: "bg-blue-100 text-blue-700",
      in_progress: "bg-yellow-100 text-yellow-700",
      resolved: "bg-green-100 text-green-700",
    };
    const labels = {
      new: "New",
      in_progress: "In Progress",
      resolved: "Resolved",
    };
    return (
      <span
        className={`px-2.5 py-1 rounded-full text-[13px] font-semibold ${
          styles[status] || styles.new
        }`}
      >
        {labels[status] || "New"}
      </span>
    );
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
      <h1 className="text-3xl font-bold">Support Tickets</h1>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-6 py-2.5 rounded-md text-base font-medium transition-all ${
              activeTab === tab.key
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab.label}
            {((tab.key === "public" && publicCount !== null) ||
              (tab.key === "dashboard" && dashboardCount !== null)) && (
              <span className="ml-2 text-sm bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">
                {tab.key === "public" ? publicCount : dashboardCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Filter bar + Search */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          {/* Status filter buttons */}
          <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => setStatusFilter(f.key)}
                className={`px-4 py-2 rounded-md text-[15px] font-semibold transition-all ${
                  statusFilter === f.key
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative flex-1">
            <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-base" />
            <input
              type="text"
              placeholder="Search by name, email, subject, message..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 border border-gray-200 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Results count */}
      {filteredTickets.length > 0 ? (
        <div className="text-lg font-medium text-gray-600">
          Showing {(currentPage - 1) * perPage + 1}-
          {Math.min(currentPage * perPage, filteredTickets.length)} out of{" "}
          {filteredTickets.length} tickets
        </div>
      ) : (
        <div className="text-lg font-medium text-gray-600">
          No tickets found
        </div>
      )}

      {/* Message Cards */}
      <div className="space-y-4">
        {paginatedTickets.map((ticket) => (
          <div
            key={ticket._id}
            className={`bg-white rounded-xl shadow-sm border border-gray-100 p-5 space-y-3 transition-all ${
              !ticket.isRead ? "border-l-4 border-l-blue-500" : ""
            }`}
          >
            {/* Header: sender info + status */}
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <span className={`text-[15px] text-gray-800 ${!ticket.isRead ? "font-bold" : "font-semibold"}`}>
                  {ticket.name}
                </span>
                {activeTab === "public" ? (
                  <span className="text-[14px] text-gray-500 ml-2">
                    {ticket.email}
                  </span>
                ) : (
                  ticket.storename && (
                    <span className="text-[14px] text-indigo-600 ml-2 font-medium">
                      {ticket.storename}
                    </span>
                  )
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {getStatusBadge(ticket.status)}
              </div>
            </div>

            {/* Subject */}
            {ticket.subject && (
              <div className="text-[15px] font-semibold text-gray-700">
                {ticket.subject}
              </div>
            )}

            {/* Message */}
            <p className="text-[15px] text-gray-600 whitespace-pre-wrap">
              {ticket.message}
            </p>

            {/* Timestamp */}
            <div className="text-[13px] text-gray-400">
              {new Date(ticket.createdAt).toLocaleString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
                hour: "numeric",
                minute: "2-digit",
              })}
            </div>

            {/* Existing admin reply */}
            {ticket.adminReply && (
              <div className="bg-indigo-50 rounded-lg p-4">
                <div className="text-[13px] font-semibold text-indigo-700 mb-1">
                  Admin Reply
                </div>
                <p className="text-[15px] text-gray-700 whitespace-pre-wrap">
                  {ticket.adminReply}
                </p>
                {ticket.repliedAt && (
                  <div className="text-[12px] text-gray-400 mt-2">
                    {new Date(ticket.repliedAt).toLocaleString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Action buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-gray-100">
              <button
                onClick={() => {
                  if (replyingTo === ticket._id) {
                    setReplyingTo(null);
                    setReplyText("");
                  } else {
                    setReplyingTo(ticket._id);
                    setReplyText(ticket.adminReply || "");
                  }
                }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-[14px] font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors"
              >
                <FaReply className="text-xs" />
                {ticket.adminReply ? "Edit Reply" : "Reply"}
              </button>

              {!ticket.isRead && (
                <button
                  onClick={() => handleMarkRead(ticket._id)}
                  className="px-4 py-2 rounded-lg text-[14px] font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Mark Read
                </button>
              )}

              <select
                value={ticket.status || "new"}
                onChange={(e) => handleStatusChange(ticket._id, e.target.value)}
                className="px-3 py-2 rounded-lg text-[14px] font-semibold border border-gray-200 bg-white text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="new">New</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
              </select>

              <button
                onClick={() => handleDelete(ticket._id)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-[14px] font-semibold bg-red-50 text-red-600 hover:bg-red-100 transition-colors ml-auto"
              >
                <FaTrash className="text-xs" />
                Delete
              </button>
            </div>

            {/* Inline reply form */}
            {replyingTo === ticket._id && (
              <div className="space-y-3 pt-3">
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Type your reply..."
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg text-[15px] focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => handleSubmitReply(ticket._id)}
                    disabled={submittingReply || !replyText.trim()}
                    className="px-6 py-2.5 rounded-lg text-[14px] font-semibold bg-indigo-600 text-white hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submittingReply ? "Sending..." : "Send Reply"}
                  </button>
                  <button
                    onClick={() => {
                      setReplyingTo(null);
                      setReplyText("");
                    }}
                    className="px-6 py-2.5 rounded-lg text-[14px] font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 rounded-lg text-[15px] font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              className={`w-10 h-10 rounded-lg text-[15px] font-semibold transition-colors ${
                currentPage === page
                  ? "bg-indigo-600 text-white"
                  : "border border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              {page}
            </button>
          ))}
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 rounded-lg text-[15px] font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default AdminSupportPage;
