"use client";
import React, { useEffect, useState, useMemo } from "react";
import { Spinner } from "@heroui/react";
import { FaSearch, FaReply, FaTrash } from "react-icons/fa";
import { toast } from "react-toastify";
import Swal from "sweetalert2";

const TABS = [
  { key: "public", label: "Public Messages" },
  { key: "bug_report", label: "Bug Reports" },
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

  const isBugTab = activeTab === "bug_report";

  const fetchTickets = async () => {
    try {
      let res;
      if (activeTab === "bug_report") {
        res = await fetch("/api/admin/bug-reports");
        const data = await res.json();
        setAllTickets(data.reports || []);
      } else {
        res = await fetch(`/api/admin/support?type=${activeTab}`);
        const data = await res.json();
        setAllTickets(data.tickets || []);
      }
    } catch (error) {
      console.error("Failed to fetch tickets:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    setReplyingTo(null);
    setReplyText("");
    fetchTickets();
  }, [activeTab]);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, statusFilter, search]);

  const filteredTickets = useMemo(() => {
    let list = allTickets;

    if (statusFilter === "unread") {
      list = list.filter((t) => !t.isRead);
    } else if (statusFilter === "resolved") {
      list = list.filter((t) => t.status === "resolved");
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((t) => {
        const nameMatch = t.name?.toLowerCase().includes(q);
        const emailMatch = t.email?.toLowerCase().includes(q);
        const subjectMatch = t.subject?.toLowerCase().includes(q);
        const storeMatch = t.storename?.toLowerCase().includes(q);
        if (isBugTab) {
          const msgMatch = t.messages?.some((m) =>
            m.message.toLowerCase().includes(q),
          );
          return (
            nameMatch || emailMatch || subjectMatch || storeMatch || msgMatch
          );
        }
        const messageMatch = t.message?.toLowerCase().includes(q);
        return (
          nameMatch || emailMatch || subjectMatch || messageMatch || storeMatch
        );
      });
    }

    return list;
  }, [allTickets, statusFilter, search, isBugTab]);

  const totalPages = Math.ceil(filteredTickets.length / perPage);
  const paginatedTickets = filteredTickets.slice(
    (currentPage - 1) * perPage,
    currentPage * perPage,
  );

  const updateTicketLocal = (ticketId, updates) => {
    setAllTickets((prev) =>
      prev.map((t) => (t._id === ticketId ? { ...t, ...updates } : t)),
    );
  };

  // --- Support ticket handlers (public/dashboard) ---
  const handleMarkRead = async (ticketId) => {
    try {
      let res;
      if (isBugTab) {
        res = await fetch(`/api/admin/bug-reports/${ticketId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ markRead: true }),
        });
      } else {
        res = await fetch("/api/admin/support", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ticketId, isRead: true }),
        });
      }
      if (res.ok) {
        updateTicketLocal(ticketId, { isRead: true });
      }
    } catch (error) {
      toast.error("Failed to mark as read");
    }
  };

  const handleStatusChange = async (ticketId, newStatus) => {
    try {
      let res;
      if (isBugTab) {
        res = await fetch(`/api/admin/bug-reports/${ticketId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus }),
        });
      } else {
        res = await fetch("/api/admin/support", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ticketId, status: newStatus }),
        });
      }
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
      let res;
      if (isBugTab) {
        res = await fetch(`/api/admin/bug-reports/${ticketId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: replyText, markRead: true }),
        });
        const data = await res.json();
        if (res.ok) {
          updateTicketLocal(ticketId, {
            messages: data.report.messages,
            status: data.report.status,
            isRead: true,
          });
          setReplyingTo(null);
          setReplyText("");
          toast.success("Reply sent");
        } else {
          toast.error(data.error || "Failed to send reply");
        }
      } else {
        res = await fetch("/api/admin/support", {
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
      }
    } catch (error) {
      toast.error("Something went wrong");
    } finally {
      setSubmittingReply(false);
    }
  };

  const handleDelete = async (ticketId) => {
    const result = await Swal.fire({
      title: `Are you sure you want to delete this ${isBugTab ? "bug report" : "ticket"}?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete it!",
      cancelButtonText: "No, keep it",
      reverseButtons: true,
      customClass: {
        confirmButton: "btn-danger",
      },
    });

    if (!result.isConfirmed) return;

    try {
      let res;
      if (isBugTab) {
        res = await fetch("/api/admin/bug-reports", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reportId: ticketId }),
        });
      } else {
        res = await fetch("/api/admin/support", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ticketId }),
        });
      }
      if (res.ok) {
        setAllTickets((prev) => prev.filter((t) => t._id !== ticketId));
        toast.success("Deleted successfully");
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to delete");
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

  const formatDate = (date) =>
    new Date(date).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <Spinner size="lg" color="success" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-4xl font-bold sm:!pt-[30px] sm:!pr-[30px] sm:!pb-[20px] sm:!pl-[4px] p-1">Support Tickets</h1>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit flex-wrap">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-6 py-2.5 rounded-md text-[12px] font-medium transition-all ${
              activeTab === tab.key
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filter bar + Search */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
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

          <div className="relative w-full">
            <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-600 text-xl" />
            <input
              type="text"
              placeholder="Search by name, email, subject, message..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full
      h-[48px]
      !pl-12
      pr-4
      bg-gray-50
      border
      border-gray-300
      rounded-lg
      text-base
      text-gray-900
      placeholder-gray-400
      leading-none
      focus:outline-none
      focus:ring-2
      focus:ring-indigo-500
      focus:border-indigo-500
      focus:bg-white"
            />
          </div>
        </div>
      </div>

      {/* Results count */}
      {filteredTickets.length > 0 ? (
        <div className="text-lg font-medium text-gray-600">
          Showing {(currentPage - 1) * perPage + 1}-
          {Math.min(currentPage * perPage, filteredTickets.length)} out of{" "}
          {filteredTickets.length} {isBugTab ? "reports" : "tickets"}
        </div>
      ) : (
        <div className="text-lg font-medium text-gray-600">
          No {isBugTab ? "bug reports" : "tickets"} found
        </div>
      )}

      {/* Cards */}
      <div className="space-y-4">
        {paginatedTickets.map((ticket) => (
          <div
            key={ticket._id}
            className={`bg-white rounded-xl shadow-sm border border-gray-100 p-5 space-y-3 transition-all ${
              !ticket.isRead ? "border-l-4 border-l-blue-500" : ""
            }`}
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <span
                  className={`text-[15px] text-gray-800 ${
                    !ticket.isRead ? "font-bold" : "font-semibold"
                  }`}
                >
                  {ticket.name}
                </span>
                {activeTab === "public" ? (
                  <span className="text-[14px] text-gray-500 ml-2">
                    {ticket.email}
                  </span>
                ) : (
                  <>
                    {ticket.email && (
                      <span className="text-[14px] text-gray-500 ml-2">
                        {ticket.email}
                      </span>
                    )}
                    {ticket.storename && (
                      <span className="text-[14px] text-indigo-600 ml-2 font-medium">
                        {ticket.storename}
                      </span>
                    )}
                  </>
                )}
                {isBugTab && ticket.role && (
                  <span className="text-[12px] text-gray-400 ml-2 uppercase">
                    ({ticket.role})
                  </span>
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

            {/* Message content — different for bug reports vs support tickets */}
            {isBugTab ? (
              /* Threaded messages for bug reports */
              <div className="space-y-2 bg-gray-50 rounded-lg p-3 max-h-[300px] overflow-y-auto">
                {ticket.messages?.map((msg, idx) => (
                  <div
                    key={msg._id || idx}
                    className={`rounded-lg p-3 ${
                      msg.sender === "user"
                        ? "bg-white border border-gray-200"
                        : "bg-indigo-50 border border-indigo-100"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`text-[12px] font-semibold ${
                          msg.sender === "admin"
                            ? "text-indigo-700"
                            : "text-gray-600"
                        }`}
                      >
                        {msg.sender === "admin" ? "Admin" : ticket.name}
                      </span>
                      <span className="text-[11px] text-gray-400">
                        {formatDate(msg.createdAt)}
                      </span>
                    </div>
                    <p className="text-[14px] text-gray-700 whitespace-pre-wrap">
                      {msg.message}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              /* Single message for support tickets */
              <>
                <p className="text-[15px] text-gray-600 whitespace-pre-wrap">
                  {ticket.message}
                </p>

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
                        {formatDate(ticket.repliedAt)}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}

            {/* Timestamp */}
            <div className="text-[13px] text-gray-400">
              {formatDate(ticket.createdAt)}
              {isBugTab && (
                <span> &middot; Updated: {formatDate(ticket.updatedAt)}</span>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-gray-100">
              <button
                onClick={() => {
                  if (replyingTo === ticket._id) {
                    setReplyingTo(null);
                    setReplyText("");
                  } else {
                    setReplyingTo(ticket._id);
                    setReplyText(isBugTab ? "" : ticket.adminReply || "");
                  }
                }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-[14px] font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors"
              >
                <FaReply className="text-xs" />
                {!isBugTab && ticket.adminReply ? "Edit Reply" : "Reply"}
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
