"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { Spinner } from "@heroui/react";
import { toast } from "react-toastify";
import {
  X,
  Send,
  ArrowLeft,
  Plus,
  CheckCircle,
  ChevronRight,
  CircleDot,
} from "lucide-react";

const ChatBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState("list");
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [hasUnread, setHasUnread] = useState(false);

  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [chatMessage, setChatMessage] = useState("");
  const [sendingChat, setSendingChat] = useState(false);

  const messagesEndRef = useRef(null);
  const pollIntervalRef = useRef(null);
  const containerRef = useRef(null);

  // Close on click outside
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchReports = useCallback(async () => {
    try {
      const res = await fetch("/api/dashboard/bug-reports");
      const data = await res.json();
      if (res.ok) {
        setReports(data.reports || []);
        setHasUnread((data.reports || []).some((r) => r.hasNewReply));
      }
    } catch (error) {
      console.error("Failed to fetch bug reports:", error);
    }
  }, []);

  const fetchSingleReport = useCallback(async (id) => {
    try {
      const res = await fetch(`/api/dashboard/bug-reports/${id}`);
      const data = await res.json();
      if (res.ok) setSelectedReport(data.report);
    } catch (error) {
      console.error("Failed to fetch report:", error);
    }
  }, []);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  useEffect(() => {
    if (isOpen && view === "list") {
      setLoading(true);
      fetchReports().finally(() => setLoading(false));
    }
  }, [isOpen, view, fetchReports]);

  useEffect(() => {
    if (isOpen && view === "chat" && selectedReport) {
      pollIntervalRef.current = setInterval(() => {
        fetchSingleReport(selectedReport._id);
      }, 15000);
      return () => clearInterval(pollIntervalRef.current);
    }
    return () => clearInterval(pollIntervalRef.current);
  }, [isOpen, view, selectedReport?._id, fetchSingleReport]);

  useEffect(() => {
    if (view === "chat") scrollToBottom();
  }, [selectedReport?.messages, view]);

  const handleOpenReport = async (report) => {
    setSelectedReport(report);
    setView("chat");
    if (report.hasNewReply) {
      try {
        await fetch(`/api/dashboard/bug-reports/${report._id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        });
        setReports((prev) =>
          prev.map((r) =>
            r._id === report._id ? { ...r, hasNewReply: false } : r
          )
        );
        setHasUnread(
          reports.some((r) => r._id !== report._id && r.hasNewReply)
        );
      } catch (error) {
        // silent
      }
    }
  };

  const handleSubmitReport = async (e) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/dashboard/bug-reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, message }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Bug report submitted!");
        setSubject("");
        setMessage("");
        setSelectedReport(data.report);
        setView("chat");
        fetchReports();
      } else {
        toast.error(data.error || "Failed to submit report");
      }
    } catch (error) {
      toast.error("Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!chatMessage.trim() || !selectedReport) return;
    setSendingChat(true);
    try {
      const res = await fetch(
        `/api/dashboard/bug-reports/${selectedReport._id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: chatMessage }),
        }
      );
      const data = await res.json();
      if (res.ok) {
        setSelectedReport(data.report);
        setChatMessage("");
        fetchReports();
      } else {
        toast.error(data.error || "Failed to send message");
      }
    } catch (error) {
      toast.error("Something went wrong");
    } finally {
      setSendingChat(false);
    }
  };

  const handleMarkResolved = async () => {
    if (!selectedReport) return;
    try {
      const res = await fetch(
        `/api/dashboard/bug-reports/${selectedReport._id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ markResolved: true }),
        }
      );
      const data = await res.json();
      if (res.ok) {
        toast.success("Marked as resolved!");
        setSelectedReport(data.report);
        fetchReports();
      }
    } catch (error) {
      toast.error("Failed to mark as resolved");
    }
  };

  const statusDot = (status) => {
    const colors = {
      new: "bg-blue-400",
      in_progress: "bg-amber-400",
      resolved: "bg-emerald-400",
    };
    return (
      <span
        className={`inline-block w-[6px] h-[6px] rounded-full ${colors[status] || colors.new}`}
      />
    );
  };

  const statusLabel = (status) => {
    const labels = { new: "New", in_progress: "In Progress", resolved: "Resolved" };
    return labels[status] || "New";
  };

  const formatTime = (date) =>
    new Date(date).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });

  const formatShort = (date) => {
    const d = new Date(date);
    const now = new Date();
    const diff = now - d;
    if (diff < 60000) return "now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <div ref={containerRef} className="fixed bottom-6 right-6 sm:!pr-6 pb-6 z-[9999]">
      {/* Chat Window */}
      {isOpen && (
        <div className="absolute bottom-16 right-0 w-[360px] h-[480px] bg-white rounded-[20px] shadow-[0_8px_40px_rgba(0,0,0,0.12)] border border-gray-100 flex flex-col overflow-hidden animate-[slideUp_0.2s_ease-out]">
          {/* Header */}
          <div className="px-5 py-4 flex items-center gap-3 shrink-0 border-b border-gray-100">
            {view !== "list" && (
              <button
                onClick={() => {
                  setView("list");
                  setSelectedReport(null);
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors -ml-1"
              >
                <ArrowLeft size={18} strokeWidth={2} />
              </button>
            )}
            <div className="flex-1 min-w-0">
              <h3 className="text-[14px] font-semibold text-gray-900 truncate">
                {view === "list" && "Help & Bug Reports"}
                {view === "new" && "New Report"}
                {view === "chat" && (selectedReport?.subject || "Conversation")}
              </h3>
              {view === "list" && (
                <p className="text-[11px] text-gray-400 mt-0.5">
                  Report issues, track progress
                </p>
              )}
              {view === "chat" && selectedReport && (
                <div className="flex items-center gap-1.5 mt-0.5">
                  {statusDot(selectedReport.status)}
                  <span className="text-[11px] text-gray-400">
                    {statusLabel(selectedReport.status)}
                  </span>
                </div>
              )}
            </div>
            {view === "chat" && selectedReport?.status !== "resolved" && (
              <button
                onClick={handleMarkResolved}
                className="text-[11px] text-emerald-600 hover:text-emerald-700 font-medium bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-full transition-colors"
              >
                Resolve
              </button>
            )}
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-300 hover:text-gray-500 transition-colors"
            >
              <X size={18} strokeWidth={2} />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto">
            {/* === LIST VIEW === */}
            {view === "list" && (
              <div className="p-3">
                <button
                  onClick={() => setView("new")}
                  className="w-full flex items-center gap-3 bg-gray-900 hover:bg-gray-800 text-white rounded-[14px] px-4 py-3 transition-colors mb-2"
                >
                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                    <Plus size={16} strokeWidth={2.5} />
                  </div>
                  <div className="text-left">
                    <span className="text-[13px] font-medium block">
                      Report a Bug
                    </span>
                    <span className="text-[11px] text-gray-400">
                      Describe an issue you found
                    </span>
                  </div>
                </button>

                {loading ? (
                  <div className="flex justify-center py-12">
                    <Spinner size="sm" color="default" />
                  </div>
                ) : reports.length === 0 ? (
                  <div className="text-center py-12 px-4">
                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                      <CircleDot size={18} className="text-gray-300" />
                    </div>
                    <p className="text-[13px] text-gray-400">
                      No reports yet
                    </p>
                  </div>
                ) : (
                  <div className="mt-1 space-y-0.5">
                    {reports.map((report) => (
                      <button
                        key={report._id}
                        onClick={() => handleOpenReport(report)}
                        className="w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-[12px] hover:bg-gray-50 transition-colors group"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            {report.hasNewReply && (
                              <span className="w-[6px] h-[6px] bg-red-500 rounded-full shrink-0" />
                            )}
                            <span className="text-[13px] font-medium text-gray-800 truncate">
                              {report.subject}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 mt-1">
                            {statusDot(report.status)}
                            <span className="text-[11px] text-gray-400 truncate">
                              {report.messages?.[report.messages.length - 1]
                                ?.message || ""}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <span className="text-[10px] text-gray-300">
                            {formatShort(report.updatedAt)}
                          </span>
                          <ChevronRight
                            size={14}
                            className="text-gray-300 group-hover:text-gray-400 transition-colors"
                          />
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* === NEW REPORT FORM === */}
            {view === "new" && (
              <form onSubmit={handleSubmitReport} className="p-4 space-y-4">
                <div>
                  <label className="block text-[12px] font-medium text-gray-500 mb-1.5 uppercase tracking-wide">
                    Subject
                  </label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="What went wrong?"
                    required
                    className="w-full px-3.5 py-2.5 bg-gray-50 border-0 rounded-[10px] text-[13px] text-gray-800 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-200 transition-shadow"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-gray-500 mb-1.5 uppercase tracking-wide">
                    Description
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Steps to reproduce, what you expected..."
                    rows={5}
                    required
                    className="w-full px-3.5 py-2.5 bg-gray-50 border-0 rounded-[10px] text-[13px] text-gray-800 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-200 resize-none transition-shadow"
                  />
                </div>
                <button
                  type="submit"
                  disabled={submitting || !subject.trim() || !message.trim()}
                  className="w-full bg-gray-900 hover:bg-gray-800 text-white rounded-[10px] py-2.5 text-[13px] font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {submitting ? "Submitting..." : "Submit Report"}
                </button>
              </form>
            )}

            {/* === CHAT VIEW === */}
            {view === "chat" && selectedReport && (
              <div className="flex flex-col h-full">
                <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
                  {selectedReport.messages?.map((msg, idx) => (
                    <div
                      key={msg._id || idx}
                      className={`flex ${
                        msg.sender === "user" ? "justify-end" : "justify-start"
                      }`}
                    >
                      {msg.sender === "admin" && (
                        <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center mr-2 mt-1 shrink-0">
                          <span className="text-[10px] font-bold text-gray-400">
                            A
                          </span>
                        </div>
                      )}
                      <div className="max-w-[75%]">
                        <div
                          className={`rounded-[14px] px-3.5 py-2.5 ${
                            msg.sender === "user"
                              ? "bg-gray-900 text-white rounded-br-[4px]"
                              : "bg-gray-100 text-gray-700 rounded-bl-[4px]"
                          }`}
                        >
                          <p className="text-[13px] leading-[1.5] whitespace-pre-wrap">
                            {msg.message}
                          </p>
                        </div>
                        <p
                          className={`text-[10px] mt-1 px-1 ${
                            msg.sender === "user"
                              ? "text-gray-300 text-right"
                              : "text-gray-300"
                          }`}
                        >
                          {formatTime(msg.createdAt)}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              </div>
            )}
          </div>

          {/* Chat input */}
          {view === "chat" &&
            selectedReport &&
            selectedReport.status !== "resolved" &&
            (() => {
              const msgs = selectedReport.messages || [];
              const lastMsg = msgs[msgs.length - 1];
              const waitingForAdmin =
                msgs.length > 0 && lastMsg?.sender === "user";
              return waitingForAdmin ? (
                <div className="px-4 py-3 text-center text-[12px] text-gray-400 font-medium bg-gray-50/50 shrink-0 border-t border-gray-100">
                  Waiting for admin to respond...
                </div>
              ) : (
                <form
                  onSubmit={handleSendMessage}
                  className="px-3 py-3 flex items-center gap-2 shrink-0 border-t border-gray-100 bg-white"
                >
                  <input
                    type="text"
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 px-3.5 py-2 bg-gray-50 border-0 rounded-full text-[13px] text-gray-800 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-200 transition-shadow"
                  />
                  <button
                    type="submit"
                    disabled={sendingChat || !chatMessage.trim()}
                    className="w-8 h-8 bg-gray-900 hover:bg-gray-800 text-white rounded-full flex items-center justify-center transition-colors disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
                  >
                    <Send size={14} strokeWidth={2.5} />
                  </button>
                </form>
              );
            })()}

          {/* Resolved banner */}
          {view === "chat" &&
            selectedReport &&
            selectedReport.status === "resolved" && (
              <div className="px-4 py-3 text-center text-[12px] text-emerald-600 font-medium bg-emerald-50/50 shrink-0 border-t border-emerald-100">
                <CheckCircle
                  size={13}
                  className="inline mr-1.5 mb-[1px]"
                  strokeWidth={2.5}
                />
                Issue resolved
              </div>
            )}
        </div>
      )}

      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-[52px] h-[52px] rounded-[16px] shadow-[0_2px_12px_rgba(0,0,0,0.12)] transition-all duration-300 flex items-center justify-center ${
          isOpen
            ? "bg-gray-900 hover:bg-gray-800"
            : "bg-white hover:bg-gray-50 hover:shadow-[0_4px_20px_rgba(0,0,0,0.15)]"
        }`}
      >
        {isOpen ? (
          <X size={20} className="text-white" />
        ) : (
          <svg
            width="26"
            height="26"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M4 12V10a8 8 0 1 1 16 0v2"
              stroke="url(#supportGrad)"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <rect x="2" y="12" width="4" height="6" rx="2" fill="url(#supportGrad)" />
            <rect x="18" y="12" width="4" height="6" rx="2" fill="url(#supportGrad)" />
            <path
              d="M20 18v1a2 2 0 0 1-2 2h-4"
              stroke="url(#supportGrad)"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <circle cx="13" cy="21" r="1.5" fill="url(#supportGrad)" />
            <defs>
              <linearGradient
                id="supportGrad"
                x1="2"
                y1="2"
                x2="22"
                y2="22"
                gradientUnits="userSpaceOnUse"
              >
                <stop stopColor="#111827" />
                <stop offset="1" stopColor="#374151" />
              </linearGradient>
            </defs>
          </svg>
        )}
        {!isOpen && hasUnread && (
          <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-red-500 rounded-full border-[2px] border-white" />
        )}
      </button>
    </div>
  );
};

export default ChatBot;
