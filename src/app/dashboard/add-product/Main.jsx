"use client";
import React, { useState } from "react";
import FirstStep from "./components/FirstStep";
import SecondStep from "./components/SecondStep";
import Link from "next/link";
import QRCode from "./components/QRCode";
import { setCurrentStep } from "@/features/productSlice";
import { useSelector, useDispatch } from "react-redux";
import ConsignorSelect from "./components/ConsignorSelect";
import ProgressBar from "./components/ProgressBar";
const Main = ({ user, productCount, stripeResponse }) => {
  const currentStep = useSelector((state) => state.product.currentStep);
  const [count, setCount] = useState(productCount || 0);
  const dispatch = useDispatch();

  const handleSaveUrl = () => {
    dispatch(setCurrentStep(currentStep + 1));
  };

  const handleBackStep = () => {
    dispatch(setCurrentStep(currentStep - 1));
  };

  const handleAddMoreProducts = () => {
    setCount(count + 1);
    dispatch(setCurrentStep(2));
  };

  const steps = ["Select Consignor", "Product Details", "Finish"];

  return (
    <div className="mx-auto lg:my-[10px] bg-white rounded-xl dark:bg-gray-900 transition-all ">
        <ProgressBar currentStep={currentStep} steps={steps} />
      {stripeResponse.status !== 200 ? (
        <div className="flex flex-col justify-center items-center my-[10rem] mx-auto gap-[17px] pb-20">
          <p className="text-red-500 text-center italic font-bold">
            *{stripeResponse.error}
          </p>
          <Link href="/dashboard/stripe-connect" className="success-btn">
            Go to Stripe Connect
          </Link>
        </div>
      ) : (
        <>
          {currentStep == 1 && (
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
        </>
      )}
    </div>
  );
};

export default Main;
