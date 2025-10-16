"use client";
import React from "react";
import { Button } from "@heroui/button";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
const BackButton = () => {
  const router = useRouter();
  return (
    <div>
      <Button
        onPress={() => router.push("/dashboard/store")}
        variant="light"
        className="flex items-center gap-2 text-gray-700 hover:text-black"
      >
        <ArrowLeft className="w-5 h-5" />
        Back to Store
      </Button>
    </div>
  );
};

export default BackButton;
