"use client"; 
import { Button } from "@heroui/button";
import React from "react";

const ErrorComponent = ({ error, reset }) => {
  return (
    <div className="flex flex-col justify-center items-center h-screen">
      <h1 className="text-red-500 text-2xl font-bold mb-4">Something went wrong!</h1>
      <p className="text-gray-700 mb-6">{error?.message}</p>
      <Button
        onPress={reset}
        className="bg-[#0c0907] text-white py-3 px-6 rounded-lg text-lg"
      >
        Retry
      </Button>
    </div>
  );
};

export default ErrorComponent;
