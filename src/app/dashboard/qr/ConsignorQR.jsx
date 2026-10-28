"use client";
import React, { useRef } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { Button } from "@heroui/button";
import Link from "next/link";
import { enableDemoMode } from "@/actions/accountAction";
import { toast } from "react-toastify";

const ConsignorQR = ({ qrData, stripeResponse, demoLimitReached, user }) => {
  const qrRef = useRef(null);

  const downloadQRCode = () => {
    const originalCanvas = qrRef.current.querySelector("canvas");
    if (!originalCanvas) return;
  
    const originalSize = originalCanvas.width;
    const borderSize = 20; // pixels
    const newSize = originalSize + borderSize * 2;
  
    // Create a new canvas with extra white border
    const canvasWithBorder = document.createElement("canvas");
    canvasWithBorder.width = newSize;
    canvasWithBorder.height = newSize;
    const ctx = canvasWithBorder.getContext("2d");
  
    // Fill background with white
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, newSize, newSize);
  
    // Draw the original QR in the center
    ctx.drawImage(originalCanvas, borderSize, borderSize);
  
    // Trigger download
    const url = canvasWithBorder.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = url;
    link.download = `${qrData.firstName}-QRCode.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDemoMode = async () => {
    try {
      const response = await enableDemoMode(user?.id);
      if (response.status === 200) {
        window.location.reload();
      } else {
        console.log("Failed to enable demo mode");
        toast.error("Couldn't continue. Please try again.");
      }
    } catch (error) {
      console.error("Error enabling demo mode:", error);
    }
  };

  return (
    <div className="flex flex-col w-full mx-auto lg:my-[10px] bg-white rounded-xl dark:bg-gray-900 transition-all">
      {/* Main Content */}
      {stripeResponse.status != 200 ? (
        <div className="flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 py-12 sm:py-20">
          {/* Primary CTA - Stripe Connect */}
          <Link
            href="/dashboard/stripe-connect"
            className="group relative w-full max-w-xs sm:max-w-sm mb-3 sm:mb-4"
          >
            <div className="absolute -inset-0.5 bg-gradient-to-r from-green-600 to-emerald-600 rounded-lg sm:rounded-xl blur opacity-60 group-hover:opacity-100 transition duration-300"></div>
            <div className="relative bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-lg sm:rounded-xl font-semibold text-base sm:text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center gap-2">
              <svg
                className="w-4 h-4 sm:w-5 sm:h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
              <span className="whitespace-nowrap">Go to Stripe Connect</span>
            </div>
          </Link>

          {/* Divider */}
          <div className="flex items-center gap-3 sm:gap-4 w-full max-w-xs sm:max-w-sm my-4 sm:my-6">
            <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700"></div>
            <span className="text-md sm:text-md text-gray-500 dark:text-gray-400 font-medium">
              OR
            </span>
            <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700"></div>
          </div>

          {/* Secondary CTA - Skip for now (continue without connecting Stripe) */}
          <button
            onClick={handleDemoMode}
            disabled={demoLimitReached}
            className="w-full max-w-xs sm:max-w-sm px-6 sm:px-8 py-3 sm:py-4 rounded-lg sm:rounded-xl font-semibold text-base sm:text-lg border-2 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all duration-200 flex items-center justify-center gap-2 group disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:border-gray-200 dark:disabled:hover:border-gray-700 relative"
          >
            {/* Expired Badge */}
            {demoLimitReached && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-md font-bold px-2 py-1 rounded-full shadow-lg animate-pulse">
                Expired
              </span>
            )}
            <svg
              className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition group-disabled:text-gray-300 dark:group-disabled:text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            Skip for now
          </button>

          {/* Show different message when limit reached */}
          {demoLimitReached && (
            <p className="text-sm sm:text-md text-orange-600 dark:text-orange-400 text-center max-w-xs sm:max-w-md mt-4 sm:mt-6 leading-relaxed px-4 py-2 bg-orange-100 dark:bg-orange-900/40 rounded-md font-semibold">
              You've reached your free upload limit. Connect Stripe above to start
              accepting real payments.
            </p>
          )}

        </div>
      ) : (
        <div className="flex flex-col bg-white dark:bg-gray-900 p-[100px] gap-10 lg:w-[50%] h-[100%] items-center m-auto justify-center p-4 border rounded-lg shadow-md">
          <div className="mt-4" ref={qrRef}>
            <QRCodeCanvas value={JSON.stringify(qrData)} size={110} />
          </div>
          <Button
            color="success"
            onPress={downloadQRCode}
            className="text-white py-6 px-6 rounded-lg text-lg mt-[20px]"
          >
            Download QR Code
          </Button>
        </div>
      )}
    </div>
  );
};

export default ConsignorQR;