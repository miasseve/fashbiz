"use client";
import { signOutUser } from "@/actions/authActions";
import React from "react";
import { Button } from "@heroui/react";
import getInternetIp from "@/actions/getClientIp";

const LogoutButton = () => {
  const handleLogout = async () => {
    try{
      const ipAddress = await getInternetIp();
      await signOutUser({ ipAddress, callbackUrl: "/" });
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
