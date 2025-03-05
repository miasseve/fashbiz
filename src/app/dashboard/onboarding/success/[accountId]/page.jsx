import React from "react";
import { storeSuccessResult } from "@/actions/accountAction";
import { redirect } from "next/navigation";
const page = async ({ params }) => {
  const { accountId } = await params;
  const response = await storeSuccessResult(accountId);
  if (response.status === 200) {
    redirect("/dashboard/stripe-connect");
  } else {
    throw new Error(response.error || "Failed to connect stripe account");
  }

  return <div>Account Stored Successfully!!</div>;
};

export default page;
