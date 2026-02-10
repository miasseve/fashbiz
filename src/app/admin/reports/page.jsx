"use client";
import React, { useEffect, useState } from "react";
import { Spinner } from "@heroui/react";

const AdminReportsPage = () => {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, usersRes] = await Promise.all([
          fetch("/api/admin/stats"),
          fetch("/api/admin/users"),
        ]);
        const statsData = await statsRes.json();
        const usersData = await usersRes.json();
        setStats(statsData);
        setUsers(usersData.users || []);
      } catch (error) {
        console.error("Failed to fetch reports:", error);
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

  const storeCount = users.filter((u) => u.role === "store").length;
  const consignorCount = users.filter((u) => u.role === "consignor").length;
  const brandCount = users.filter((u) => u.role === "brand").length;

  const subs = stats?.subscriptions || {};
  const planBreakdown = subs.byPlan || [];

  const planColors = [
    "bg-indigo-100 text-indigo-700",
    "bg-teal-100 text-teal-700",
    "bg-pink-100 text-pink-700",
    "bg-amber-100 text-amber-700",
    "bg-cyan-100 text-cyan-700",
  ];

  const reportSections = [
    {
      title: "Users by Role",
      items: [
        { label: "Stores", value: storeCount, color: "bg-green-100 text-green-700" },
        { label: "Consignors", value: consignorCount, color: "bg-blue-100 text-blue-700" },
        { label: "Brands", value: brandCount, color: "bg-purple-100 text-purple-700" },
        { label: "Total", value: users.length, color: "bg-gray-100 text-gray-700" },
      ],
    },
    {
      title: "Platform Summary",
      items: [
        { label: "Total Products", value: stats?.totalProducts || 0, color: "bg-orange-100 text-orange-700" },
        { label: "Support Tickets", value: stats?.totalSupportTickets || 0, color: "bg-red-100 text-red-700" },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Reports</h1>
      <div className="space-y-8">
        {reportSections.map((section) => (
          <div key={section.title} className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-bold mb-4">{section.title}</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {section.items.map((item) => (
                <div
                  key={item.label}
                  className={`${item.color} rounded-lg p-4 text-center`}
                >
                  <div className="text-3xl font-bold">{item.value}</div>
                  <div className="text-[15px] font-semibold mt-1">{item.label}</div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Subscriptions by Plan */}
        {planBreakdown.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-bold mb-4">Subscriptions by Plan</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {planBreakdown.map((plan, i) => (
                <div
                  key={plan.plan}
                  className={`${planColors[i % planColors.length]} rounded-lg p-4 text-center`}
                >
                  <div className="text-3xl font-bold">{plan.count}</div>
                  <div className="text-[15px] font-semibold mt-1">{plan.plan}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminReportsPage;
