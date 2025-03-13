import React from "react";
import StripeConnect from "./StripeConnect";
import { getAccountId, getPercentage } from "@/actions/accountAction";
import PercentForm from "./PercentForm";
import StripeButton from "./StripeButton";
import { Card, CardBody } from "@heroui/card";

const page = async () => {
  let accountId = "";
  let isAccountComplete = "";
  let percentage = null;
  let userRole = "";
  const result = await getAccountId();
  const response = await getPercentage();

  if (response.status == 200) {
    percentage = response.percentage;
  }

  if (result.status == 200) {
    accountId = result.accountId;
    isAccountComplete = result.isAccountComplete;
    userRole = result.userRole;
  }

  return (
    <div className="flex flex-col gap-[12px] lg:w-[86%]">
      {result?.accountId && (
        <>
          <Card className="p-12 border border-green-500">
            <CardBody>
              <p>
                Account ID -{" "}
                <span style={{ color: "#c52d2d" }} className="font-semibold">
                  {result?.accountId}
                </span>{" "}
                is connected with fashbiz
              </p>
            </CardBody>
          </Card>
          {userRole == "store" && <PercentForm percentage={percentage} />}
        </>
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
          <StripeConnect />
        </CardBody>
      </Card>
    </div>
  );
};

export default page;
