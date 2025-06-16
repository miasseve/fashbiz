import React from "react";
import {
  storeSuccessResult,
  storeAccountDetail,
} from "@/actions/accountAction";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
const page = async ({ params }) => {
  const { accountId } = await params;
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  const res = await storeSuccessResult(accountId);

  if (res.status == 200) {
    const response = await storeAccountDetail(
      session.user.id,
      accountId,
      res.isAccountComplete
    );
    if (response.status == 200) {
      redirect("/dashboard/stripe-connect");
    } else {
      throw new Error(response.error || "Failed to connect stripe account");
    }
  } else {
    throw new Error(res.error || "Failed to connect stripe account");
  }

  return <div>Account Stored Successfully!!</div>;
};

export default page;
