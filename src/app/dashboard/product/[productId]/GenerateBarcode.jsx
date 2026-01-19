"use client";
import bwipjs from "bwip-js";
import { FaBarcode } from "react-icons/fa6";
import React, { useEffect, useRef } from "react";
import {
  Button,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
} from "@heroui/react";

export default function GenerateBarcode({
  barcode,
  points = null,
  price = null,
  size,
  currency,
}) {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const canvasRef = useRef(null);
  const formatPrice = (price, currency) => {
    if (price == null) return "";
    return currency === "€" ? `${currency}${price}` : `${price} ${currency}`;
  };

  // Generate barcode whenever modal opens
  useEffect(() => {
    if (isOpen && canvasRef.current && barcode) {
      try {
        bwipjs.toCanvas(canvasRef.current, {
          bcid: "code128",
          text: barcode,
          scale: 3,
          height: 15,
          includetext: true,
          textxalign: "center",
          textsize: 12,
          paddingleft: 10,
          paddingright: 10,
          paddingtop: 5,
          paddingbottom: 5,
        });
      } catch (e) {
        console.error("Barcode generation error:", e);
      }
    }
  }, [isOpen, barcode]);

  const downloadBarcode = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      // Create professional barcode canvas
      const barcodeCanvas = document.createElement("canvas");

      bwipjs.toCanvas(barcodeCanvas, {
        bcid: "code128",
        text: barcode,
        scale: 4,
        height: 20,
        includetext: true,
        textxalign: "center",
        textsize: 13,
        paddingleft: 20,
        paddingright: 20,
        paddingtop: 10,
        paddingbottom: 10,
      });

      // Get barcode dimensions
      const barcodeWidth = barcodeCanvas.width;
      const barcodeHeight = barcodeCanvas.height;

      // Calculate dimensions for retail tag layout
      const dividerHeight = 2;
      const infoSectionHeight = 80;
      const topPadding = 0;
      const bottomPadding = 15;
      const sidePadding = 30;

      const totalHeight =
        topPadding +
        barcodeHeight +
        dividerHeight +
        infoSectionHeight +
        bottomPadding;
      const totalWidth = Math.max(barcodeWidth + sidePadding * 2, 450);

      // Create final canvas
      const finalCanvas = document.createElement("canvas");
      finalCanvas.width = totalWidth;
      finalCanvas.height = totalHeight;

      const ctx = finalCanvas.getContext("2d");

      // White background
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, finalCanvas.width, finalCanvas.height);

      // Draw barcode centered
      const barcodeX = (finalCanvas.width - barcodeWidth) / 2;
      ctx.drawImage(barcodeCanvas, barcodeX, topPadding);

      // Draw horizontal divider line
      const dividerY = topPadding + barcodeHeight;
      ctx.strokeStyle = "#333333";
      ctx.lineWidth = dividerHeight;
      ctx.beginPath();
      ctx.moveTo(sidePadding, dividerY);
      ctx.lineTo(finalCanvas.width - sidePadding, dividerY);
      ctx.stroke();

      // Calculate positions for price and size (retail tag style)
      const infoY = dividerY + 50;
      const centerX = finalCanvas.width / 2;

      // Draw price on the left side
      ctx.textAlign = "center";
      ctx.font = "bold 48px Arial, sans-serif";
      ctx.fillStyle = "#000000";
      const priceX = centerX / 2 + sidePadding / 2;
      ctx.fillText(formatPrice(price, currency), priceX, infoY);

      // Draw vertical separator
      ctx.strokeStyle = "#666666";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(centerX, dividerY + 15);
      ctx.lineTo(centerX, dividerY + infoSectionHeight - 15);
      ctx.stroke();

      // Draw size on the right side
      ctx.font = "600 40px Arial, sans-serif";
      ctx.fillStyle = "#1a1a1a";
      const sizeX = centerX + centerX / 2 - sidePadding / 2;
      ctx.fillText(`Size: ${size}`, sizeX, infoY);

      // Download
      const link = document.createElement("a");
      link.download = `barcode_${barcode}.png`;
      link.href = finalCanvas.toDataURL("image/png");
      link.click();
    } catch (e) {
      console.error("Download barcode generation error:", e);
    }
  };

  const printBarcode = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      // Create professional barcode canvas
      const barcodeCanvas = document.createElement("canvas");

      bwipjs.toCanvas(barcodeCanvas, {
        bcid: "code128",
        text: barcode,
        scale: 4,
        height: 20,
        includetext: true,
        textxalign: "center",
        textsize: 13,
        paddingleft: 20,
        paddingright: 20,
        paddingtop: 10,
        paddingbottom: 10,
      });

      // Get barcode dimensions
      const barcodeWidth = barcodeCanvas.width;
      const barcodeHeight = barcodeCanvas.height;

      // Calculate dimensions for retail tag layout
      const dividerHeight = 2;
      const infoSectionHeight = 80;
      const topPadding = 0;
      const bottomPadding = 15;
      const sidePadding = 30;

      const totalHeight =
        topPadding +
        barcodeHeight +
        dividerHeight +
        infoSectionHeight +
        bottomPadding;
      const totalWidth = Math.max(barcodeWidth + sidePadding * 2, 450);

      // Create final canvas
      const finalCanvas = document.createElement("canvas");
      finalCanvas.width = totalWidth;
      finalCanvas.height = totalHeight;

      const ctx = finalCanvas.getContext("2d");

      // White background
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, finalCanvas.width, finalCanvas.height);

      // Draw barcode centered
      const barcodeX = (finalCanvas.width - barcodeWidth) / 2;
      ctx.drawImage(barcodeCanvas, barcodeX, topPadding);

      // Draw horizontal divider line
      const dividerY = topPadding + barcodeHeight;
      ctx.strokeStyle = "#333333";
      ctx.lineWidth = dividerHeight;
      ctx.beginPath();
      ctx.moveTo(sidePadding, dividerY);
      ctx.lineTo(finalCanvas.width - sidePadding, dividerY);
      ctx.stroke();

      // Calculate positions for price and size (retail tag style)
      const infoY = dividerY + 50;
      const centerX = finalCanvas.width / 2;

      // Draw price on the left side
      ctx.textAlign = "center";
      ctx.font = "bold 48px Arial, sans-serif";
      ctx.fillStyle = "#000000";
      const priceX = centerX / 2 + sidePadding / 2;
      ctx.fillText(formatPrice(price, currency), priceX, infoY);

      // Draw vertical separator
      ctx.strokeStyle = "#666666";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(centerX, dividerY + 15);
      ctx.lineTo(centerX, dividerY + infoSectionHeight - 15);
      ctx.stroke();

      // Draw size on the right side
      ctx.font = "600 40px Arial, sans-serif";
      ctx.fillStyle = "#1a1a1a";
      const sizeX = centerX + centerX / 2 - sidePadding / 2;
      ctx.fillText(`Size: ${size}`, sizeX, infoY);

      // Convert to image
      const imageData = finalCanvas.toDataURL("image/png");

      // Create print iframe
      const iframe = document.createElement("iframe");
      iframe.style.position = "absolute";
      iframe.style.width = "0";
      iframe.style.height = "0";
      iframe.style.border = "none";
      document.body.appendChild(iframe);

      iframe.srcdoc = `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              @page {
                margin: 0.5cm;
              }
              body {
                margin: 0;
                padding: 0;
                display: flex;
                justify-content: center;
                align-items: center;
                min-height: 100vh;
              }
              img {
                display: block;
                width: auto;
                height: auto;
                max-width: 100%;
              }
              @media print {
                body {
                  padding: 0;
                }
                img {
                  width: auto !important;
                  max-width: auto !important;
                  height: auto !important;
                }
              }
            </style>
          </head>
          <body>
            <img src="${imageData}" alt="Barcode ${barcode}" />
          </body>
        </html>
      `;

      // Print
      iframe.onload = () => {
        setTimeout(() => {
          iframe.contentWindow.focus();
          iframe.contentWindow.print();
          setTimeout(() => {
            document.body.removeChild(iframe);
          }, 1000);
        }, 250);
      };
    } catch (e) {
      console.error("Print barcode generation error:", e);
    }
  };

  return (
    <>
      <Button onPress={onOpen} className="auth-btn">
        <FaBarcode size={18} />
        Generate Barcode
      </Button>

      <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="2xl">
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex justify-center w-full text-2xl">
                Generated Barcode
              </ModalHeader>

              <ModalBody>
                <div className="flex flex-col items-center justify-center overflow-hidden max-w-full">
                  {barcode ? (
                    <>
                      <div className="flex flex-col items-center gap-3 border border-gray-200 p-4 rounded-lg">
                        <canvas ref={canvasRef} className="max-w-full" />
                        <div className="w-full border-t-2 border-gray-300 my-2"></div>
                        <div className="flex items-center justify-center gap-8 w-full">
                          <div className="text-3xl font-bold text-gray-900">
                            {points ? `${points} Points` : formatPrice(price, currency)}
                          </div>
                          <div className="h-12 w-px bg-gray-400"></div>
                          <div className="text-2xl font-semibold text-gray-700">
                            Size: {size}
                          </div>
                        </div>
                      </div>
                      <p className="mt-3 text-sm text-gray-500">{barcode}</p>
                    </>
                  ) : (
                    <p className="mt-2 text-2xl text-center text-red-800">
                      Oops! Barcode cannot be generated.
                    </p>
                  )}
                </div>
              </ModalBody>

              <ModalFooter>
                {barcode && (
                  <>
                    <Button color="primary" onPress={printBarcode}>
                      Print
                    </Button>
                    <Button color="success" onPress={downloadBarcode}>
                      Download
                    </Button>
                  </>
                )}

                <Button variant="light" onPress={onClose}>
                  Close
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
}
