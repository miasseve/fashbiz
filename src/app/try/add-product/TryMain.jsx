"use client";
import React, { useEffect } from "react";
import FirstStep from "@/app/dashboard/add-product/components/FirstStep";
import TrySecondStep from "./TrySecondStep";
import ProgressBar from "@/app/dashboard/add-product/components/ProgressBar";
import { setCurrentStep } from "@/features/productSlice";
import { useSelector, useDispatch } from "react-redux";
import Link from "next/link";

const TryMain = () => {
  const dispatch = useDispatch();
  const currentStep = useSelector((state) => state.product.currentStep);

  useEffect(() => {
    dispatch(setCurrentStep(1));
  }, [dispatch]);

  const handleSaveUrl = () => {
    dispatch(setCurrentStep(currentStep + 1));
  };

  const handleBackStep = () => {
    if (currentStep > 1) {
      dispatch(setCurrentStep(currentStep - 1));
    }
  };

  const handleAddMoreProducts = () => {
    dispatch(setCurrentStep(1));
  };

  const steps = ["Upload Photos", "Product Details"];

  return (
    <div className="mx-auto lg:my-[10px] bg-white rounded-xl transition-all">
      {/* Demo Mode Banner */}
      <div className="bg-amber-50 border-b border-amber-200 px-4 py-3 rounded-t-xl">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <span className="text-md font-medium text-amber-800">
                Demo Mode
              </span>
            </div>
            <span className="text-md text-amber-600 hidden sm:inline">
              • Add products & preview them live on the test store
            </span>
          </div>
          <Link
            href="/register"
            className="group flex items-center gap-2 px-4 py-1.5 text-sm font-semibold text-white bg-green-500 rounded-lg hover:bg-green-600 transition-all duration-200"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
            <span className="whitespace-nowrap !text-[14px]">Go Live</span>
          </Link>
        </div>
      </div>

      <ProgressBar currentStep={currentStep} steps={steps} />

      {currentStep === 1 && (
        <FirstStep
          handleSaveUrl={handleSaveUrl}
          handleBackStep={handleBackStep}
        />
      )}
      {currentStep === 2 && (
        <TrySecondStep
          handleBackStep={handleBackStep}
          handleAddMoreProducts={handleAddMoreProducts}
        />
      )}
    </div>
  );
};

export default TryMain;
