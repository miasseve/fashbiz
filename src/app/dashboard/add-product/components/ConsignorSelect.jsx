import React from "react";
import { Button } from "@heroui/button";
import { useSelector } from "react-redux";
import QRScanner from "./QRScanner";
import { Card } from "@heroui/card";

const ConsignorSelect = ({ step2Handler }) => {
  const consignor = useSelector((state) => state.product.consignor);

  return (
    <Card className="mx-auto lg:my-[10px]  bg-white rounded-xl shadow-sm dark:bg-gray-900 transition-all">
        <QRScanner />
          {Object.keys(consignor).length > 0 && (
            <>
             <div className="text-center mb-10 bg-[#f6f6f6] py-[15px] px-4 sm:px-0 sm:w-[498px] mx-auto border border-[silver] mb-[20px]">
       
              <h3 className="font-semibold text-lg">Scanned Data:</h3>
              <pre className="whitespace-pre-wrap">
                Name :{" "}
                <span>
                  {consignor?.firstName} {consignor?.lastName}
                </span>
              </pre>
              <pre>
                {" "}
                Email : <span>{consignor?.email} </span>
              </pre>
              <pre>
                Account : <span>{consignor?.accountId} </span>{" "}
              </pre>
              </div>
            </>      
          )}
        <Button
          onPress={step2Handler}
          isDisabled={Object.keys(consignor).length === 0}
          className="danger-btn !mb-[20px] m-auto"
        >
          Next
        </Button>
    </Card>
  );
};

export default ConsignorSelect;
