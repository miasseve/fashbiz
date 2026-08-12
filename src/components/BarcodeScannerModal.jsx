"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Button,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  useDisclosure,
} from "@heroui/react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { FaCamera } from "react-icons/fa6";
import { toast } from "react-toastify";

/**
 * Camera-based alternative to the physical barcode scanner already wired
 * into the sidebar's hidden input. Same end result — scanning a product's
 * barcode marks it sold and delists it everywhere — just using the phone's
 * own camera instead of a separate scanner device.
 */
export default function BarcodeScannerModal() {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const videoRef = useRef(null);
  const controlsRef = useRef(null);
  const lastScannedRef = useRef({ code: null, at: 0 });
  const [status, setStatus] = useState("starting");

  const handleScan = useCallback(async (barcode) => {
    // A live decode loop can fire on the same physical barcode across many
    // consecutive frames — debounce so one scan doesn't fire the sell
    // action a dozen times in a row.
    const now = Date.now();
    if (lastScannedRef.current.code === barcode && now - lastScannedRef.current.at < 4000) return;
    lastScannedRef.current = { code: barcode, at: now };

    try {
      const res = await fetch("/api/product-barcode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ barcode }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Couldn't process that barcode");
        return;
      }
      toast.success(`Marked sold: ${data.title}`);
    } catch {
      toast.error("Error processing barcode");
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    const reader = new BrowserMultiFormatReader();

    reader
      .decodeFromVideoDevice(undefined, videoRef.current, (result) => {
        if (result) handleScan(result.getText());
      })
      .then((controls) => {
        if (cancelled) { controls.stop(); return; }
        controlsRef.current = controls;
        setStatus("scanning");
      })
      .catch(() => {
        if (!cancelled) setStatus("denied");
      });

    return () => {
      cancelled = true;
      controlsRef.current?.stop();
      controlsRef.current = null;
    };
  }, [isOpen, handleScan]);

  return (
    <>
      <Button onPress={onOpen} className="auth-btn flex items-center gap-2">
        <FaCamera size={16} />
        Scan with Camera
      </Button>

      <Modal isOpen={isOpen} onOpenChange={onOpenChange} placement="center" size="lg">
        <ModalContent>
          {() => (
            <>
              <ModalHeader>Scan a barcode</ModalHeader>
              <ModalBody className="pb-6">
                <div className="relative w-full overflow-hidden rounded-lg bg-black" style={{ aspectRatio: "4 / 3" }}>
                  <video ref={videoRef} className="h-full w-full object-cover" muted playsInline />
                  {status === "denied" && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/80 px-4 text-center text-white">
                      Couldn't access the camera. Check your browser's camera permission for this site.
                    </div>
                  )}
                </div>
                <p className="mt-3 text-center text-sm text-gray-500">
                  Point the camera at a product's barcode. It'll be marked sold automatically.
                </p>
              </ModalBody>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
}
