"use client";
import React, { useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BiLogoProductHunt } from "react-icons/bi";
import { IoQrCode } from "react-icons/io5";
import { FaStore, FaUser, FaUsers } from "react-icons/fa";
import { MdLocalGroceryStore } from "react-icons/md";
import { PiStripeLogoFill } from "react-icons/pi";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Spinner } from "@heroui/react";
import { RiProductHuntFill } from "react-icons/ri";
import { FaHistory } from "react-icons/fa";
import { FaHandHoldingUsd } from "react-icons/fa";
import { FaBoxOpen } from "react-icons/fa6";
import { toast } from "react-toastify";

const Sidebar = ({ isSidebarOpen, toggleSidebar }) => {
  const session = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const barcodeInputRef = useRef(null);
  // Move useEffect BEFORE the early return
  useEffect(() => {
    const handleBarcodeInput = async (e) => {
      if (e.key === "Enter") {
        const input = e.target;
        const scanned = input.value.trim();

        if (!scanned) return;

        try {
          // Call API to convert scanned barcode → productId
          const res = await fetch(`/api/product-barcode?barcode=${scanned}`);
          const data = await res.json();

          if (data.error) {
            toast.error("Product not found for scanned barcode");
            input.value = ""; // reset for next scan
            return;
          }

          if (data.productId) {
            window.open(`/dashboard/product/${data.productId}`, "_blank");
          }
        } catch (error) {
          console.error("Error fetching product:", error);
          toast.error("Error processing barcode");
        } finally {
          input.value = ""; // reset for next scan
        }
      }
    };

    const input = barcodeInputRef.current;
    if (!input) return;

    // Add event listener
    input.addEventListener("keydown", handleBarcodeInput);

    // Cleanup: remove event listener when component unmounts
    return () => {
      input.removeEventListener("keydown", handleBarcodeInput);
    };
  }, [router]);

  // Now the early return comes AFTER all hooks
  if (session.status === "loading") {
    return (
      <div className="flex flex-col justify-center items-center h-screen">
        <Spinner size="lg" color="success" />
      </div>
    );
  }

  const menuItems = [
    { href: "/dashboard/profile", label: "Profile", icon: <FaUser /> },
    session.data?.user?.role === "store" && {
      href: "/dashboard/store",
      label: "Store",
      icon: <FaStore />,
    },
    session.data?.user?.role === "brand" && {
      href: "/dashboard/ree-collect",
      label: "Brand Store",
      icon: <FaBoxOpen />,
    },
    session.data?.user?.role === "store" && {
      href: "/dashboard/add-product",
      label: "Add Product",
      icon: <BiLogoProductHunt />,
    },
    session.data?.user?.role === "consignor" && {
      href: "/dashboard/qr",
      label: "QR code",
      icon: <IoQrCode />,
    },
    session.data?.user?.role !== "consignor" && {
      href: "/dashboard/subscription-plan",
      label: "Subscription Plan",
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

  const handleLinkClick = (href) => {
    if (isSidebarOpen) {
      toggleSidebar();
    }
    router.push(href);
  };

  return (
    <div>
      <div className="logo text-[2rem] font-bold text-center bd-white border-b border-[#dedede]">
        <img src="/fashlogo.svg" className="w-[132px] mx-auto" />
        {session.data?.user?.role === "store" && (
          <input
            ref={barcodeInputRef}
            type="text"
            id="barcode-input"
            placeholder="Scan barcode..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#ffd7d7]"
            autoComplete="off"
            hidden
          />
        )}
      </div>
      <nav className="flex flex-col items-start text-lg w-full text-[1rem] navbar ">
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
          </Link>
        ))}

        {session.data?.user?.role === "store" && (
          <>
            <Link
              href="/dashboard/ree-collect"
              onClick={() => isSidebarOpen && toggleSidebar()}
              className={`w-full px-3 p-3 transition-all text-[1.5rem] flex items-center py-[13px] mt-32 ${
                pathname === "/dashboard/ree-collect"
                  ? "bg-[#ffd7d7] text-black"
                  : "hover:bg-[#ffd7d7] hover:text-black"
              }`}
            >
              <div className="bg-pink-400 p-2 rounded-full border border-white flex items-center justify-center">
                <FaBoxOpen className="text-white text-[1.3rem]" />
              </div>
              <span className="ml-2">Ree Collect</span>
            </Link>

            <Link
              href="/dashboard/invite-store"
              onClick={() => isSidebarOpen && toggleSidebar()}
              className={`w-full px-3 p-3 transition-all text-[1.5rem] flex items-center py-[13px] ${
                pathname === "/dashboard/invite-store"
                  ? "bg-[#ffd7d7] text-black"
                  : "hover:bg-[#ffd7d7] hover:text-black"
              }`}
            >
              <FaHandHoldingUsd className="text-[1.3rem]" />
              <span className="ml-2">Invite a store</span>
            </Link>
          </>
        )}
      </nav>
    </div>
  );
};

export default Sidebar;
