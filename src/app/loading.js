'use client';
import React from "react";
import { Spinner } from "@heroui/react";

const Loading = () => {
  return (
    <div className="flex flex-col justify-center items-center h-screen">
      <Spinner size="lg" color="success" label="Loading..." />
    </div>
  );
};

export default Loading;
