"use client";
import React, { useState, useEffect, useRef } from "react";
import { Card } from "@heroui/react";
import Sidebar from "./sidebar";
import { signOutUser } from "@/actions/authActions";
import Swal from "sweetalert2";
import { GiHamburgerMenu } from "react-icons/gi";
import { IoMdClose } from "react-icons/io";
import {
  Button,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from "@heroui/react";
import { SessionProvider } from "next-auth/react";
import { LuLogOut } from "react-icons/lu";
import { FiChevronUp, FiChevronDown } from "react-icons/fi";
import { persistor } from "@/store";
import { useDispatch, useSelector } from "react-redux";
import { clearConsignors, clearProductState } from "@/features/productSlice";
import { clearCart } from "@/features/cartSlice";
import { usePathname } from "next/navigation";
import ChatBot from "@/components/ChatBot";
import NotificationBell from "@/components/NotificationBell";

const DashboardContent = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [shadowClass, setShadowClass] = useState("");
  const [loading, setLoading] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dispatch = useDispatch();
  const { currentStep } = useSelector((state) => state.product);
  const scrollRef = useRef(null);
  const pathname = usePathname();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [pathname, currentStep]);

  // LOCK BACKGROUND SCROLL
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
      persistor.purge();
      dispatch(clearCart());
      dispatch(clearConsignors());
      dispatch(clearProductState());
      await signOutUser({ callbackUrl: "/" });
      setLoading(false);
    }
  };

  return (
    <div className={`lg:grid lg:grid-cols-12 h-screen overflow-hidden flex ${shadowClass}`}>
      {/* OVERLAY */}
      {isSidebarOpen && (
        <div
          onClick={toggleSidebar}
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
        />
      )}

      {/* SIDEBAR */}
      <div
        className={`fixed lg:relative top-0 left-0 h-full w-[280px] sm:w-full bg-white transition-transform duration-300 border-r border-[#dedede]
        ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0 lg:col-span-2 z-50`}
      >
        {/* CLOSE BUTTON TOP RIGHT */}
        <button
          onClick={toggleSidebar}
          className="absolute top-4 right-4 lg:hidden"
        >
          <IoMdClose size={28} />
        </button>

        <Sidebar isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
      </div>

      {/* MAIN CONTENT */}
      <div
        ref={scrollRef}
        className="lg:col-span-10 overflow-y-auto w-full bg-[#F9F9F9] h-screen"
      >
        {/* HEADER */}
        <Card
          className={`overflow-visible w-full py-4 px-8 rounded-none sticky top-0 h-[71px] flex flex-row items-center justify-between lg:justify-end z-50 bg-white border-b-0 transition-opacity duration-200
${
  isSidebarOpen
    ? "opacity-0 pointer-events-none lg:opacity-100 lg:pointer-events-auto"
    : "opacity-100"
}`}
        >
          <button className="lg:hidden" onClick={toggleSidebar}>
            <GiHamburgerMenu size={25} />
          </button>

          <div className="flex items-center gap-3">
            <NotificationBell />
            <Dropdown placement="bottom-end" onOpenChange={setIsDropdownOpen}>
              <DropdownTrigger>
                <Button className="danger-btn flex items-center gap-1">
                  My Account{" "}
                  {isDropdownOpen ? (
                    <FiChevronUp className="text-lg" />
                  ) : (
                    <FiChevronDown className="text-lg" />
                  )}
                </Button>
              </DropdownTrigger>
              <DropdownMenu
                aria-label="Account actions"
                className=""
                itemClasses={{
                  base: "w-full gap-3 px-4 py-3 rounded-xl data-[hover=true]:bg-zinc-200 transition-colors",
                }}
              >
                <DropdownItem
                  key="logout"
                  startContent={<LuLogOut className="text-xl text-zinc-700" />}
                  onPress={handleLogout}
                  className="w-full px-4 rounded-xl"
                >
                  <span className="py-[1px] block text-zinc-800">
                    {loading ? "Logging out..." : "Logout"}
                  </span>
                </DropdownItem>
              </DropdownMenu>
              {/* <DropdownMenu aria-label="Account actions">
                <DropdownItem
                  key="logout"
                  startContent={<LuLogOut className="text-lg" />}
                  onPress={handleLogout}
                >
                  {loading ? "Logging out..." : "Logout"}
                </DropdownItem>
              </DropdownMenu> */}
            </Dropdown>
          </div>
        </Card>

        <div className="max-w-[100%] mx-auto lg:p-5 p-1 pt-[20px]  px-[15px] bg-fash-gradient min-h-screen h-auto">
          {children}
        </div>
      </div>
    </div>
  );
};

const Layout = ({ children }) => {
  return (
    <SessionProvider>
      <DashboardContent>{children}</DashboardContent>
      <ChatBot />
    </SessionProvider>
  );
};

export default Layout;
