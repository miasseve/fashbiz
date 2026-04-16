import React from "react";
import axios from "axios";
import { Button } from "@heroui/react";
import { toast } from "react-toastify";
import { Spinner } from "@heroui/react";

const RemoveImage = ({
  viewType,
  publicId,
  disabled,
  uploadedImagesWithView,
  setDeleteImageLoader,
  deleteImageLoader,
  setUploadedImagesWithView,
}) => {
  const handleRemoveImage = async () => {
    try {
      setDeleteImageLoader({ index: viewType, loading: true });
      const response = await axios.delete(
        `/api/upload?publicId=${publicId}&removeBgPublicId=${uploadedImagesWithView[viewType].removePublicId}`
      );
      if (response.status == 200) {
        setDeleteImageLoader({ index: viewType, loading: false });

        setUploadedImagesWithView((prevImages) => ({
          ...prevImages,
          [viewType]: null,
        }));

        toast.success("Image deleted successfully!", {
          position: "top-right",
          autoClose: 2000,
        });
      }
    } catch (error) {
      setDeleteImageLoader({ index: viewType, loading: false });
      toast.error("Error deleting image. Please try again.");
    }
  };

  const isLoading =
    deleteImageLoader.index == viewType && deleteImageLoader.loading == true;

  return (
    <Button
      isIconOnly
      isDisabled={disabled || isLoading}
      className={`absolute right-5 !top-[-7px] z-10 !m-0 min-w-0 w-10 h-10 rounded-full text-white shadow-lg ${
        disabled || isLoading
          ? "bg-gray-400 cursor-not-allowed opacity-50"
          : "bg-red-600 hover:bg-red-700"
      }`}
      onPress={() => handleRemoveImage(viewType, publicId)}
    >
      {isLoading ? (
        <Spinner size="sm" color="white" />
      ) : (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2.5}
          stroke="currentColor"
          className="w-6 h-6"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      )}
    </Button>
  );
};

export default RemoveImage;
