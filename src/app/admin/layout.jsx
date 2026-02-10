"use client";
import React, { useState, useEffect, useRef } from "react";
import { Card } from "@heroui/react";
import AdminSidebar from "./sidebar";
import { signOutUser } from "@/actions/authActions";
import Swal from "sweetalert2";
import { GiHamburgerMenu } from "react-icons/gi";
import { IoMdClose } from "react-icons/io";
import { Button } from "@heroui/react";
import { SessionProvider } from "next-auth/react";
import { LuLogOut } from "react-icons/lu";
import { usePathname } from "next/navigation";

const AdminLayout = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [shadowClass, setShadowClass] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);
  const pathname = usePathname();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = isSidebarOpen ? "hidden" : "auto";
  }, [isSidebarOpen]);

  const toggleSidebar = () => {
    setShadowClass(isSidebarOpen ? "" : "sidebarOverlay");
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleLogout = async () => {
    const result = await Swal.fire({
      title: "Are you sure you want to log out?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, log me out!",
      cancelButtonText: "No, keep me logged in!",
      reverseButtons: true,
      customClass: {
        confirmButton: "btn-danger",
      },
    });

    if (result.isConfirmed) {
      setLoading(true);
      await signOutUser({ callbackUrl: "/" });
      setLoading(false);
    }
  };

  return (
    <SessionProvider>
      <div
        className={`lg:grid lg:grid-cols-12 min-h-screen flex ${shadowClass}`}
      >
        {isSidebarOpen && (
          <div
            onClick={toggleSidebar}
            className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          />
        )}

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

          <AdminSidebar
            isSidebarOpen={isSidebarOpen}
            toggleSidebar={toggleSidebar}
          />
        </div>

        <div
          ref={scrollRef}
          className="lg:col-span-10 overflow-y-scroll w-full bg-[#F9F9F9] h-screen"
        >
          <Card
            className={`overflow-hidden w-full py-4 px-8 rounded-none sticky top-0 h-[71px] flex flex-row items-center justify-between lg:justify-end z-50 bg-none border-b-0 transition-opacity duration-200
  ${
    isSidebarOpen
      ? "opacity-0 pointer-events-none lg:opacity-100 lg:pointer-events-auto"
      : "opacity-100"
  }`}
          >
            <button className="lg:hidden" onClick={toggleSidebar}>
              <GiHamburgerMenu size={25} />
            </button>

            <div className="cursor-pointer">
              <Button
                isLoading={loading}
                className="danger-btn"
                onPress={handleLogout}
              >
                {loading ? "" : <LuLogOut />}
                Logout
              </Button>
            </div>
          </Card>

          <div className="max-w-[100%] mx-auto lg:p-5 p-1 pt-[20px] px-[15px] min-h-screen h-auto">
            {children}
          </div>
        </div>
      </div>
    </SessionProvider>
  );
};

export default AdminLayout;
