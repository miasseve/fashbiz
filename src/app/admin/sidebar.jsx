"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Spinner } from "@heroui/react";
import { MdDashboard, MdTimeline, MdSupportAgent } from "react-icons/md";
import { FaUsers } from "react-icons/fa";
import { BiLogoProductHunt } from "react-icons/bi";
import { TbReportAnalytics } from "react-icons/tb";

const AdminSidebar = ({ isSidebarOpen, toggleSidebar }) => {
  const session = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const res = await fetch("/api/admin/support/unread");
        const data = await res.json();
        setUnreadCount(data.count || 0);
      } catch (error) {
        console.error("Failed to fetch unread count:", error);
      }
    };
    if (session.data?.user?.role === "admin") {
      fetchUnread();
    }
  }, [session.data?.user?.role, pathname]);

  if (session.status === "loading") {
    return (
      <div className="flex flex-col justify-center items-center h-screen">
        <Spinner size="lg" color="success" />
      </div>
    );
  }

  if (session.data?.user?.role !== "admin") {
    router.push("/login");
    return null;
  }

  const menuItems = [
    { href: "/admin", label: "Overview", icon: <MdDashboard /> },
    { href: "/admin/live-activity", label: "Live Activity", icon: <MdTimeline /> },
    { href: "/admin/stores-users", label: "Stores & Users", icon: <FaUsers /> },
    { href: "/admin/products", label: "Products", icon: <BiLogoProductHunt /> },
    // { href: "/admin/support", label: "Support", icon: <MdSupportAgent /> },
    { href: "/admin/reports", label: "Reports", icon: <TbReportAnalytics /> },
  ];

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
