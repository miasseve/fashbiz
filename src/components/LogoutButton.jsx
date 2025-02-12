"use client";
import { signOutUser } from "@/actions/authActions";
import React from "react";
import { Button } from "@heroui/react";

const LogoutButton = () => {
  const handleLogout = async () => {
    const res = await signOutUser();
  };

  return (
    <Button color="primary" onPress={handleLogout}>
      Logout
    </Button>
  );
};

export default LogoutButton;
