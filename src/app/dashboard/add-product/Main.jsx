"use client";
import React, { useState} from "react";
import FirstStep from "./components/FirstStep";
import SecondStep from "./components/SecondStep";
import Link from "next/link";
import QRCode from "./components/QRCode";
import ConsignorSelect from "./components/ConsignorSelect";
import ProgressBar from "./components/ProgressBar";
const Main = ({ user, productCount, stripeResponse }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [count, setCount] = useState(productCount || 0);

  const handleSaveUrl = () => {
    setCurrentStep(currentStep + 1);
  };

  const handleBackStep = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleAddMoreProducts = () => {
    setCount(count + 1);
    setCurrentStep(2);
  };
  const steps = ["Select Consignor", "Product Details", "Finish"];
  return (
    <div className="mx-auto lg:my-[10px] bg-white rounded-xl shadow-sm dark:bg-gray-900 transition-all ">
        <ProgressBar currentStep={currentStep} steps={steps} />
      {/* {stripeResponse.status !== 200 ? (
        <div className="flex flex-col justify-center items-center my-[20rem] mx-auto gap-[17px]">
          <p className="text-red-500 text-center italic font-bold">
            *{stripeResponse.error}
          </p>
          <Link href="/dashboard/stripe-connect" className="success-btn">
            Go to Stripe Connect
          </Link>
        </div>
      ) : (
        <> */}
      {currentStep === 1 && (
        <ConsignorSelect
          step2Handler={handleSaveUrl}
          handleBackStep={handleBackStep}
        />
      )}
      {currentStep === 2 && (
        <FirstStep
          handleSaveUrl={handleSaveUrl}
          handleBackStep={handleBackStep}
        />
      )}
      {currentStep === 3 && (
        <SecondStep
          handleBackStep={handleBackStep}
          user={user}
          productCount={count}
          handleAddMoreProducts={handleAddMoreProducts}
        />
      )}
    </div>
  );
};

export default Main;
