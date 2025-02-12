'use client';
import React from 'react'
import {IoArrowBack } from "react-icons/io5";
import { useRouter } from "next/navigation";
import { Button } from '@heroui/button';
const BackButton = () => {
    const router = useRouter();
    const handleBackStep = () => {
        router.push("/dashboard/store");
      };

      
  return (
      <Button onPress={handleBackStep}>
        {/* <IoArrowBack /> */}
        Back
      </Button>
  )
}

export default BackButton