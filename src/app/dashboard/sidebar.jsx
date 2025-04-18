"use client";
import React from "react";
import Swal from "sweetalert2";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BiLogoProductHunt } from "react-icons/bi";
import { IoQrCode } from "react-icons/io5";
import { FaStore, FaUser, FaUsers } from "react-icons/fa";
import { MdLocalGroceryStore } from "react-icons/md";
import { PiStripeLogoFill } from "react-icons/pi";
import { useSession } from "next-auth/react";
import { Spinner } from "@heroui/react";

import { RiProductHuntFill } from "react-icons/ri";
import { FaHistory } from "react-icons/fa";


const Sidebar = () => {
  const session = useSession();

  const pathname = usePathname();

  if (session.status == "loading") {
    return (
      <div className="flex flex-col justify-center items-center h-screen">
        <Spinner size="lg" color="success" />
      </div>
    );
  }

  const menuItems = [
    { href: "/dashboard/profile", label: "Profile", icon: <FaUser /> },
    session.data?.user?.role !== "consignor" && {
      href: "/dashboard/store",
      label: "Store",
      icon: <FaStore />,
    },
    session.data?.user?.role !== "consignor" && {
      href: "/dashboard/add-product",
      label: "Add Product",
      icon: <BiLogoProductHunt />,
    },
    session.data?.user?.role !== "store" && {
      href: "/dashboard/qr",
      label: "QR code",
      icon: <IoQrCode />,
    },
    session.data?.user?.role === "consignor" && {
      href: "/dashboard/storelist",
      label: "Stores",
      icon: <FaUsers />,
    },
    session.data?.user?.role === "consignor" && {
      href: "/dashboard/my-products",
      label: "My Products",
      icon: <RiProductHuntFill />,
    },
    {
      href: "/dashboard/stripe-connect",
      label: "Stripe Connect",
      icon: <PiStripeLogoFill />,
    },
    {
      href: "/dashboard/payment-history",
      label: "Payment History",
      icon: <FaHistory />,
    },
    session.data?.user?.role === "store" && {
      href: "/dashboard/items-sold",
      label: "Items Sold",
      icon: <MdLocalGroceryStore />,
    },
  ].filter(Boolean);

  return (
    <div>
      <div className="logo text-[2rem] font-bold text-center bd-white border-b border-[#dedede]">
        <Link href="/">
          <img src="/fashlogo.svg" className="w-[138px] mx-auto" />
        </Link>
      </div>
      <nav className="flex flex-col items-start text-lg w-full text-[1rem] navbar ">
        {menuItems.map(({ href, label, icon }) => (
          <Link
            key={href}
            href={href}
            className={`w-full px-3 p-3 transition-all text-[1.5rem] flex items-center py-[13px]  w-[80%] ${
              pathname === href
                ? "bg-[#ffd7d7] text-black"
                : "hover:bg-[#ffd7d7] hover:text-black"
            }`}
          >
            {icon} <span className="ml-2">{label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
};

export default Sidebar;
