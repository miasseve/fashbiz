"use client";
import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BiLogoProductHunt } from "react-icons/bi";
import { IoQrCode } from "react-icons/io5";
import { FaStore, FaUser, FaLock } from "react-icons/fa";
import { FaHandHoldingUsd } from "react-icons/fa";
import { FaBoxOpen } from "react-icons/fa6";
import { MdLocalGroceryStore, MdOutlineReceiptLong } from "react-icons/md";
import { PiStripeLogoFill } from "react-icons/pi";
import { GiHamburgerMenu } from "react-icons/gi";
import { IoMdClose } from "react-icons/io";
import { FiChevronUp, FiChevronDown } from "react-icons/fi";
import { RiLoginBoxLine, RiUserAddLine } from "react-icons/ri";
import {
  Card,
  Button,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from "@heroui/react";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";

const TryLayout = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const handleLockedClick = (e, label) => {
    e.preventDefault();
    toast.info(`Sign up to access ${label}`, { autoClose: 2000 });
  };

  const menuItems = [
    { href: "#", label: "Profile", icon: <FaUser />, locked: true },
    { href: "#", label: "Store", icon: <FaStore />, locked: true },
    {
      href: "/try/add-product",
      label: "Add Product",
      icon: <BiLogoProductHunt />,
      locked: false,
    },
    {
      href: "#",
      label: "Items Sold",
      icon: <MdLocalGroceryStore />,
      locked: true,
    },
    {
      href: "#",
      label: "Stripe Connect",
      icon: <PiStripeLogoFill />,
      locked: true,
    },
    { href: "#", label: "Subscription Plan", icon: <IoQrCode />, locked: true },
    {
      href: "#",
      label: "Transaction History",
      icon: <MdOutlineReceiptLong />,
      locked: true,
    },
  ];

  return (
    <div className="lg:grid lg:grid-cols-12 min-h-screen flex">
      {/* Overlay */}
      {isSidebarOpen && (
        <div
          onClick={toggleSidebar}
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed lg:relative top-0 left-0 h-full w-[280px] sm:w-full bg-white transition-transform duration-300 border-r border-[#dedede]
        ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0 lg:col-span-2 z-50`}
      >
        <button
          onClick={toggleSidebar}
          className="absolute top-4 right-4 lg:hidden"
        >
          <IoMdClose size={28} />
        </button>
        <div>
          <div className="logo text-center border-b border-[#dedede]">
            <img
              src="/reelogo.png"
              className="w-[92px] mx-auto py-[12px]"
              alt="REE"
            />
          </div>
          <nav className="flex flex-col items-start text-lg w-full text-[1rem]">
            {menuItems.map(({ href, label, icon, locked }) => (
              <Link
                key={label}
                href={href}
                onClick={(e) => {
                  if (locked) handleLockedClick(e, label);
                  if (isSidebarOpen) toggleSidebar();
                }}
                className={`w-full px-3 p-3 transition-all text-[1.5rem] flex items-center py-[13px] ${
                  !locked && pathname === href
                    ? "bg-[#ffd7d7] text-black"
                    : locked
                      ? "text-gray-400 hover:bg-gray-50 cursor-pointer"
                      : "hover:bg-[#ffd7d7] hover:text-black"
                }`}
              >
                {icon}
                <span className="ml-2">{label}</span>
                {locked && <FaLock className="ml-auto text-sm text-gray-300" />}
              </Link>
            ))}

            {/* Ree Collect - locked */}
            <Link
              href="#"
              onClick={(e) => {
                handleLockedClick(e, "Ree Collect");
                if (isSidebarOpen) toggleSidebar();
              }}
              className="w-full px-3 p-3 transition-all text-[1.5rem] flex items-center py-[13px] mt-32 text-gray-400 hover:bg-gray-50 cursor-pointer"
            >
              <div className="bg-pink-400 p-2 rounded-full border border-white flex items-center justify-center">
                <FaBoxOpen className="text-white text-[1.3rem]" />
              </div>
              <span className="ml-2">Ree Collect</span>
              <FaLock className="ml-auto text-sm text-gray-300" />
            </Link>

            {/* Invite a Store - locked */}
            <Link
              href="#"
              onClick={(e) => {
                handleLockedClick(e, "Invite a Store");
                if (isSidebarOpen) toggleSidebar();
              }}
              className="w-full px-3 p-3 transition-all text-[1.5rem] flex items-center py-[13px] text-gray-400 hover:bg-gray-50 cursor-pointer"
            >
              <FaHandHoldingUsd className="text-[1.3rem]" />
              <span className="ml-2">Invite a store</span>
              <FaLock className="ml-auto text-sm text-gray-300" />
            </Link>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="lg:col-span-10 overflow-y-scroll w-full bg-[#F9F9F9] h-screen">
        {/* Header */}
        <Card
          className={`overflow-visible w-full py-4 px-8 rounded-none sticky top-0 h-[71px] flex flex-row items-center justify-between z-50 bg-white border-b-0 transition-opacity duration-200 ${
            isSidebarOpen
              ? "opacity-0 pointer-events-none lg:opacity-100 lg:pointer-events-auto"
              : "opacity-100"
          }`}
        >
          <button className="lg:hidden" onClick={toggleSidebar}>
            <GiHamburgerMenu size={25} />
          </button>
          <div className="flex items-center gap-3 ml-auto">
            {/* Go Live Button */}
            <Button
              onPress={() => router.push("/register")}
              className="bg-green-500 text-white font-semibold px-5 py-4 text-sm hover:-translate-y-0.5 hover:shadow-lg hover:shadow-green-500/35 transition-all"
            >
              <span className="!text-[14px] !font-medium">
                Unlock More Features →
              </span>
            </Button>

            {/* Sign Up Dropdown */}
            <Dropdown
              placement="bottom-end"
              onOpenChange={setIsDropdownOpen}
              classNames={{
                content: "bg-transparent shadow-none border-none p-0",
              }}
            >
              <DropdownTrigger>
                <Button className="danger-btn flex items-center gap-1">
                  Sign Up{" "}
                  {isDropdownOpen ? (
                    <FiChevronUp className="text-lg" />
                  ) : (
                    <FiChevronDown className="text-lg" />
                  )}
                </Button>
              </DropdownTrigger>

              <DropdownMenu
                aria-label="Auth actions"
                className="bg-zinc-100 rounded-2xl p-2 w-full shadow-lg"
                itemClasses={{
                  base: "w-full gap-3 px-4 py-3 rounded-xl data-[hover=true]:bg-zinc-200 transition-colors",
                }}
              >
                <DropdownItem
                  key="signin"
                  startContent={
                    <RiLoginBoxLine className="text-xl  text-zinc-700" />
                  }
                  onPress={() => router.push("/login")}
                  className="text-zinc-800 !font-extrabold w-full"
                >
                  <span className="py-[1px] block text-zinc-800">Sign In</span>
                </DropdownItem>

                <DropdownItem
                  key="signup"
                  startContent={
                    <RiUserAddLine className="text-xl text-zinc-700" />
                  }
                  onPress={() => router.push("/register")}
                  className="text-zinc-800 border-t border-zinc-200 w-full"
                >
                  <span className="py-[1px] block text-zinc-800">Sign Up</span>
                </DropdownItem>
              </DropdownMenu>
            </Dropdown>
          </div>
        </Card>
        <div className="max-w-[100%] mx-auto lg:p-5 p-1 pt-[20px] px-[15px] bg-fash-gradient min-h-screen h-auto">
          {children}
        </div>
      </div>
    </div>
  );
};

export default TryLayout;
