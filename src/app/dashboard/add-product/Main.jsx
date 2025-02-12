"use client";
import React, { useState } from "react";
import FirstStep from "./components/FirstStep";
import SecondStep from "./components/SecondStep";
import ConsignorSelect from "./components/ConsignorSelect";

const Main = ({ user, productCount }) => {
  const [currentStep, setCurrentStep] = useState(1);

  const handleSaveUrl = (uploadedUrl) => {
    setCurrentStep(currentStep + 1);
  };

  const handleBackStep = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleAddMoreProducts = () => {
    setCurrentStep(2);
  };

  return (
    <div>
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
          productCount={productCount}
          handleAddMoreProducts={handleAddMoreProducts}
        />
      )}
    </div>
  );
};

export default Main;
