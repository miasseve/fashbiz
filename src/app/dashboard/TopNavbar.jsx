"use client";
import React from "react";
import { Button, Navbar, NavbarBrand, NavbarContent } from "@heroui/react";
import Link from "next/link";
// import NavLink from './NavLink'
import { GiMatchTip } from "react-icons/gi";

const TopNavbar = () => {
  return (
    <Navbar
      maxWidth="xl"
      className="bg-gradient-to-r from-purple-400 to-purple-700"
      classNames={{
        item: [
          "text-xl",
          "text-white",
          "uppercase",
          "data-[active=true]:text-yellow-200",
        ],
      }}
    >
      <NavbarBrand as={Link} href="/">
        <GiMatchTip size={40} className="text-gray-200" />
        <div className="font-bold text-3xl flex">
          <span className="text-gray-900">Fashion</span>
          <span className="text-gray-200">App</span>
        </div>
      </NavbarBrand>

      <NavbarContent justify="end">
        <>
          <Button
            as={Link}
            href="/login"
            variant="bordered"
            className="text-white"
          >
            Logoutt
          </Button>
        </>
      </NavbarContent>
    </Navbar>
  );
};

export default TopNavbar;
