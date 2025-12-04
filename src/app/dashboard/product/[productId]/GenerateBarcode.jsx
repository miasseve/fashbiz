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

export default function GenerateBarcode({ barcode }) {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const canvasRef = useRef(null);

  // Generate barcode whenever modal opens
  useEffect(() => {
    if (isOpen && canvasRef.current && barcode) {
      try {
        bwipjs.toCanvas(canvasRef.current, {
          bcid: "code128", // Barcode type
          text: barcode, // Text encoded
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

    // Create a higher resolution version for download
    const downloadCanvas = document.createElement("canvas");
    const ctx = downloadCanvas.getContext("2d");

    try {
      // Generate at higher DPI for print quality (300 DPI standard)
      bwipjs.toCanvas(downloadCanvas, {
        bcid: "code128",
        text: barcode,
        scale: 4, // Higher scale for print quality
        height: 15,
        includetext: true,
        textxalign: "center",
        textsize: 14,
        paddingleft: 15,
        paddingright: 15,
        paddingtop: 10,
        paddingbottom: 10,
      });

      const link = document.createElement("a");
      link.download = `barcode_${barcode}.png`;
      link.href = downloadCanvas.toDataURL("image/png");
      link.click();
    } catch (e) {
      console.error("Download barcode generation error:", e);
    }
  };

  const printBarcode = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      // Create a high-quality canvas for printing
      const printCanvas = document.createElement("canvas");
      bwipjs.toCanvas(printCanvas, {
        bcid: "code128",
        text: barcode,
        scale: 4,
        height: 15,
        includetext: true,
        textxalign: "center",
        textsize: 12,
        paddingleft: 15,
        paddingright: 15,
        paddingtop: 10,
        paddingbottom: 10,
      });

      // Convert canvas to image
      const imageData = printCanvas.toDataURL("image/png");

      // Create hidden iframe for printing
      const iframe = document.createElement("iframe");
      iframe.style.position = "absolute";
      iframe.style.width = "0";
      iframe.style.height = "0";
      iframe.style.border = "none";
      document.body.appendChild(iframe);

      const iframeDoc = iframe.contentWindow.document;
      iframeDoc.open();
      iframe.srcdoc = `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              img {
                display: block;
                width: 180px;
                height: auto;
                margin: 0 auto;
              }
            </style>
          </head>
          <body>
            <div class="barcode-container">
              <img src="${imageData}" />
              <div class="barcode-text">${barcode}</div>
            </div>
          </body>
        </html>
        `;
      iframeDoc.close();
      // Wait for image to load then print
      iframe.onload = () => {
        setTimeout(() => {
          iframe.contentWindow.focus();
          iframe.contentWindow.print();

          // Remove iframe after printing
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
              <ModalHeader>Generated Barcode</ModalHeader>

              <ModalBody>
                <div className="flex flex-col items-center justify-center overflow-hidden max-w-full">
                  {barcode ? (
                    <>
                      <canvas ref={canvasRef} className="max-w-full" />
                      <p className="mt-2 text-sm text-gray-500">{barcode}</p>
                    </>
                  ) : (
                    <p className="mt-2 text-2xl text-align-center text-red-800">
                      Oops ! Barcode cannot be generated.
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
