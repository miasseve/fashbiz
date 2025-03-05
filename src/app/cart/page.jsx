import React from "react";
import CartItems from "./components/CartItems";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

const page = async () => {
  const session = await auth();
  if (!session) {
    redirect("/login"); 
  }

  return <CartItems user={session.user} />;
};

export default page;
