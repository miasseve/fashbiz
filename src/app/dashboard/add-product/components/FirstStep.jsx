"use client";
import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { Spinner, Button } from "@heroui/react";
import { IoIosCamera } from "react-icons/io";
import { toast } from "react-toastify";
import { useDispatch, useSelector } from "react-redux";
import axios from "axios";
import { setUploadedImagesOfProduct } from "@/features/productSlice";
import { resizeImageFile } from "./resizeImage";

// Up to 4 photos per product — matches what the AI analysis uses (it caps at 4).
const MAX_IMAGES = 4;

// A returning user may still have the old { frontView, sideView, ... } object
// persisted in localStorage (key "fash"). Turn either shape into an ordered
// array, dropping empty slots — Object.values keeps the front -> side -> back
// -> detail order, so the old "main" (front) photo stays first.
const toImageArray = (stored) =>
  Array.isArray(stored)
    ? stored.filter(Boolean)
    : Object.values(stored || {}).filter(Boolean);

const FirstStep = ({ handleSaveUrl, handleBackStep }) => {
  const dispatch = useDispatch();
  const topRef = useRef(null);
  const fileInputRef = useRef(null);

  // Completed uploads, in the order they were added.
  const [images, setImages] = useState([]);
  // How many photos are still uploading right now (drives spinners + disables).
  const [uploadingCount, setUploadingCount] = useState(0);
  // Index currently being removed, or null.
  const [deletingIndex, setDeletingIndex] = useState(null);

  // Camera state
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [availableCameras, setAvailableCameras] = useState([]);
  const [currentCameraIndex, setCurrentCameraIndex] = useState(0);
  const [currentFacingMode, setCurrentFacingMode] = useState("environment");
  const [camerasDetected, setCamerasDetected] = useState(false);
  const cameraContainerRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const storedProductImages = useSelector(
    (state) => state.product.uploadedImages,
  );

  // Restore any photos already added earlier in this add-product flow.
  useEffect(() => {
    const restored = toImageArray(storedProductImages);
    if (restored.length > 0) setImages(restored);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const remainingSlots = MAX_IMAGES - images.length - uploadingCount;
  const atLimit = remainingSlots <= 0;

  // ── Upload one already-validated file ──
  const uploadOne = async (file) => {
    const resized = await resizeImageFile(file);
    const formData = new FormData();
    formData.append("file", resized);
    formData.append("isProfileImage", false);

    const response = await axios.post("/api/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
      timeout: 30000,
    });

    return {
      url: response.data.url,
      publicId: response.data.publicId,
      originalUrl: response.data.url,
      originalPublicId: response.data.publicId,
    };
  };

  const addFile = async (file) => {
    setUploadingCount((c) => c + 1);
    try {
      const uploaded = await uploadOne(file);
      setImages((prev) => [...prev, uploaded]);
    } catch (error) {
      const message =
        error.code === "ECONNABORTED"
          ? "Upload timed out. Please check your connection and try again."
          : error.response?.data?.error ||
            error.message ||
            "Failed to upload image.";
      toast.error(message);
    } finally {
      setUploadingCount((c) => c - 1);
    }
  };

  const openFilePicker = () => {
    setIsCameraOpen(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
      fileInputRef.current.click();
    }
  };

  const handleFilesSelected = async (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    if (files.length === 0) return;

    // Only images — reject the batch if anything else is in it.
    const allImages = files.every((file) => file.type.startsWith("image/"));
    if (!allImages) {
      toast.error("Please upload images only.", {
        position: "top-right",
        autoClose: 3000,
      });
      return;
    }

    if (remainingSlots <= 0) {
      toast.error(`You can add up to ${MAX_IMAGES} photos.`);
      return;
    }

    const filesToUse = files.slice(0, remainingSlots);
    if (files.length > remainingSlots) {
      toast.warn(
        `Only ${remainingSlots} photo slot${
          remainingSlots > 1 ? "s" : ""
        } available — added the first ${filesToUse.length}.`,
      );
    }

    if (topRef.current) {
      topRef.current.scrollIntoView({ behavior: "smooth" });
    }

    // One at a time, so photos land in the order they were picked.
    for (const file of filesToUse) {
      // eslint-disable-next-line no-await-in-loop
      await addFile(file);
    }
  };

  const handleRemove = async (index) => {
    const image = images[index];
    if (!image) return;
    setDeletingIndex(index);
    try {
      await axios.delete(
        `/api/upload?publicId=${image.publicId}&removeBgPublicId=${
          image.removePublicId || ""
        }`,
      );
      setImages((prev) => prev.filter((_, i) => i !== index));
      toast.success("Image deleted successfully!", {
        position: "top-right",
        autoClose: 2000,
      });
    } catch (error) {
      toast.error("Error deleting image. Please try again.");
    } finally {
      setDeletingIndex(null);
    }
  };

  // ── Camera ──
  const detectCameras = async () => {
    if (camerasDetected) return;
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(
        (device) => device.kind === "videoinput",
      );
      setAvailableCameras(videoDevices);

      const backCameraIndex = videoDevices.findIndex(
        (device) =>
          device.label.toLowerCase().includes("back") ||
          device.label.toLowerCase().includes("rear") ||
          device.label.toLowerCase().includes("environment"),
      );
      if (backCameraIndex !== -1) setCurrentCameraIndex(backCameraIndex);
      setCamerasDetected(true);
    } catch (err) {
      console.error("Camera detection failed", err);
    }
  };

  const stopStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
    }
  };

  const startCamera = async (cameraIndex = null, facingMode = null) => {
    try {
      stopStream();

      let constraints;
      if (cameraIndex !== null && availableCameras[cameraIndex]?.deviceId) {
        constraints = {
          video: {
            deviceId: { exact: availableCameras[cameraIndex].deviceId },
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
        };
      } else if (facingMode) {
        constraints = {
          video: {
            facingMode: { ideal: facingMode },
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
        };
      } else {
        constraints = {
          video: {
            facingMode: { ideal: "environment" },
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
        };
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
      }
      setTimeout(() => detectCameras(), 500);
      if (cameraIndex !== null) setCurrentCameraIndex(cameraIndex);
      if (facingMode) setCurrentFacingMode(facingMode);
    } catch (err) {
      console.error("Error accessing camera:", err);
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          streamRef.current = stream;
        }
        setTimeout(() => detectCameras(), 500);
      } catch (fallbackErr) {
        console.error("Fallback camera access failed:", fallbackErr);
        toast.error("Could not access camera. Please check permissions.");
      }
    }
  };

  const handleCameraClick = () => {
    if (atLimit) {
      toast.error(`You can add up to ${MAX_IMAGES} photos.`);
      return;
    }
    setIsCameraOpen(true);
    setTimeout(() => {
      cameraContainerRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 300);

    const backCameraIndex = availableCameras.findIndex(
      (device) =>
        device.label.toLowerCase().includes("back") ||
        device.label.toLowerCase().includes("rear") ||
        device.label.toLowerCase().includes("environment"),
    );
    startCamera(backCameraIndex !== -1 ? backCameraIndex : null, "environment");
  };

  const flipCamera = () => {
    if (availableCameras.length > 1) {
      const nextIndex = (currentCameraIndex + 1) % availableCameras.length;
      startCamera(nextIndex);
    } else {
      const newFacingMode =
        currentFacingMode === "environment" ? "user" : "environment";
      startCamera(null, newFacingMode);
      setCurrentFacingMode(newFacingMode);
    }
  };

  const captureImage = () => {
    if (!canvasRef.current || !videoRef.current) return;
    const context = canvasRef.current.getContext("2d");
    canvasRef.current.width = videoRef.current.videoWidth;
    canvasRef.current.height = videoRef.current.videoHeight;
    context.drawImage(videoRef.current, 0, 0);

    canvasRef.current.toBlob(
      async (blob) => {
        setIsCameraOpen(false);
        stopStream();
        if (!blob) return;
        if (remainingSlots <= 0) {
          toast.error(`You can add up to ${MAX_IMAGES} photos.`);
          return;
        }
        const file = new File([blob], "camera-photo.jpeg", {
          type: "image/jpeg",
        });
        await addFile(file);
      },
      "image/jpeg",
      0.9,
    );
  };

  // Stop the camera when leaving the step.
  useEffect(() => {
    return () => stopStream();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Step navigation ──
  const commitImages = () => dispatch(setUploadedImagesOfProduct(images));

  const handleNext = () => {
    commitImages();
    handleSaveUrl();
  };

  const handleBack = () => {
    // Commit first so photos added since the last step aren't dropped.
    commitImages();
    handleBackStep();
  };

  const busy = uploadingCount > 0 || deletingIndex !== null;

  return (
    <div
      ref={topRef}
      className="bg-white shadow rounded-lg p-6 mt-[2rem] mb-[90px]"
    >
      <div className="text-center">
        {isCameraOpen && (
          <div
            ref={cameraContainerRef}
            className="camera-container relative lg:w-[50%] w-full m-auto scroll-mt-36"
          >
            <div className="relative">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="border rounded-lg shadow-lg w-full max-h-[75vh] object-cover"
              />
              <div className="absolute bottom-6 left-0 right-0 flex justify-center items-center gap-4 z-10">
                {availableCameras.length > 1 && (
                  <Button
                    onPress={flipCamera}
                    isIconOnly
                    className="bg-white/30 backdrop-blur-sm text-white rounded-full w-12 h-12 min-w-0 shadow-lg border border-white/40"
                    aria-label="Flip camera"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      stroke="currentColor"
                      className="w-6 h-6"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"
                      />
                    </svg>
                  </Button>
                )}
                <button
                  type="button"
                  onClick={captureImage}
                  className="w-16 h-16 rounded-full bg-white/40 backdrop-blur-sm border-4 border-white shadow-lg flex items-center justify-center active:scale-90 transition-transform"
                  aria-label="Capture photo"
                >
                  <span className="w-12 h-12 rounded-full bg-white block" />
                </button>
              </div>
            </div>
            <canvas ref={canvasRef} className="hidden" />
          </div>
        )}

        {/* Hidden multi-select input behind the "+" frame */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFilesSelected}
          className="hidden"
        />

        <p className="lg:text-[1.4rem] text-[2rem]">Add product image</p>
        <p className="text-[1.2rem] text-gray-500 mt-0">
          ( Add up to {MAX_IMAGES} photos — they can be selected all at once )
        </p>

        {/* Ordered list of photos, with the "+" frame at the end */}
        <div className="grid lg:grid-cols-3 grid-cols-2 gap-4 mt-6">
          {images.map((image, index) => (
            <div
              key={image.publicId || index}
              className="relative border rounded-lg p-2 bg-[#f1f3f1] flex items-center justify-center aspect-square"
            >
              <Button
                isIconOnly
                isDisabled={busy}
                onPress={() => handleRemove(index)}
                aria-label={`Remove photo ${index + 1}`}
                className={`absolute right-2 top-2 z-10 min-w-0 w-9 h-9 rounded-full text-white shadow-lg ${
                  busy
                    ? "bg-gray-400 cursor-not-allowed opacity-50"
                    : "bg-red-600 hover:bg-red-700"
                }`}
              >
                {deletingIndex === index ? (
                  <Spinner size="sm" color="white" />
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2.5}
                    stroke="currentColor"
                    className="w-5 h-5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                )}
              </Button>
              <Image
                src={image.url}
                alt={`Product photo ${index + 1}`}
                width="300"
                height="300"
                layout="intrinsic"
                className="rounded max-h-full w-auto object-contain"
                unoptimized
              />
            </div>
          ))}

          {/* One spinner tile per in-flight upload */}
          {Array.from({ length: uploadingCount }).map((_, i) => (
            <div
              key={`uploading-${i}`}
              className="border rounded-lg p-2 bg-[#f1f3f1] flex flex-col items-center justify-center aspect-square"
            >
              <Spinner size="sm" color="success" />
              <p className="text-[1rem] text-gray-500 mt-2">Uploading…</p>
            </div>
          ))}

          {/* The "+" frame — add more photos */}
          {!atLimit && (
            <div className="border-2 border-dashed border-gray-300 rounded-lg bg-[#f1f3f1] flex flex-col items-center justify-center aspect-square gap-3 p-4">
              <Button
                isIconOnly
                type="button"
                isDisabled={busy}
                onPress={openFilePicker}
                aria-label="Add photos"
                className="dark-btn w-16 h-16 min-w-0 rounded-full text-[2.4rem] leading-none"
              >
                +
              </Button>
              <Button
                type="button"
                isDisabled={busy}
                onPress={handleCameraClick}
                aria-label="Take a photo with the camera"
                className="dark-btn"
              >
                <IoIosCamera />
              </Button>
            </div>
          )}
        </div>

        {atLimit && (
          <p className="text-[1.2rem] text-gray-500 mt-4">
            You&apos;ve added the maximum of {MAX_IMAGES} photos. Remove one to
            add another.
          </p>
        )}

        <div className="flex items-center w-full justify-between p-0">
          <div className="text-start mt-5">
            <Button
              isDisabled={busy}
              onPress={handleBack}
              className="auth-btn"
            >
              Back
            </Button>
          </div>
          <div className="flex mt-5 items-center">
            <div className="text-start pl-[1rem]">
              <Button
                isDisabled={busy || images.length === 0}
                onPress={handleNext}
                className="danger-btn"
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FirstStep;
