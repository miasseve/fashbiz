"use client";
import { Button } from "@heroui/button";
import Link from "next/link";
import React from "react";

const page = () => {
  return (
    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 ">
      <div className="text-center">
        <div className=""></div>
        <h1 className="text-[30px]">Thank You for Your Purchase!</h1>
        <p className="text-center">Your payment was successful.</p>
        <Button
          as={Link}
          href="/"
          color="primary"
          className="bg-[#0c0907] text-white py-6 px-6 rounded-lg text-lg mt-4"
        >
          Home
        </Button>
      </div>
    </div>
  );
};

export default page;
