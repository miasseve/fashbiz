"use client";
import React, { useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BiLogoProductHunt } from "react-icons/bi";
import { IoQrCode } from "react-icons/io5";
import { FaStore, FaUser, FaUsers } from "react-icons/fa";
import { MdLocalGroceryStore, MdOutlineReceiptLong } from "react-icons/md";
import { PiStripeLogoFill } from "react-icons/pi";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Spinner } from "@heroui/react";
import { RiProductHuntFill } from "react-icons/ri";

import { FaHandHoldingUsd, FaInstagram, FaGlobe, FaTags } from "react-icons/fa";
import { FaBoxOpen } from "react-icons/fa6";
import { toast } from "react-toastify";
import { CiBoxList } from "react-icons/ci";
import BarcodeScannerModal from "@/components/BarcodeScannerModal";

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
          // Scan-to-delist: marks the product sold and delists it everywhere
          // (same as a real Shopify sale would), rather than just opening
          // the product page for a manual toggle. Input stays focused so a
          // store owner can scan several sold items back-to-back.
          const res = await fetch("/api/product-barcode", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ barcode: scanned }),
          });
          const data = await res.json();

          if (!res.ok) {
            toast.error(data.error || "Couldn't process that barcode");
            return;
          }

          toast.success(`Marked sold: ${data.title}`);
        } catch (error) {
          console.error("Error processing barcode:", error);
          toast.error("Error processing barcode");
        } finally {
          input.value = ""; // reset for next scan
          input.focus();
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

  // Computed once at login (see auth.js) — includes both the subscriptionType
  // heuristic and the AddOnPurchase check, so "connected" means the same
  // thing here as on the product page and everywhere else.
  const hasWebstoreAccess = !!session.data?.user?.hasWebstoreAccess;
  // Matches ProductList.jsx's canPostToInstagram check exactly.
  const canPostToInstagram =
    session.data?.user?.subscriptionType === "free" ||
    session.data?.user?.subscriptionType === "Pro" ||
    session.data?.user?.subscriptionType === "Business";

  const menuItems = [
    {
      href: "/dashboard/profile",
      label: "Profile",
      icon: <FaUser />,
    },
    session.data?.user?.role === "store" && {
      href: "/dashboard/store",
      label: "Store",
      icon: <FaStore />,
      // A product's own detail page is reached FROM the store's product
      // list — it should still read as "you're in Store", not lose the
      // highlight just because the URL isn't an exact match.
      isActive: (path) => path === "/dashboard/store" || path.startsWith("/dashboard/product"),
    },
    {
      href: "/dashboard/add-product",
      label: "Add Product",
      icon: <BiLogoProductHunt />,
    },
    session.data?.user?.role === "store" && {
      href: "/dashboard/items-sold",
      label: "Items Sold",
      icon: <MdLocalGroceryStore />,
    },
    session.data?.user?.role === "brand" && {
      href: "/dashboard/ree-collect",
      label: "Brand Store",
      icon: <FaBoxOpen />,
    },
    session.data?.user?.points_mode && {
      href: "/dashboard/dkk-points",
      label: "DKK Points",
      icon: <CiBoxList />,
    },
    session.data?.user?.role === "store" && {
      href: "/dashboard/review-queue",
      label: "Review Queue",
      icon: <MdOutlineReceiptLong />,
    },
    session.data?.user?.role === "consignor" && {
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
    // Subscription Plan moved to render at the very bottom of the sidebar,
    // below the connections section — see the bottom of this file.
    {
      href: "/dashboard/payment-history",
      label: "Transaction History",
      icon: <MdOutlineReceiptLong />,
    },
  ].filter(Boolean);

  return (
    <div className="h-full flex flex-col">
      <div className="logo text-[2rem] font-bold text-center bd-white border-b border-[#dedede]">
        {/* <img src="/fashlogo.svg" className="w-[132px] mx-auto" /> */}
        <img src="/new_ree_icon.png" className="w-[92px] mx-auto py-[12px]" />
        {session.data?.user?.role === "store" && (
          <>
            <input
              ref={barcodeInputRef}
              type="text"
              id="barcode-input"
              placeholder="Scan barcode..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#ffd7d7]"
              autoComplete="off"
              hidden
            />
            <div className="px-3 pb-3">
              <BarcodeScannerModal />
            </div>
          </>
        )}
      </div>
      <nav className="flex flex-col items-start text-lg w-full text-[1rem] navbar flex-1 overflow-y-auto">
        {menuItems.map(({ href, label, icon, isActive }) => (
          <Link
            key={href}
            href={href}
            onClick={() => isSidebarOpen && toggleSidebar()}
            className={`w-full px-3 p-3 transition-all text-[1.5rem] flex items-center py-[13px] ${
              (isActive ? isActive(pathname) : pathname === href)
                ? "bg-[#ffd7d7] text-black"
                : "hover:bg-[#ffd7d7] hover:text-black"
            }`}
          >
            {icon} <span className="ml-2">{label}</span>
          </Link>
        ))}

        {/* Ree Collect — hidden for now per Mia's request ("we dont need the
            collect button for now"). Left in place, not deleted, in case
            it needs to come back. */}
        {false && session.data?.user?.role === "store" && (
          <>
            {!session.data?.user?.points_mode && (
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
            )}
          </>
        )}

        {/* Connections — Webstore/Instagram reflect real subscription access;
            Vinted Pro has no backend integration yet, so it always shows as
            not-connected regardless of plan. */}
        {session.data?.user?.role === "store" && (
          <div className="w-full px-3 pt-6 pb-2">
            <p className="text-[11px] uppercase tracking-wide text-gray-400 font-semibold mb-2 px-1">
              Connections
            </p>
            {[
              {
                key: "webstore",
                label: "Webstore",
                icon: <FaGlobe className="text-[1.1rem]" />,
                active: hasWebstoreAccess,
                href: hasWebstoreAccess ? "/dashboard/profile" : "/dashboard/subscription-plan",
              },
              {
                key: "vinted",
                label: "Vinted Pro",
                icon: <FaTags className="text-[1.1rem]" />,
                active: false,
                comingSoon: true,
              },
              {
                key: "instagram",
                label: "Instagram",
                icon: <FaInstagram className="text-[1.1rem]" />,
                active: canPostToInstagram,
                href: canPostToInstagram ? "/dashboard/store" : "/dashboard/subscription-plan",
              },
            ].map((c) =>
              c.comingSoon ? (
                <div
                  key={c.key}
                  className="w-full px-2 py-2 flex items-center justify-between text-gray-400 cursor-not-allowed"
                  title="Coming soon"
                >
                  <span className="flex items-center gap-2 text-[1rem]">
                    {c.icon} {c.label}
                  </span>
                  <span className="text-[10px] uppercase font-semibold">Soon</span>
                </div>
              ) : (
                <Link
                  key={c.key}
                  href={c.href}
                  onClick={() => isSidebarOpen && toggleSidebar()}
                  className="w-full px-2 py-2 flex items-center justify-between text-black hover:bg-[#ffd7d7] rounded"
                >
                  <span className="flex items-center gap-2 text-[1rem]">
                    {c.icon} {c.label}
                  </span>
                  <span
                    className={`w-2 h-2 rounded-full ${c.active ? "bg-green-500" : "bg-gray-300"}`}
                    title={c.active ? "Connected" : "Not connected"}
                  />
                </Link>
              ),
            )}
          </div>
        )}

        {session.data?.user?.role === "store" && (
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
        )}

        {/* Subscription Plan — moved to the bottom of the sidebar per Mia's request. */}
        {session.data?.user?.role !== "consignor" && (
          <Link
            href="/dashboard/subscription-plan"
            onClick={() => isSidebarOpen && toggleSidebar()}
            className={`w-full px-3 p-3 transition-all text-[1.5rem] flex items-center py-[13px] mt-auto ${
              pathname === "/dashboard/subscription-plan"
                ? "bg-[#ffd7d7] text-black"
                : "hover:bg-[#ffd7d7] hover:text-black"
            }`}
          >
            <IoQrCode />
            <span className="ml-2">Subscription Plan</span>
          </Link>
        )}
      </nav>
      <div className="sidebar-footer border-t border-[#dedede] py-[16px] text-center">
        <a
          href="https://www.2hand2go.com"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block"
        >
          <img
            src="/2hand2go_logo.png"
            alt="2hand2go"
            width={120}
            height={30}
            className="w-[120px] h-auto max-w-none mx-auto object-contain"
          />
        </a>
      </div>
    </div>
  );
};

export default Sidebar;
