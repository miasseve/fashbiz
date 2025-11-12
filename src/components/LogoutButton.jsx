"use client";
import { signOutUser } from "@/actions/authActions";
import React from "react";
import { Button } from "@heroui/react";
import getInternetIp from "@/actions/getClientIp";

const LogoutButton = () => {
  const handleLogout = async () => {
    try{
      const res = await fetch("https://api.ipify.org?format=json");
      const data = await res.json();
      await signOutUser({ ipAddress: data.ip, callbackUrl: "/" });
    }catch(err){  
      console.error("Logout Error:", err);
      await signOutUser({ callbackUrl: "/" });
    }
  };

  return (
    <Button color="primary" onPress={handleLogout}>
      Logout
    </Button>
  );
};

export default LogoutButton;
