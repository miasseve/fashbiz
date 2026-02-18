"use client";
import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Spinner } from "@heroui/react";
import { MdDashboard, MdTimeline, MdSupportAgent, MdDeveloperMode } from "react-icons/md";
import { FaUsers } from "react-icons/fa";
import { BiLogoProductHunt } from "react-icons/bi";
import { TbReportAnalytics } from "react-icons/tb";

const AdminSidebar = ({ isSidebarOpen, toggleSidebar }) => {
  const session = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const [unreadCount, setUnreadCount] = useState(0);

  const POLL_INTERVAL = 15000; // 15 seconds

  const fetchUnread = useCallback(async () => {
    try {
      const [supportRes, bugRes] = await Promise.all([
        fetch("/api/admin/support/unread"),
        fetch("/api/admin/bug-reports/unread"),
      ]);
      const supportData = await supportRes.json();
      const bugData = await bugRes.json();
      setUnreadCount((supportData.count || 0) + (bugData.count || 0));
    } catch (error) {
      console.error("Failed to fetch unread counts:", error);
    }
  }, []);

  // Fetch on mount, pathname change
  useEffect(() => {
    if (session.data?.user?.role === "admin") {
      fetchUnread();
    }
  }, [session.data?.user?.role, pathname, fetchUnread]);

  // Auto-poll for real-time unread badge updates (admin only)
  useEffect(() => {
    if (session.data?.user?.role !== "admin") return;
    const interval = setInterval(fetchUnread, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [session.data?.user?.role, fetchUnread]);

  if (session.status === "loading") {
    return (
      <div className="flex flex-col justify-center items-center h-screen">
        <Spinner size="lg" color="success" />
      </div>
    );
  }

  const userRole = session.data?.user?.role;
  if (userRole !== "admin" && userRole !== "developer") {
    router.push("/login");
    return null;
  }

  const menuItems = [
    { href: "/admin", label: "Overview", icon: <MdDashboard />, roles: ["admin", "developer"] },
    { href: "/admin/live-activity", label: "Live Activity", icon: <MdTimeline />, roles: ["admin", "developer"] },
    { href: "/admin/stores-users", label: "Stores & Users", icon: <FaUsers />, roles: ["admin", "developer"] },
    { href: "/admin/products", label: "Products", icon: <BiLogoProductHunt />, roles: ["admin", "developer"] },
    { href: "/admin/support", label: "Support", icon: <MdSupportAgent />, roles: ["admin", "developer"] },
    { href: "/admin/reports", label: "Reports", icon: <TbReportAnalytics />, roles: ["admin", "developer"] },
    { href: "/admin/developer", label: "Developer", icon: <MdDeveloperMode />, roles: ["developer"] },
  ].filter((item) => item.roles.includes(userRole));

  return (
    <div>
      <div className="logo text-[2rem] font-bold text-center bd-white border-b border-[#dedede]">
        <img src="/reelogo.png" className="w-[92px] mx-auto py-[12px]" />
        <div className="text-[1rem] text-gray-500 pb-2">Admin Panel</div>
      </div>
      <nav className="flex flex-col items-start text-lg w-full text-[1rem] navbar">
        {menuItems.map(({ href, label, icon }) => (
          <Link
            key={href}
            href={href}
            onClick={() => isSidebarOpen && toggleSidebar()}
            className={`w-full px-3 p-3 transition-all text-[1.5rem] flex items-center py-[13px] ${
              pathname === href
                ? "bg-[#ffd7d7] text-black"
                : "hover:bg-[#ffd7d7] hover:text-black"
            }`}
          >
            {icon} <span className="ml-2">{label}</span>
            {label === "Support" && unreadCount > 0 && (
              <span className="ml-auto bg-red-500 text-white text-xs font-bold rounded-full min-w-[22px] h-[22px] flex items-center justify-center px-1">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </Link>
        ))}
      </nav>
    </div>
  );
};

export default AdminSidebar;
