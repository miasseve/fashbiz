import React, { useRef, useState } from "react";
import axios from "axios";
import { Cropper } from "react-cropper";
import "cropperjs/dist/cropper.css";
import { Button } from "@heroui/button";
const CropImage = ({
  cropImage,
  setCroppingImage,
  setUploadImageLoader,
  setUploadedImages,
  uploadImageLoader
}) => {
  const cropperRef = useRef(null);
  const [error, setError] = useState();
  const dataURLToFile = (dataUrl, filename) => {
    const arr = dataUrl.split(",");
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
  };

  const handleCrop = async () => {
    const cropper = cropperRef.current?.cropper;

    if (cropper) {
      const croppedDataURL = cropper.getCroppedCanvas().toDataURL("image/jpeg");
      const croppedFile = dataURLToFile(croppedDataURL, "cropped-image.jpeg");

      await handleUpload(croppedFile);
      // Reset croppingImage to allow the next file to be cropped
      setCroppingImage(null);
    }
  };

  const handleUpload = async (file) => {
    if (!file) return alert("Please select an image.");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("isProfileImage", false);

    try {
      setUploadImageLoader(true);
      const response = await axios.post("/api/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }); 
      setUploadImageLoader(false);
      setUploadedImages((prevImages) => [
        ...prevImages,
        {
          isBgRemovedImage: false,
          removeBgUrl: "",
          removePublicId: "",
          url: response.data.url,
          publicId: response.data.publicId,
          originalUrl: response.data.url,
          originalPublicId: response.data.publicId,
        },
      ]);
    } catch (error) {
      setError(error.message);
    }
  };

  return (
    <div className="text-center m-auto relative z-0">
      <Cropper
        className="m-auto my-6 w-full sm:w-4/5 md:w-3/5 lg:w-2/5"
        src={cropImage}
        style={{ height: 200 }}
        aspectRatio={1} // Adjust aspect ratio as needed
        guides={false}
        ref={cropperRef}
      />
      <Button 
         isDisabled={uploadImageLoader}
         onPress={handleCrop} 
         color="danger" 
         className="rounded-[7px]">
        Crop and Upload
      </Button>
      {error && <p className="text-red-500">{error}</p>}
    </div>
  );
};

export default CropImage;
