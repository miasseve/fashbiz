import React from "react";
const ProgressBar = ({ currentStep = 1, steps = [] }) => {
  const getProgressWidth = () => {
    if (steps.length <= 1) return "0%";
    return `${((currentStep - 1) / (steps.length - 1)) * 100}%`;
  };
  return (
    <div className="w-full ">
      <div className="flex justify-between items-center relative mb-4">
        {steps.map((label, index) => {
          const step = index + 1;
          const isCompleted = currentStep > step;
          const isActive = currentStep === step;
          return (
            <div key={label} className="flex flex-col items-center w-full">
              <div
                className={`w-10 h-10 rounded-full pr-[3px] flex items-center justify-center text-white text-lg font-bold  ${
                  isCompleted
                    ? "bg-[#fa9797]"
                    : isActive
                    ? "bg-[#fa9797]"
                    : "bg-gray-300"
                }`}
              >
                 {isCompleted ? "✓" : step}
              </div>
              <span className="text-xl mt-2 text-center">{label}</span>{" "}
            </div>
          );
        })}{" "}
      </div>{" "}
      <div className="relative h-2 bg-gray-200 rounded-full m-auto w-[90%]">
        {" "}
        <div
          className="absolute h-2 bg-[#f8b1b1] rounded-full transition-all duration-500"
          style={{ width: getProgressWidth() }}
        />{" "}
      </div>{" "}
    </div>
  );
};
export default ProgressBar;
