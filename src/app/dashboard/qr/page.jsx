import React from "react";
import Consignor from "./Consignor";
import { auth } from "@/auth";

export const metadata = {
  title: "QR",
};

const page =async () => {
  const session = await auth();
  const user = session?.user;

  return <Consignor user = {user}/>;
};

export default page;
