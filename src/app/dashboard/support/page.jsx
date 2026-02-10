"use client";
import React, { useEffect, useState } from "react";
import { Spinner } from "@heroui/react";
import { toast } from "react-toastify";

const DashboardSupportPage = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  const fetchTickets = async () => {
    try {
      const res = await fetch("/api/dashboard/support");
      const data = await res.json();
      setTickets(data.tickets || []);
    } catch (error) {
      console.error("Failed to fetch tickets:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/dashboard/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, message }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Support message sent successfully!");
        setSubject("");
        setMessage("");
        fetchTickets();
      } else {
        toast.error(data.error || "Failed to send message");
      }
    } catch (error) {
      toast.error("Something went wrong");
    } finally {
      setSubmitting(false);
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

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">Contact Support</h1>

      {/* Submit Form */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
        <h2 className="text-xl font-bold mb-4">Send a Message</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-base font-semibold text-gray-600 mb-1.5">
              Subject (optional)
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="What is this about?"
              className="w-full px-4 py-3 border border-gray-200 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-base font-semibold text-gray-600 mb-1.5">
              Message *
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Describe your issue or question..."
              rows={5}
              required
              className="w-full px-4 py-3 border border-gray-200 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
            />
          </div>
          <button
            type="submit"
            disabled={submitting || !message.trim()}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-lg text-base font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? "Sending..." : "Send Message"}
          </button>
        </form>
      </div>

      {/* Ticket History */}
      <h2 className="text-xl font-bold mb-4">Your Support History</h2>
      {loading ? (
        <div className="flex justify-center py-12">
          <Spinner size="lg" color="success" />
        </div>
      ) : tickets.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <p className="text-gray-500 text-center text-lg">
            No support tickets yet.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {tickets.map((ticket) => (
            <div
              key={ticket._id}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 space-y-3"
            >
              <div className="flex items-start justify-between">
                <div>
                  {ticket.subject && (
                    <span className="font-bold text-gray-800 text-[15px]">
                      {ticket.subject}
                    </span>
                  )}
                </div>
                {getStatusBadge(ticket.status)}
              </div>
              <p className="text-gray-600 text-[15px]">{ticket.message}</p>
              <div className="text-[13px] text-gray-400">
                {new Date(ticket.createdAt).toLocaleString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </div>

              {/* Admin Reply */}
              {ticket.adminReply && (
                <div className="bg-indigo-50 rounded-lg p-4 mt-2">
                  <div className="text-[13px] font-semibold text-indigo-700 mb-1">
                    Admin Reply
                  </div>
                  <p className="text-gray-700 text-[15px]">
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
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DashboardSupportPage;
