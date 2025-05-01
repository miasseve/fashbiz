"use client";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import { Spinner } from "@heroui/react";
import { IoIosCamera } from "react-icons/io";
import { filters } from "@/lib/constants";
import { toast } from "react-toastify";
import { removeBackground } from "@imgly/background-removal";
import { useDispatch, useSelector } from "react-redux";
import { useRef } from "react";

import { setUploadedImagesOfProduct } from "@/features/productSlice";
import {
  Input,
  Slider,
  Select,
  SelectItem,
  Checkbox,
  Button,
} from "@heroui/react";
import CropImage from "./CropImage";
import RemoveImage from "./RemoveImage";
import { updateCloudinaryImage } from "@/actions/cloudinaryActions";

const FirstStep = ({ handleSaveUrl, handleBackStep }) => {
  const dispatch = useDispatch();
  const [isBackCameraAvailable, setIsBackCameraAvailable] = useState(true);

  const [selectedView, setSelectedView] = useState("frontView");
  const topRef = useRef(null);

  const [uploadedImagesWithView, setUploadedImagesWithView] = useState({
    frontView: null,
    sideView: null,
    backView: null,
    detailView: null,
  });

  const storedProductImages = useSelector(
    (state) => state.product.uploadedImages
  );

  useEffect(() => {
    const isEmpty = Object.values(storedProductImages).every(
      (value) => value === null
    );
    if (!isEmpty) {
      setUploadedImagesWithView(storedProductImages);
    }
  }, []);
  
  useEffect(() => {
    const checkBackCamera = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const hasBackCamera = devices.some(
          (device) =>
            device.kind === "videoinput" &&
            device.label.toLowerCase().includes("back")
        );

        // Some devices (e.g., iPhones) may not expose 'back' in the label unless permission was granted
        setIsBackCameraAvailable(hasBackCamera);
      } catch (err) {
        console.error("Could not enumerate devices", err);
        setIsBackCameraAvailable(false);
      }
    };

    checkBackCamera();
  }, []);

  const [croppingImage, setCroppingImage] = useState(null);

  //loading and error handling
  const [imageUploadError, setImageUploadError] = useState([]);
  const [uploadImageLoader, setUploadImageLoader] = useState(false);
  const [deleteImageLoader, setDeleteImageLoader] = useState({});
  const [removeBackgroundLoader, setRemoveBackgroundLoader] = useState({});

  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const handleGalleryClick = (viewType) => {
    setIsCameraOpen(false);
    setSelectedView(viewType);
    document.getElementById("fileInput");
    fileInput.value = "";
    fileInput.click();
  };

  const updateImageTransformationsWithView = (viewType, value, prefix) => {
    setUploadedImagesWithView((prevImages) => {
      const updatedImages = { ...prevImages };
      const baseUrl = updatedImages[viewType]?.originalUrl.split("/upload")[0];
      const remaining =
        updatedImages[viewType]?.originalUrl.split("/upload")[1];

      if (!remaining) return prevImages;

      const transformations = remaining.split("/").filter((trans) => trans);
      const transformationIndex = transformations.findIndex((trans) =>
        trans.startsWith(prefix)
      );

      if (value === 0 || value == "") {
        // Remove the transformation if the value is 0
        if (transformationIndex !== -1) {
          transformations.splice(transformationIndex, 1);
        }
      } else {
        if (transformationIndex !== -1) {
          transformations[transformationIndex] = `${prefix}${value}`;
        } else {
          transformations.unshift(`${prefix}${value}`);
        }
      }

      const newUrl = `${baseUrl}/upload/${transformations.join("/")}`;
      let removeBgUrl = updatedImages[viewType]?.removeBgUrl;
      if (updatedImages[viewType]?.removeBgUrl) {
        const removeBaseUrl =
          updatedImages[viewType]?.removeBgUrl.split("/upload")[0];
        const removeRemaining =
          updatedImages[viewType]?.removeBgUrl.split("/upload")[1];

        if (!removeRemaining) return prevImages;

        const removeTransformations = removeRemaining
          .split("/")
          .filter((trans) => trans);
        const removeTransformationIndex = removeTransformations.findIndex(
          (trans) => trans.startsWith(prefix)
        );

        if (value === 0 || value == "") {
          // Remove the transformation if the value is 0
          if (removeTransformationIndex !== -1) {
            removeTransformations.splice(removeTransformationIndex, 1);
          }
        } else {
          if (removeTransformationIndex !== -1) {
            removeTransformations[
              removeTransformationIndex
            ] = `${prefix}${value}`;
          } else {
            removeTransformations.unshift(`${prefix}${value}`);
          }
        }

        removeBgUrl = `${removeBaseUrl}/upload/${removeTransformations.join(
          "/"
        )}`;
      }
      updatedImages[viewType] = {
        ...updatedImages[viewType],
        url: updatedImages[viewType].isBgRemovedImage ? removeBgUrl : newUrl,
        originalUrl: newUrl,
        removeBgUrl: removeBgUrl,
      };

      return updatedImages;
    });
  };

  // const constraints = {
  //   video: {
  //     facingMode: { exact: isBackCameraAvailable ? "environment" : "user" }, // Request back camera
  //   },
  // };
  const handleCameraClick = (viewType = "frontView") => {
    setIsCameraOpen(true);
    setSelectedView(viewType);
    setCroppingImage(null);
    setTimeout(() => {
      if (videoRef.current) {
        videoRef.current.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }
    }, 100);
    navigator.mediaDevices
      .getUserMedia({
        video: {
          facingMode: { exact: isBackCameraAvailable ? "environment" : "user" }, // Request back camera
        },
      })
      .then((stream) => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      })
      .catch((err) => console.error("Error accessing camera:", err));
  };

  const captureImage = () => {
    if (canvasRef.current && videoRef.current) {
      const context = canvasRef.current.getContext("2d");
      canvasRef.current.width = videoRef.current.videoWidth;
      canvasRef.current.height = videoRef.current.videoHeight;
      context.drawImage(videoRef.current, 0, 0);
      const imageData = canvasRef.current.toDataURL("image/png");
      setCroppingImage(imageData);
      setIsCameraOpen(false);
      videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
    }
  };

  const handleBrightnessWithView = (value, viewType) => {
    setUploadedImagesWithView((prevImages) => ({
      ...prevImages,
      [viewType]: prevImages[viewType]
        ? { ...prevImages[viewType], brightness: value }
        : null,
    }));

    updateImageTransformationsWithView(viewType, value, "e_brightness:");
  };

  const handleContrastWithView = (value, viewType) => {
    setUploadedImagesWithView((prevImages) => ({
      ...prevImages,
      [viewType]: prevImages[viewType]
        ? { ...prevImages[viewType], contrast: value }
        : null,
    }));
    updateImageTransformationsWithView(viewType, value, "e_contrast:");
  };

  const handleFilterWithView = (value, viewType) => {
    setUploadedImagesWithView((prevImages) => ({
      ...prevImages,
      [viewType]: prevImages[viewType]
        ? { ...prevImages[viewType], filter: value }
        : null,
    }));
    updateImageTransformationsWithView(viewType, value, "e_art:");
  };

  const blobToBase64 = (blob) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const removeBackgroundHandlerWithView = async (e, viewType) => {
    const isChecked = e.target.checked;

    if (isChecked) {
      setRemoveBackgroundLoader((prevState) => ({
        ...prevState,
        [viewType]: { loading: true },
      }));

      if (uploadedImagesWithView[viewType].removePublicId) {
        setUploadImageLoader(false);
        setUploadedImagesWithView((prevImages) => ({
          ...prevImages,
          [viewType]: prevImages[viewType]
            ? {
                ...prevImages[viewType],
                publicId: uploadedImagesWithView[viewType].removePublicId,
                url: uploadedImagesWithView[viewType].removeBgUrl,
                isBgRemovedImage: true,
              }
            : null,
        }));
      } else {
        const blob = await removeBackground(
          uploadedImagesWithView[viewType].url
        );
        const processedUrl = URL.createObjectURL(blob);
        const processedBlob = await fetch(processedUrl).then((res) =>
          res.blob()
        );

        // Convert Blob to Base64
        const base64File = await blobToBase64(processedBlob);
        const res = await updateCloudinaryImage(base64File);
        if (res.status == 200) {
          setUploadedImagesWithView((prevImages) => ({
            ...prevImages,
            [viewType]: prevImages[viewType]
              ? {
                  ...prevImages[viewType],
                  publicId: res.data.public_id,
                  removePublicId: res.data.public_id,
                  removeBgUrl: res.data.secure_url,
                  url: res.data.secure_url,
                  isBgRemovedImage: true,
                }
              : null,
          }));
        } else {
          console.log("something went wrong");
        }
        setUploadImageLoader(false);
      }
      setRemoveBackgroundLoader({});
    } else {
      setUploadedImagesWithView((prevImages) => ({
        ...prevImages,
        [viewType]: prevImages[viewType]
          ? {
              ...prevImages[viewType],
              publicId: uploadedImagesWithView[viewType].originalPublicId,
              url: uploadedImagesWithView[viewType].originalUrl,
              isBgRemovedImage: false,
            }
          : null,
      }));
    }
  };
  const handleImageError = (e, index) => {
    setImageUploadError((prevErrors) => {
      const newErrors = [...prevErrors];
      newErrors[index] = "Failed To change background.Something went wrong !!";
      return newErrors;
    });
  };
  const step2Handler = () => {
    dispatch(setUploadedImagesOfProduct(uploadedImagesWithView));
    handleSaveUrl();
  };
  const handleFileSelection = async (e) => {
    const files = Array.from(e.target.files);
    // Check if any of the selected files are videos
    const invalidFile = files.some((file) => {
      const fileExtension = file.name.split(".").pop().toLowerCase();
      return ["mp4", "avi", "mov", "mkv", "webm", "gif"].includes(
        fileExtension
      );
    });

    // If a video is found, show an error and prevent upload
    if (invalidFile) {
      toast.error("Please upload an image only.", {
        position: "top-right",
        autoClose: 3000,
      });
      return;
    }

    // Scroll to the top of the page after selecting the image
    if (topRef.current) {
      topRef.current.scrollIntoView({ behavior: "smooth" });
    }
    setCroppingImage(URL.createObjectURL(files[0]));
    e.target.value = "";
  };

  return (
    <div ref={topRef} className="bg-white shadow rounded-lg p-6 mt-[2rem]">
      <div className="text-center">
        {isCameraOpen && (
          <div className="camera-container">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="border rounded-lg shadow-lg flex justify-center items-center lg:w-[50%] w-full m-auto"
            />
            <Button
              onPress={captureImage}
              className="mt-4 bg-blue-500 text-white p-2 rounded"
            >
              Capture
            </Button>
            <canvas ref={canvasRef} className="hidden" />
          </div>
        )}

        <Input
          type="file"
          id="fileInput"
          accept="image/*"
          onChange={handleFileSelection}
          className="w-full text-[1.4rem] hidden"
          isClearable
        />
        <p className="lg:text-[1.4rem] text-[2rem]">Add product image</p>
        <p className="text-[1.2rem] text-gray-500 mt-0">
          ( User can upload up to 4 images for each product )
        </p>

        {croppingImage && (
          <div className="text-center">
            <CropImage
              cropImage={croppingImage}
              selectedView={selectedView}
              uploadImageLoader={uploadImageLoader}
              setCroppingImage={setCroppingImage}
              setUploadImageLoader={setUploadImageLoader}
              setUploadedImagesWithView={setUploadedImagesWithView}
            />
          </div>
        )}

        {uploadImageLoader && (
          <div>
            <p className="text-[1.4rem] text-gray-800">
              Uploading image, please wait...
            </p>
            <div className="ml-2 ">
              <Spinner size="sm" color="success" />{" "}
            </div>
          </div>
        )}
        <div className="grid lg:grid-cols-2 grid-cols-1  gap-4 mt-4">
          {Object.entries(uploadedImagesWithView).map(
            ([viewType, imageData]) => (
              <div
                key={viewType}
                className="border p-8 rounded mb-4 bg-[#f1f3f1] "
              >
                {imageData != null ? (
                  // Image is uploaded -> Show Image and Controls
                  <div className="mt-4 w-full">
                    <div className="border p-4 rounded bg-white">
                      <div className="flex justify-between">
                        <div className="w-[49%] pr-[2rem] h-full">
                          <Image
                            src={imageData.url}
                            alt={`${viewType} Image`}
                            width="300"
                            height="300"
                            layout="intrinsic"
                            onError={(e) => handleImageError(e, viewType)}
                            className="rounded"
                          />
                        </div>

                        <div className="w-[60%] lg:mt-[10px] mt-0 relative">
                          <div className="flex justify-between w-full">
                            <Slider
                              defaultValue={imageData?.brightness || 0}
                              label="Brightness"
                              maxValue={99}
                              minValue={-99}
                              onChangeEnd={(value) =>
                                handleBrightnessWithView(value, viewType)
                              }
                              step={1}
                            />
                          </div>

                          <div className="flex my-5 justify-between w-full">
                            <Slider
                              defaultValue={imageData?.contrast || 0}
                              label="Contrast"
                              maxValue={99}
                              minValue={-99}
                              onChangeEnd={(value) =>
                                handleContrastWithView(value, viewType)
                              }
                              step={1}
                            />
                          </div>

                          <div className="custom-select text-start">
                            <Select
                              defaultSelectedKeys={[imageData?.filter || ""]}
                              onChange={(e) =>
                                handleFilterWithView(e.target.value, viewType)
                              }
                              placeholder="Select filter option"
                              className="custom-select"
                              style={{
                                background: "#fff",
                                border: "1px solid #e5e7eb",
                              }}
                            >
                              <SelectItem key="" value="">
                                -- Select a filter --
                              </SelectItem>
                              {filters.map((filterOption) => (
                                <SelectItem
                                  key={filterOption.key}
                                  value={filterOption.key}
                                  className="custom-select"
                                >
                                  {filterOption.label}
                                </SelectItem>
                              ))}
                            </Select>
                          </div>

                          <div className="flex my-5">
                            <div className="text-start">
                              <Checkbox
                                size="sm"
                                defaultSelected={
                                  imageData?.isBgRemovedImage || false
                                }
                                isDisabled={
                                  Object.keys(removeBackgroundLoader).length > 0
                                }
                                onChange={(e) =>
                                  removeBackgroundHandlerWithView(e, viewType)
                                }
                              >
                                <span className="pr-[2rem]">
                                  Remove Background
                                </span>
                              </Checkbox>
                              {removeBackgroundLoader[viewType]?.loading && (
                                <Spinner size="sm" color="success" />
                              )}
                            </div>
                          </div>

                          <div className="text-start">
                            <RemoveImage
                              viewType={viewType}
                              disabled={
                                Object.keys(removeBackgroundLoader).length >
                                  0 || false
                              }
                              publicId={imageData?.publicId}
                              setDeleteImageLoader={setDeleteImageLoader}
                              deleteImageLoader={deleteImageLoader}
                              uploadedImagesWithView={uploadedImagesWithView}
                              setUploadedImagesWithView={
                                setUploadedImagesWithView
                              }
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  // No Image Uploaded -> Show Upload Button
                  <div>
                    <p>
                      {viewType
                        .replace(/([A-Z])/g, " $1")
                        .replace(/^./, (str) => str.toUpperCase())}
                    </p>
                    <div className="flex  items-center justify-center mt-4  gap-2">
                      <Button
                        type="button"
                        onPress={() => handleCameraClick(viewType)}
                        className="dark-btn"
                      >
                        <IoIosCamera />
                      </Button>
                      <span>/</span>
                      <Button
                        type="button"
                        onPress={() => handleGalleryClick(viewType)}
                        className="dark-btn"
                      >
                        Upload
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )
          )}
        </div>
        <div className="flex  items-center w-full justify-between lg:pr-[25px] p-0">
          <div className="text-start mt-5 ">
            <Button
              isDisabled={
                uploadImageLoader ||
                Object.keys(removeBackgroundLoader).length > 0
              }
              onPress={handleBackStep}
              className="auth-btn"
            >
              Back
            </Button>
          </div>
          <div className="flex mt-5 items-center">
            <div className="text-start pl-[1rem]">
              <Button
                isDisabled={
                  uploadImageLoader ||
                  Object.keys(removeBackgroundLoader).length > 0 ||
                  Object.values(uploadedImagesWithView).every(
                    (value) => value === null
                  )
                }
                onPress={step2Handler}
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
