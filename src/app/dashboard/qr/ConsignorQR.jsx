"use client";
import React, { useRef } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { Button } from "@heroui/button";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { enableDemoMode } from "@/actions/accountAction";
import { toast } from "react-toastify";

const ConsignorQR = ({ qrData, stripeResponse, demoLimitReached, user }) => {
  const qrRef = useRef(null);
  const router = useRouter();

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

  const handleExitDemoMode = () => {
    router.push("/dashboard/stripe-connect");
  };

  const handleDemoMode = async () => {
    try {
      const response = await enableDemoMode(user?.id);
      if (response.status === 200) {
        window.location.reload();
      } else {
        console.log("Failed to enable demo mode");
        toast.error("Failed to enable demo mode. Please try again.");
      }
    } catch (error) {
      console.error("Error enabling demo mode:", error);
    }
  };

  // Parse stripe response data to check demo mode
  const stripedata = stripeResponse?.data
    ? JSON.parse(stripeResponse.data)
    : null;
  const isInDemoMode =
    stripedata?.accountId == null &&
    stripedata?.mode === "demo" &&
    !demoLimitReached;

  return (
    <div className="flex flex-col w-full mx-auto lg:my-[10px] bg-white rounded-xl dark:bg-gray-900 transition-all">
      {/* Demo Mode Banner */}
      {isInDemoMode && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-800 px-4 py-3">
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <svg
                  className="w-5 h-5 text-amber-500"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="text-md font-medium text-amber-800 dark:text-amber-300">
                  Demo Mode Active
                </span>
              </div>
              <span className="text-md text-amber-600 dark:text-amber-400 hidden sm:inline">
                • No real payments will be processed
              </span>
            </div>
            <button
              onClick={handleExitDemoMode}
              className="group flex items-center gap-2 px-4 py-1.5 text-md font-semibold text-amber-700 dark:text-amber-300 hover:text-amber-900 dark:hover:text-amber-100 bg-white dark:bg-gray-800 border border-amber-300 dark:border-amber-700 rounded-lg hover:bg-amber-50 dark:hover:bg-gray-700 transition-all duration-200"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 8l4 4m0 0l-4 4m4-4H3"
                />
              </svg>
              <span className="whitespace-nowrap">Exit Demo Mode</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      {stripeResponse.status != 200 ? (
        <div className="flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 py-12 sm:py-20">
          {/* Main Heading */}
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-2 sm:mb-3 text-center px-4">
            Connect Your Payment Gateway
          </h2>

          {/* Subtitle with alert */}
          <div className="flex items-center gap-2 mb-6 sm:mb-8 px-3 sm:px-4 py-2 bg-red-50 dark:bg-red-900/20 rounded-full border border-red-200 dark:border-red-800 max-w-[90%] sm:max-w-none">
            <svg
              className="w-4 h-4 flex-shrink-0 text-red-500"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
            <p className="text-sm sm:text-md text-red-600 dark:text-red-400 font-medium">
              Stripe connection required to generate QR codes
            </p>
          </div>

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

          {/* Secondary CTA - Demo Mode */}
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
            Demo Mode
          </button>

          {/* Updated conditional text - only show when NOT expired */}
          {!demoLimitReached && (
            <p className="text-sm sm:text-md text-gray-500 dark:text-gray-400 text-center max-w-xs sm:max-w-md mt-4 sm:mt-6 leading-relaxed px-4">
              Demo mode lets you generate QR codes and test flows without real
              payments. Perfect for testing your setup!
            </p>
          )}

          {/* Show different message when expired */}
          {demoLimitReached && (
            <p className="text-sm sm:text-md text-orange-600 dark:text-orange-400 text-center max-w-xs sm:max-w-md mt-4 sm:mt-6 leading-relaxed px-4 py-2 bg-orange-100 dark:bg-orange-900/40 rounded-md font-semibold">
              Your demo period has ended. Connect Stripe above to start
              accepting real payments.
            </p>
          )}

          {/* Optional: Feature badges */}
          <div className="flex flex-wrap justify-center gap-4 sm:gap-6 mt-6 sm:mt-8 text-md text-gray-400 px-4">
            <div className="flex items-center gap-1.5">
              <svg
                className="w-3.5 h-3.5 sm:w-4 sm:h-4"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="whitespace-nowrap">Secure</span>
            </div>
            <div className="flex items-center gap-1.5">
              <svg
                className="w-3.5 h-3.5 sm:w-4 sm:h-4"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="whitespace-nowrap">Fast Setup</span>
            </div>
            <div className="flex items-center gap-1.5">
              <svg
                className="w-3.5 h-3.5 sm:w-4 sm:h-4"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
              </svg>
              <span className="whitespace-nowrap">Trusted</span>
            </div>
          </div>
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