import React from "react";
import { auth } from "@/auth";
import AccountForm from "./AccountForm";
import { getAccountIdByUserId } from "@/actions/accountAction";
const page = async () => {
  const session = await auth();
  const res = await getAccountIdByUserId(session.user.id);

  return (
    <div>
      <p>Stripe Connect</p>

      <AccountForm accountId={res.accountId} />
    </div>
  );
};

export default page;
