import React from "react";
import { auth } from "@/auth";
import AccountForm from "./AccountForm";
import { getAccountIdByUserId } from "@/actions/accountAction";
import StripeButton from "./StripeButton";
const page = async () => {
  const session = await auth();
  const res = await getAccountIdByUserId(session.user.id);
  let accountId = "";
  let isAccountComplete = "";

  if (res.status == 200) {
    accountId = res.accountId;
    isAccountComplete = res.isAccountComplete;
  }

  return (
    <div>
      <p>Account ID - {res?.accountId} is connected with fashbiz</p>
      {accountId && isAccountComplete == false && (
        <StripeButton accountId={res?.accountId} />
      )}
      <AccountForm accountId={res?.accountId} />
    </div>
  );
};

export default page;
