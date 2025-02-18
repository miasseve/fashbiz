import React from "react";
import { auth } from "@/auth";
import AccountForm from "./AccountForm";
import { getAccountIdByUserId } from "@/actions/accountAction";
import StripeButton from "./StripeButton";
import { Card, CardHeader, CardBody, CardFooter } from "@heroui/card";
const page = async () => {
  const session = await auth();
  const result = await getAccountIdByUserId(session.user.id);
  let accountId = "";
  let isAccountComplete = "";

  if (result.status == 200) {
    accountId = result.accountId;
    isAccountComplete = result.isAccountComplete;
  }

  return (
    <div className="flex flex-col gap-[12px] lg:w-[86%]">
      <Card className="p-6">
        <CardBody>
          <p>Account ID - {result?.accountId} is connected with fashbiz</p>
        </CardBody>
      </Card>
      <Card>
        <CardBody>
          {accountId && isAccountComplete == false && (
            <StripeButton accountId={result?.accountId} />
          )}
        </CardBody>
      </Card>
      <Card>
        <CardBody>
          <AccountForm accountId={result?.accountId} />
        </CardBody>
      </Card>
    </div>
  );
};

export default page;
