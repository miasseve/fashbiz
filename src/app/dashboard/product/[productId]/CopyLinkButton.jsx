"use client";
import React, { useState } from "react";
import { FiCopy, FiCheck } from "react-icons/fi";
import { Button } from "@heroui/button";
const CopyLinkButton = ({ productId }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      const productUrl = `${
        process.env.NODE_ENV == "development"
          ? process.env.NEXT_PUBLIC_FRONTEND_URL
          : process.env.NEXT_PUBLIC_FRONTEND_LIVE_URL
      }/product/${productId}`;

      await navigator.clipboard.writeText(productUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  return (
    <Button onPress={handleCopy} className="auth-btn">
      {copied ? (
        <>
          <FiCheck size={18} /> Copied!
        </>
      ) : (
        <>
          <FiCopy size={18} /> Copy Link
        </>
      )}
    </Button>
  );
};

export default CopyLinkButton;
