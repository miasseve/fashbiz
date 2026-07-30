import React, { useRef, useState } from "react";
import axios from "axios";
import { Cropper } from "react-cropper";
import "cropperjs/dist/cropper.css";
import { Button } from "@heroui/button";
import { toast } from "react-toastify";

// Phone photos (iPhones especially) are routinely 3-8MB+ at full resolution.
// Vercel's serverless functions hard-reject request bodies over ~4.5MB, and
// nothing before this capped the upload size — capping the cropped output's
// dimensions keeps uploads fast and comfortably under that ceiling.
const MAX_CROPPED_DIMENSION = 1600;
const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;

const CropImage = ({
  cropImage,
  setCroppingImage,
  setUploadImageLoader,
  selectedView,
  setUploadedImagesWithView,
  uploadImageLoader,
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
    if (!cropper) return;

    // Downscale to a sane max dimension before re-encoding — product photos
    // don't need full 12MP+ phone-camera resolution, and this is what keeps
    // the upload fast and under the platform's request size limit.
    const cropBox = cropper.getData();
    let targetWidth = cropBox.width;
    let targetHeight = cropBox.height;
    const longestSide = Math.max(targetWidth, targetHeight);
    if (longestSide > MAX_CROPPED_DIMENSION) {
      const scale = MAX_CROPPED_DIMENSION / longestSide;
      targetWidth = Math.round(targetWidth * scale);
      targetHeight = Math.round(targetHeight * scale);
    }

    // fillColor: without this, any sliver of canvas cropperjs doesn't paint
    // over (a well-known float-rounding edge case in getCroppedCanvas) stays
    // transparent — and since JPEG has no alpha channel, that transparency
    // flattens to BLACK on export. This is the "black line on one edge" bug.
    const croppedDataURL = cropper
      .getCroppedCanvas({
        width: targetWidth,
        height: targetHeight,
        fillColor: "#ffffff",
      })
      .toDataURL("image/jpeg", 0.85);
    const croppedFile = dataURLToFile(croppedDataURL, "cropped-image.jpeg");

    const uploaded = await handleUpload(croppedFile);
    // Only dismiss the crop screen once the upload actually succeeded, so a
    // failure lets the person retry instead of losing the photo silently.
    if (uploaded) {
      setCroppingImage(null);
    }
  };

  const handleUpload = async (file) => {
    if (!file) {
      toast.error("Please select an image.");
      return false;
    }

    if (file.size > MAX_UPLOAD_BYTES) {
      toast.error(
        "This image is too large to upload. Please try a different photo.",
      );
      return false;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("isProfileImage", false);

    setError(null);
    setUploadImageLoader(true);
    try {
      const response = await axios.post("/api/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        timeout: 30000,
      });

      setUploadedImagesWithView((prevImages) => ({
        ...prevImages,
        [selectedView]: {
          isBgRemovedImage: false,
          removeBgUrl: "",
          removePublicId: "",
          url: response.data.url,
          publicId: response.data.publicId,
          originalUrl: response.data.url,
          originalPublicId: response.data.publicId,
        },
      }));
      return true;
    } catch (error) {
      const message =
        error.code === "ECONNABORTED"
          ? "Upload timed out. Please check your connection and try again."
          : error.response?.data?.error ||
            error.message ||
            "Failed to upload image.";
      setError(message);
      toast.error(message);
      return false;
    } finally {
      // Previously only cleared on success — a failed upload left the
      // "Uploading, please wait..." spinner stuck on screen forever.
      setUploadImageLoader(false);
    }
  };

  return (
    <div className="text-center m-auto relative z-0">
      <Cropper
        className="m-auto my-6 w-full sm:w-4/5 md:w-3/5 lg:w-2/5"
        src={cropImage}
        style={{ height: 200 }}
        // aspectRatio={1} // Adjust aspect ratio as needed
        guides={false}
        ref={cropperRef}
      />
      {/*
        cropperjs's default corner handles shrink to a ~5px hit target on
        larger breakpoints and rely on the browser's native touch-scroll
        being disabled to drag smoothly — on iPhone this makes the corner
        "grab" point tiny and the drag fight with page scroll/zoom. Force a
        consistently large, visible handle at every screen size and disable
        native touch gestures on the crop box so dragging a corner tracks
        the finger instead of the page.
      */}
      <style jsx global>{`
        .cropper-point {
          width: 22px !important;
          height: 22px !important;
          opacity: 0.9 !important;
          background-color: #3b82f6 !important;
          border-radius: 4px;
        }
        .cropper-point.point-se {
          bottom: -11px !important;
          right: -11px !important;
        }
        .cropper-point.point-ne {
          top: -11px !important;
          right: -11px !important;
        }
        .cropper-point.point-sw {
          bottom: -11px !important;
          left: -11px !important;
        }
        .cropper-point.point-nw {
          top: -11px !important;
          left: -11px !important;
        }
        .cropper-point.point-n,
        .cropper-point.point-s {
          left: 50% !important;
          margin-left: -11px !important;
        }
        .cropper-point.point-e,
        .cropper-point.point-w {
          top: 50% !important;
          margin-top: -11px !important;
        }
        .cropper-crop-box,
        .cropper-face,
        .cropper-line,
        .cropper-point {
          touch-action: none !important;
        }
      `}</style>
      <Button
        isDisabled={uploadImageLoader}
        onPress={handleCrop}
        className="danger-btn m-auto"
      >
        Crop and Upload
      </Button>
      {error && <p className="text-red-500">{error}</p>}
    </div>
  );
};

export default CropImage;
