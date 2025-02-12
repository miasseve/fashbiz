"use client";
import { Html5QrcodeScanner } from "html5-qrcode";
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { setConsignors } from "@/features/productSlice";

export default function QRCodeScanner() {
  // State to store QR code data
  const dispatch = useDispatch();

  useEffect(() => {
    const scanner = new Html5QrcodeScanner("reader", {
      fps: 10, 
      qrbox: 250, 
      disableFlip: false 
    });

    // Render the scanner and handle the QR code result
    scanner.render(
      (decodedText) => {
        try {
          const parsedData = JSON.parse(decodedText);
          dispatch(setConsignors(parsedData));
        } catch {
          console.log("Scanned Text:", decodedText);
        }
      },
      () => {} 
    );
    return () => scanner.clear();
  }, []);

  return (
    <div className="flex flex-col justify-center items-center p-4">
      <h5>Scan Consignor QR Code</h5>
      <div
        id="reader"
        className="w-full max-w-[500px] h-[80vh] bg-gray-200 border-4 border-gray-300 flex flex-col justify-center"
      ></div>
    </div>
  );
}
