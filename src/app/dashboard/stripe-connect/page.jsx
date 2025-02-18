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
      {result?.accountId && (
        <Card className="p-12 border border-green-500">
          <CardBody>
            <p>Account ID - <span style={{color:'#c52d2d'}} className="font-semibold">{result?.accountId}</span> is connected with fashbiz</p>
          </CardBody>
        </Card>
      )}

      {accountId && isAccountComplete == false && (
        <Card>
          <CardBody>
            <StripeButton accountId={result?.accountId} />
          </CardBody>
        </Card>
      )}

      <Card>
        <CardBody>
          <AccountForm accountId={result?.accountId} />
        </CardBody>
      </Card>
    </div>
  );
};

export default page;
