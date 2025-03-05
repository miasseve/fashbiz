// changes in this file
"use client";

import React, { useState } from "react";
import { Card } from "@heroui/react";
import Sidebar from "./sidebar";
import { GiHamburgerMenu } from "react-icons/gi";
import { IoMdClose } from "react-icons/io";
import { SessionProvider } from "next-auth/react";

const Layout = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [shadowClass, setShadowClass] = useState("");

  const toggleSidebar = () => {
    if (shadowClass == "") {
      setShadowClass("sidebarOverlay");
    } else {
      setShadowClass("");
    }

    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <SessionProvider>
      <div
        className={`lg:grid lg:grid-cols-12 min-h-screen shadow-2 flex ${shadowClass}`}
      >
        <div
          className={`fixed lg:relative top-0 left-0 h-full bg-white shadow-lg transition-transform duration-300 ${
            isSidebarOpen ? "translate-x-0" : "-translate-x-full"
          } lg:translate-x-0 lg:col-span-2 z-50`}
        >
          <Sidebar />
        </div>

        <div className="lg:col-span-10 bg-[#F3F4F7] overflow-scroll h-screen border-r border[#e7e7e7] w-full">
          <Card className="overflow-hidden border-0 bg-white w-full py-4 px-8 rounded-none sticky top-0 h-[70px] shadow-2 flex flex-row items-center justify-between lg:justify-end z-50">
            <button className="lg:hidden" onClick={toggleSidebar}>
              {isSidebarOpen ? (
                <IoMdClose size={25} />
              ) : (
                <GiHamburgerMenu size={25} />
              )}
            </button>
            <div className="cursor-pointer">
              <img className="w-[18px]" src="/visualization.png" alt="Logo" />
            </div>
          </Card>
          <div className="max-w-[100%] mx-auto lg:p-5 p-1 ">{children}</div>
        </div>
      </div>
    </SessionProvider>
  );
};

export default Layout;
