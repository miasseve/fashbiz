"use client";
import { signOutUser } from "@/actions/authActions";
import React from "react";
import { Button } from "@heroui/react";

const LogoutButton = () => {
  const handleLogout = async () => {
    try {
      await signOutUser({ callbackUrl: "/" });
    } catch (err) {
      console.error("Logout Error:", err);
    }
  };

  return (
    <Button color="primary" onPress={handleLogout}>
      Logout
    </Button>
  );
};

export default LogoutButton;
