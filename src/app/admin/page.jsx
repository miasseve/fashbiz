"use client";
import React, { useEffect, useState } from "react";
import { Spinner } from "@heroui/react";
import { FaUsers, FaStore, FaBoxOpen, FaUserPlus } from "react-icons/fa";
import { MdSupportAgent, MdAccessTime } from "react-icons/md";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const AdminOverview = () => {
  const [stats, setStats] = useState(null);
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, dashRes] = await Promise.all([
          fetch("/api/admin/stats"),
          fetch("/api/admin/dashboard"),
        ]);
        const statsData = await statsRes.json();
        const dashData = await dashRes.json();
        setStats(statsData);
        setDashboard(dashData);
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <Spinner size="lg" color="success" />
      </div>
    );
  }

  const cards = [
    {
      label: "Total Users",
      value: stats?.totalUsers || 0,
      icon: <FaUsers className="text-3xl" />,
      bg: "bg-blue-50",
      text: "text-blue-600",
      valueBg: "bg-blue-100",
    },
    {
      label: "Total Stores",
      value: stats?.totalStores || 0,
      icon: <FaStore className="text-3xl" />,
      bg: "bg-green-50",
      text: "text-green-600",
      valueBg: "bg-green-100",
    },
    {
      label: "Total Products",
      value: stats?.totalProducts || 0,
      icon: <FaBoxOpen className="text-3xl" />,
      bg: "bg-purple-50",
      text: "text-purple-600",
      valueBg: "bg-purple-100",
    },
    {
      label: "Support Tickets",
      value: stats?.totalSupportTickets || 0,
      icon: <MdSupportAgent className="text-3xl" />,
      bg: "bg-orange-50",
      text: "text-orange-600",
      valueBg: "bg-orange-100",
    },
  ];

  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now - date;
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getRoleBadge = (role) => {
    const colors = {
      store: "bg-green-100 text-green-700",
      brand: "bg-blue-100 text-blue-700",
      consignor: "bg-yellow-100 text-yellow-700",
    };
    return colors[role] || "bg-gray-100 text-gray-700";
  };

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Dashboard Overview</h1>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card) => (
          <div
            key={card.label}
            className={`${card.bg} rounded-xl p-6 shadow-sm border border-white/50`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className={card.text}>{card.icon}</div>
            </div>
            <div
              className={`inline-block ${card.valueBg} ${card.text} rounded-lg px-4 py-2 mb-2`}
            >
              <span className="text-5xl font-extrabold tracking-tight">
                {card.value.toLocaleString()}
              </span>
            </div>
            <div className="text-[12px] font-semibold text-gray-600 mt-1">
              {card.label}
            </div>
          </div>
        ))}
      </div>

      {/* Quick Stats */}
      {dashboard?.quickStats && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-emerald-100 text-emerald-600 p-2 rounded-lg">
                <FaStore className="text-lg" />
              </div>
              <span className="text-[15px] font-medium text-gray-500">
                Active Stores Today
              </span>
            </div>
            <div className="text-3xl font-bold text-gray-800">
              {dashboard.quickStats.activeStoresToday}
            </div>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-blue-100 text-blue-600 p-2 rounded-lg">
                <FaStore className="text-lg" />
              </div>
              <span className="text-[15px] font-medium text-gray-500">
                Active Stores This Week
              </span>
            </div>
            <div className="text-3xl font-bold text-gray-800">
              {dashboard.quickStats.activeStoresWeek}
            </div>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-violet-100 text-violet-600 p-2 rounded-lg">
                <FaUserPlus className="text-lg" />
              </div>
              <span className="text-[15px] font-medium text-gray-500">
                New Signups This Month
              </span>
            </div>
            <div className="text-3xl font-bold text-gray-800">
              {dashboard.quickStats.newSignupsMonth}
            </div>
          </div>
        </div>
      )}

      {/* Activity Chart & Recent Activity side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Signups Chart */}
        <div className="lg:col-span-3 bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            People Joined by Month
          </h2>
          {dashboard?.chartData && dashboard.chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dashboard.chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 14, fill: "#374151", fontWeight: 600 }}
                />
                <YAxis
                  tick={{ fontSize: 14, fill: "#374151", fontWeight: 600 }}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: "8px",
                    border: "1px solid #e5e7eb",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                    fontSize: "15px",
                  }}
                />
                <Bar
                  dataKey="signups"
                  fill="#6366f1"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={50}
                  name="Joined"
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-gray-400 text-lg">
              No signup data available yet
            </div>
          )}
        </div>

        {/* Recent Activity Timeline */}
        <div className="lg:col-span-2 bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            Recent Activity
          </h2>
          {dashboard?.timeline && dashboard.timeline.length > 0 ? (
            <div className="space-y-4 max-h-[340px] overflow-y-auto pr-1">
              {dashboard.timeline.map((item, idx) => (
                <div key={idx} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                        item.type === "signup"
                          ? "bg-indigo-100 text-indigo-600"
                          : "bg-orange-100 text-orange-600"
                      }`}
                    >
                      {item.type === "signup" ? (
                        <FaUserPlus className="text-sm" />
                      ) : (
                        <MdSupportAgent className="text-base" />
                      )}
                    </div>
                    {idx < dashboard.timeline.length - 1 && (
                      <div className="w-px h-full bg-gray-200 mt-1" />
                    )}
                  </div>
                  <div className="pb-4 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[15px] font-semibold text-gray-800 truncate">
                        {item.name}
                      </span>
                      {item.type === "signup" && item.role && (
                        <span
                          className={`text-[13px] px-2 py-0.5 rounded-full font-semibold ${getRoleBadge(
                            item.role
                          )}`}
                        >
                          {item.role}
                        </span>
                      )}
                    </div>
                    <p className="text-[14px] text-gray-500 mt-0.5">
                      {item.type === "signup"
                        ? "New signup"
                        : "Support message"}
                      {item.email && (
                        <span className="text-gray-400">
                          {" "}
                          &middot; {item.email}
                        </span>
                      )}
                    </p>
                    {item.type === "support" && item.message && (
                      <p className="text-[13px] text-gray-400 mt-1 line-clamp-2 italic">
                        &ldquo;{item.message}&rdquo;
                      </p>
                    )}
                    <div className="flex items-center gap-1 text-[13px] text-gray-400 mt-1">
                      <MdAccessTime className="text-xs" />
                      {formatDate(item.date)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-gray-400 text-lg">
              No recent activity
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminOverview;
