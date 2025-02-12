"use client";
import React from "react";
import Swal from 'sweetalert2';
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BiLogoProductHunt } from "react-icons/bi";
import { FaStore } from "react-icons/fa";
import { FaUser } from "react-icons/fa";
import { FaUsers } from "react-icons/fa";
import { CgProfile } from "react-icons/cg";
import { LuLogOut } from "react-icons/lu";
import { IoMdSettings } from "react-icons/io";
import { signOutUser } from "@/actions/authActions";


const Sidebar = () => {
  const pathname = usePathname();

  const handleLogout = async () => {
    const result = await Swal.fire({
      title: 'Are you sure you want to log out?',
      icon: 'warning',
      showCancelButton: true, // Shows a cancel button
      confirmButtonText: 'Yes, log me out!',
      cancelButtonText: 'No, keep me logged in!',
      reverseButtons: true, // Reverses the position of confirm and cancel buttons
      customClass: {
        confirmButton:'btn-danger'
      }
    });
  
    if (result.isConfirmed) {
      // Perform logout actions (e.g., clearing user session or token)
      // Example: localStorage.removeItem('userToken');
      await signOutUser({ callbackUrl: "/login" }); // Assuming signOutUser handles sign-out and redirect
    }
  };

  return (
    <div>
    <div className="logo text-[2rem] font-bold text-center bd-white">
      <Link href="/">
        <img
          src="/fashlogo.svg"
          className="w-[147px] mx-auto"
        />
      </Link>
    </div>
    <nav className="flex flex-col items-start text-lg w-full text-[1rem] nabbar">
      {[
        { name: "Profile", href: "/dashboard/profile",icon:<FaUser/> },
        { name: "Store", href: "/dashboard/store",icon:<FaStore/> },
        { name: "Consignors", href: "/dashboard/consignors",icon:<FaUsers/> },
        { name: "Add Product", href: "/dashboard/add-product",icon:<BiLogoProductHunt/> },
        // { name: "Settings", href: "/dashboard/settings" ,icon:<IoMdSettings/>},
      ].map((link, index) => (
        <Link
          key={index}
          href={link.href}
          className={`block w-full px-3 p-3  transition-all text-[1.5rem] flex items-center py-[13px] ${
            pathname === link.href
              ? "bg-[#e6e6e6] text-black"
              : "hover:bg-[#f1f3f1] hover:text-black"
          }`}
        >
         <span className="mr-2">{link.icon}</span>
          {link.name}
        </Link>
      ))}
         <button
            onClick={handleLogout}
            className={`block w-full px-3 p-3 transition-all text-[1.5rem] flex items-center ${
              pathname === "/dashboard/logout"
                ? "bg-[#e6e6e6] text-black"
                : "hover:bg-[#f1f3f1] hover:text-black"
            }`}
          >
             <span className="mr-2">{<LuLogOut/>}</span>
            Logout
          </button>
    </nav>
  </div>
  );
};

export default Sidebar;
