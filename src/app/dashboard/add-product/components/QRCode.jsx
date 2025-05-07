"use client";
import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { useDispatch } from "react-redux";
import { IoMdCamera } from "react-icons/io";
import { GrGallery } from "react-icons/gr";
import { setConsignors, clearConsignors } from "@/features/productSlice";
import { Button } from "@heroui/react";
export default function QRCode() {
  const [mode, setMode] = useState(null);
  const [result, setResult] = useState("");
  const cameraRef = useRef(null);
  const dispatch = useDispatch();
  const fileInputRef = useRef(null);
  const scannerRef = useRef(null);

  // Start camera scanning
  const startCamera = async () => {
    const config = { fps: 50, qrbox: { width: 250, height: 200 } };
    const scanner = new Html5Qrcode("camera-preview");
    scannerRef.current = scanner;

    try {
      await scanner.start(
        { facingMode: "environment" },
        config,
        (decodedText) => {
          const parsedData = JSON.parse(decodedText);
          dispatch(setConsignors(parsedData));
          //   setResult(decodedText);
          //   stopCamera();
        },
        (error) => {
          console.warn("QR Scan Error:", error);
        }
      );
    } catch (err) {
      console.error("Camera error:", err);
    }
  };

  const stopCamera = async () => {
    if (scannerRef.current) {
      await scannerRef.current.stop();
      await scannerRef.current.clear();
      scannerRef.current = null;
    }
  };

  useEffect(() => {
    if (mode === "camera") startCamera();
    return () => {
      stopCamera();
    };
  }, [mode]);

  // Handle image upload
  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const scanner = new Html5Qrcode("image-scan");
    try {
      const result = await scanner.scanFile(file, true);
      const parsedData = JSON.parse(result);
      dispatch(setConsignors(parsedData));
      setResult("");
      // setResult(result);
    } catch (err) {
      dispatch(clearConsignors());
      setResult("No QR code found.");
    }
  };

  const closeCamera = async () => {
    await stopCamera();
    setMode(null);
  };
  return (
    <div className="p-4 text-center">
      <h2 className="text-2xl font-semibold mb-4">Scan Consiqnor QR Code</h2>

      <div className="flex gap-4 mb-4 justify-center">
        <Button
          onPress={() => setMode("camera")}
          variant="bordered"
          className="border py-6 px-6  font-medium  text-base sm:text-xl hover:bg-gray-200  rounded-lg text-lg  flex items-center gap-2 background-transparent"
        >
          <IoMdCamera />
          Use Camera
        </Button>
        <Button
          variant="bordered"
          onPress={() => fileInputRef.current.click()}
          className="border py-6 px-6  font-medium  text-base sm:text-xl hover:bg-gray-200 rounded-lg text-lg flex items-center gap-2"
        >
          <GrGallery />
          Upload Photo
        </Button>
        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          onChange={handleImageUpload}
          className="hidden"
        />
      </div>

      {mode === "camera" && (
        <>
          <div
            id="camera-preview"
            className="w-full max-w-md mx-auto border rounded p-2"
          />
          <Button
            onPress={closeCamera}
            className="danger-btn !mb-[20px] m-auto mt-5"
          >
            Close Camera
          </Button>
        </>
      )}

      {/* Used by html5-qrcode internally for image scanning */}
      <div id="image-scan" style={{ display: "none" }} />

      {result && (
        <div className="text-center mb-10 bg-[#f6f6f6] py-[15px] px-4 sm:px-0 sm:w-[498px] mx-auto border border-[silver] mb-[20px]">
          <p className="font-semibold">Scanned Result:</p>
          <h3>{result}</h3>
        </div>
      )}
    </div>
  );
}
