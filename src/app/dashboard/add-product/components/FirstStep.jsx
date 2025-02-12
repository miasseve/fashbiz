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

import {
  setPropertiesOfProduct,
  setUploadedImagesOfProduct,
} from "@/features/productSlice";
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
  const [properties, setProperties] = useState([]);
  const [uploadedImages, setUploadedImages] = useState([]);
  const topRef = useRef(null);
  //fetch data from redux
  const storedProperties = useSelector((state) => state.product.properties);
  const storedProductImages = useSelector(
    (state) => state.product.uploadedImages
  );
  const [croppingImage, setCroppingImage] = useState(null);

  //loading and error handling
  const [imageUploadError, setImageUploadError] = useState([]);
  const [uploadImageLoader, setUploadImageLoader] = useState(false);
  const [deleteImageLoader, setDeleteImageLoader] = useState({});
  const [removeBackgroundLoader, setRemoveBackgroundLoader] = useState({});

  useEffect(() => {
    if (storedProperties && storedProperties.length > 0) {
      setProperties(storedProperties);
    }
    if (storedProductImages && storedProductImages.length > 0) {
      setUploadedImages(storedProductImages);
    }
  }, [storedProperties, storedProductImages]);

  useEffect(() => {
    setProperties((prevProperties) => {
      const updatedProperties = [...prevProperties];
      uploadedImages.forEach((_, index) => {
        if (!updatedProperties[index]) {
          updatedProperties[index] = {
            brightness: 0,
            contrast: 0,
            filter: "",
            removeBackground: false,
          };
        }
      });
      return updatedProperties;
    });
  }, [uploadedImages]);

  const handleCameraClick = () => {
    document.getElementById("fileInput");
    fileInput.value = "";  
    fileInput.click();
  };
  // Upload image to Cloudinary

  const updateImageTransformations = (index, value, prefix) => {
    setUploadedImages((prevImages) => {
      const updatedImages = [...prevImages];
      const baseUrl = updatedImages[index]?.originalUrl.split("/upload")[0];
      const remaining = updatedImages[index]?.originalUrl.split("/upload")[1];

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
      let removeBgUrl = updatedImages[index]?.removeBgUrl;
      if (updatedImages[index]?.removeBgUrl) {
        const removeBaseUrl =
          updatedImages[index]?.removeBgUrl.split("/upload")[0];
        const removeRemaining =
          updatedImages[index]?.removeBgUrl.split("/upload")[1];

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
      updatedImages[index] = {
        ...updatedImages[index],
        url: updatedImages[index].isBgRemovedImage ? removeBgUrl : newUrl,
        originalUrl: newUrl,
        removeBgUrl: removeBgUrl,
      };

      return updatedImages;
    });
  };
  const handleBrightness = (value, index) => {
    setProperties((prevProperties) =>
      prevProperties.map((property, i) =>
        i === index ? { ...property, brightness: value } : property
      )
    );

    updateImageTransformations(index, value, "e_brightness:");
  };

  const handleContrast = (value, index) => {
    setProperties((prevProperties) =>
      prevProperties.map((property, i) =>
        i === index ? { ...property, contrast: value } : property
      )
    );
    updateImageTransformations(index, value, "e_contrast:");
  };

  const handleFilter = (value, index) => {
    setProperties((prevProperties) =>
      prevProperties.map((property, i) =>
        i === index ? { ...property, filter: value } : property
      )
    );
    updateImageTransformations(index, value, "e_art:");
  };

  const blobToBase64 = (blob) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };
  const removeBackgroundHandler = async (e, index) => {
    const isChecked = e.target.checked;
    setProperties((prevProperties) =>
      prevProperties.map((property, i) =>
        i === index ? { ...property, removeBackground: isChecked } : property
      )
    );

    if (isChecked) {
      // setUploadImageLoader(true);
      // setRemoveBackgroundLoader({index:index,loading:true});
      setRemoveBackgroundLoader((prevState) => ({
        ...prevState,
        [index]: { loading: true }, // Update only the specific index
      }));

      if (uploadedImages[index].removePublicId) {
        setUploadImageLoader(false);
        setUploadedImages((prevImages) => {
          const updatedImages = [...prevImages];
          updatedImages[index] = {
            ...updatedImages[index],
            publicId: uploadedImages[index].removePublicId,
            url: uploadedImages[index].removeBgUrl,
            isBgRemovedImage: true,
          };
          return updatedImages;
        });
      } else {
        const blob = await removeBackground(uploadedImages[index].url);
        const processedUrl = URL.createObjectURL(blob);
        const processedBlob = await fetch(processedUrl).then((res) =>
          res.blob()
        );

        // Convert Blob to Base64
        const base64File = await blobToBase64(processedBlob);
        const res = await updateCloudinaryImage(
          uploadedImages[index].publicId,
          base64File
        );
        if (res.success == true) {
          setUploadedImages((prevImages) => {
            const updatedImages = [...prevImages];
            updatedImages[index] = {
              ...updatedImages[index],
              publicId: res.data.public_id,
              removePublicId: res.data.public_id,
              removeBgUrl: res.data.secure_url,
              url: res.data.secure_url,
              isBgRemovedImage: true,
            };
            return updatedImages;
          });
        } else {
          console.log("something went wrong");
        }
        setUploadImageLoader(false);
      }
      setRemoveBackgroundLoader({});
    } else {
      setUploadedImages((prevImages) => {
        const updatedImages = [...prevImages];
        updatedImages[index] = {
          ...updatedImages[index],
          publicId: uploadedImages[index].originalPublicId,
          url: uploadedImages[index].originalUrl,
          isBgRemovedImage: false,
        };
        return updatedImages;
      });
    }
  };
  const handleImageError = (e, index) => {
    setImageUploadError((prevErrors) => {
      const newErrors = [...prevErrors];
      newErrors[index] = "Failed To change background.Something went wrong !!"; // Mark the specific index as having an error
      return newErrors;
    });
  };
  const step2Handler = () => {
    dispatch(setUploadedImagesOfProduct(uploadedImages));
    dispatch(setPropertiesOfProduct(properties));
    handleSaveUrl(uploadedImages);
  };

  const handleFileSelection = async (e) => {
    const files = Array.from(e.target.files);
    // Check if any of the selected files are videos
    const invalidFile = files.some(file => {
      const fileExtension = file.name.split('.').pop().toLowerCase();
      return ['mp4', 'avi', 'mov', 'mkv', 'webm','gif'].includes(fileExtension);
    });

    // If a video is found, show an error and prevent upload
    if (invalidFile) {
      toast.error("Please upload an image only.", {
        position: "top-right",
        autoClose: 3000,
      });
      return;
    }

    if (uploadedImages.length + files.length > 4) {
      toast.error("You can upload maximum of 4 images for each product.", {
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
        <Button
          type="button"
          onPress={handleCameraClick}
          className="camera-button text-[2rem]"
        >
          <IoIosCamera />
        </Button>

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
              setCroppingImage={setCroppingImage}
              setUploadImageLoader={setUploadImageLoader}
              setUploadedImages={setUploadedImages}
            />
          </div>
        )}

        {uploadImageLoader && (
          <div>
            <p className="text-[1.4rem] text-gray-800">
              Uploading image, please wait...
            </p>
            <div className="ml-2 ">
              <Spinner size="sm" color="success" label="Loading..." />{" "}
            </div>
          </div>
        )}
        {uploadedImages.length == 0 && (
          <>
            <div className="mt-4 flex lg:flex-row flex-col gap-3">
              <div className="border p-8 rounded mb-4 bg-[#f1f3f1] lg:w-[49%]">
                 Front View
              </div>
              <div className="border p-8 rounded mb-4 bg-[#f1f3f1] lg:w-[49%]">
                 Side View
              </div>
            </div>

            <div className="mt-4 flex lg:flex-row flex-col gap-3">
              <div className="border p-8 rounded mb-4 bg-[#f1f3f1] lg:w-[49%]">
                 Back View
              </div>
              <div className="border p-8 rounded mb-4 bg-[#f1f3f1] lg:w-[49%]">
                 Detail View
              </div>
            </div>
          </>
        )}
        {uploadedImages.length > 0 && (
          <div className="flex flex-wrap w-full justify-between lg:flex-row flex-col mt-4">
            {uploadedImages.map((imageUrl, index) => (
              <div key={index} className="mt-4 lg:w-[49%] w-full">
                <div className="border p-8 rounded mb-4 bg-[#f1f3f1]">
                  <div className="flex w-full justify-between]">
                    <div className="w-[40% pr-[2rem]">
                      {imageUploadError[index] ? (
                        <div className="text-red-500">
                          Failed to load image.
                        </div>
                      ) : (
                        <Image
                          src={imageUrl.url}
                          alt={`Uploaded Image ${index + 1}`}
                          width={300}
                          height={200}
                          onError={(e) => handleImageError(e, index)} // Handle specific image error
                          style={{
                            maxWidth: "300px",
                            height: "auto",
                            margin: "auto",
                          }}
                          layout="intrinsic"
                        />
                      )}
                    </div>

                    <div className="w-[60%] lg:mt-[10px] mt-0 relative">
                      <div className="flex justify-between w-full">
                        <Slider
                          defaultValue={
                            storedProperties[index]?.brightness || 0
                          }
                          label="Brightness"
                          maxValue={99}
                          minValue={-99}
                          onChangeEnd={(value) =>
                            handleBrightness(value, index)
                          }
                          step={1}
                        />
                      </div>
                      <div className="flex my-5 justify-between w-full">
                        <Slider
                          defaultValue={storedProperties[index]?.contrast || 0}
                          label="Contrast"
                          maxValue={99}
                          minValue={-99}
                          onChangeEnd={(value) => handleContrast(value, index)}
                          step={1}
                        />
                      </div>

                      <div className="custom-select text-start">
                        <Select
                          defaultSelectedKeys={[
                            storedProperties[index]?.filter || "",
                          ]}
                          onChange={(e) => handleFilter(e.target.value, index)}
                          // label="Filters"
                          placeholder="Select filter option"
                          className="custom-select"
                          style={{
                            background: "#fff",
                            border: "1px solid #e5e7eb",
                          }}
                        >
                          <SelectItem key="" value="" className="custom-select">
                            -- Select a filter --
                          </SelectItem>
                          {filters.map((filterOption) => (
                            <SelectItem
                              key={filterOption.key}
                              value={filterOption.key}
                              className="custom-select py-[1rem]"
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
                              storedProperties[index]?.removeBackground || false
                            }
                            isDisabled={
                              Object.keys(removeBackgroundLoader).length > 0 ||
                              false
                            }
                            onChange={(e) => removeBackgroundHandler(e, index)}
                          >
                            <span className="pr-[2rem]">Remove Background</span>
                          </Checkbox>
                          {removeBackgroundLoader[index]?.loading && (
                            <Spinner size="sm" color="success" />
                          )}
                        </div>
                      </div>
                      <div className="text-left">
                        <RemoveImage
                          index={index}
                          disabled={
                            Object.keys(removeBackgroundLoader).length > 0 ||
                            false
                          }
                        
                          publicId={imageUrl?.publicId}
                          uploadedImages={uploadedImages}
                          setDeleteImageLoader={setDeleteImageLoader}
                          deleteImageLoader={deleteImageLoader}
                          setUploadedImages={setUploadedImages}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex  items-center w-full justify-between lg:pr-[25px] p-0">
          <div className="text-start mt-5 ">
            <Button
              isDisabled={
                uploadImageLoader ||
                Object.keys(removeBackgroundLoader).length > 0
              }
              onPress={handleBackStep}
              className="text-[1.2rem] py-6 px-6 bg-[#333] text-white rounded-lg"
            >
              Back
            </Button>
          </div>
          <div className="flex mt-5 items-center">
            <div className="text-start">
              <Button
                isDisabled={
                  uploadImageLoader ||
                  Object.keys(removeBackgroundLoader).length > 0 ||
                  uploadedImages.length === 4
                }
                onPress={handleCameraClick}
                className="text-[1.2rem] py-6 px-6 text-white rounded-lg"
                color="success"
              >
                Add Product
              </Button>
            </div>
            <div className="text-start pl-[1rem]">
              <Button
                isDisabled={
                  uploadImageLoader ||
                  Object.keys(removeBackgroundLoader).length > 0 ||
                  uploadedImages.length === 0
                }
                onPress={step2Handler}
                className=" text-[1.2rem] px-6 py-6 rounded-lg"
                color="danger"
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
