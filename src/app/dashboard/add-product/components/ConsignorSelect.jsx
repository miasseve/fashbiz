import React from "react";
import { Button } from "@heroui/button";
import { useSelector } from "react-redux";
import QRScanner from "./QRScanner";

const ConsignorSelect = ({ step2Handler }) => {
  const consignor = useSelector((state) => state.product.consignor);

  return (
    <div className="text-center ">
      <QRScanner />
      <div className="text-center mb-10">
        {Object.keys(consignor).length > 0 && (
          <>
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
          </>
        )}
      </div>

      <Button
        onPress={step2Handler}
        isDisabled={Object.keys(consignor).length === 0}
        className=" text-[1.2rem] px-6 py-6 rounded-[8px]"
        color="danger"
      >
        Next
      </Button>
    </div>
  );
};

export default ConsignorSelect;
