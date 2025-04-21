"use client";
import React, { useState, useEffect, useRef } from "react";
import { Card } from "@heroui/react";
import Sidebar from "./sidebar";
import { signOutUser } from "@/actions/authActions";
import Swal from "sweetalert2";
import { GiHamburgerMenu } from "react-icons/gi";
import { IoMdClose } from "react-icons/io";
import { Button } from "@heroui/react";
import { SessionProvider } from "next-auth/react";
import { LuLogOut } from "react-icons/lu";
import { persistor } from "@/store";
import { useDispatch } from "react-redux";
import { clearConsignors, clearProductState } from "@/features/productSlice";
import { clearCart } from "@/features/cartSlice";
import { usePathname } from "next/navigation"; // 👈 Needed for detecting route change

const Layout = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [shadowClass, setShadowClass] = useState("");
  const dispatch = useDispatch();
  const scrollRef = useRef(null); // 👈 Create a ref
  const pathname = usePathname(); // 👈 Detect path change

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [pathname]);

  const toggleSidebar = () => {
    if (shadowClass == "") {
      setShadowClass("sidebarOverlay");
    } else {
      setShadowClass("");
    }
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
      persistor.purge();
      dispatch(clearCart());
      dispatch(clearConsignors());
      dispatch(clearProductState());
      await signOutUser({ callbackUrl: "/login" });
    }
  };

  return (
    <SessionProvider>
      <div
        className={`lg:grid lg:grid-cols-12 min-h-screen shadow-2 flex ${shadowClass}`}
      >
        <div
          className={`fixed lg:relative top-0 left-0 h-full bg-white transition-transform duration-300  border-r border-[#dedede] ${
            isSidebarOpen ? "translate-x-0" : "-translate-x-full"
          } lg:translate-x-0 lg:col-span-2 z-50`}
        >
          <Sidebar
            isSidebarOpen={isSidebarOpen}
            toggleSidebar={toggleSidebar}
          />
        </div>

        <div
          ref={scrollRef}
          className="lg:col-span-10   overflow-y-scroll w-full bg-[#F9F9F9] h-screen"
        >
          <Card className="overflow-hidden  w-full py-4 px-8 rounded-none sticky top-0 h-[71px] flex flex-row items-center justify-between lg:justify-end z-50  bg-none border-b-0 box-shadow-none">
            <button className="lg:hidden" onClick={toggleSidebar}>
              {isSidebarOpen ? (
                <IoMdClose size={25} />
              ) : (
                <GiHamburgerMenu size={25} />
              )}
            </button>

            <div className="cursor-pointer">
              <Button className="danger-btn" onPress={handleLogout}>
                <LuLogOut />
                Logout
              </Button>
            </div>
          </Card>
          <div className="max-w-[100%] mx-auto lg:p-5 p-1 pt-[20px]  px-[15px]  bg-[#FEEBEB] min-h-screen h-auto">
            {children}
          </div>
        </div>
      </div>
    </SessionProvider>
  );
};

export default Layout;
