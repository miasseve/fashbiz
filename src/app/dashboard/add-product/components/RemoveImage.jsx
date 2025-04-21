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

  return deleteImageLoader.index == viewType &&
    deleteImageLoader.loading == true ? (
    <span className="text-[2rem]">
      {" "}
      <Spinner size="sm" color="success" />
    </span>
  ) : (
    <Button
      isDisabled={disabled}
      className="danger-btn !m-0"
      onPress={() => handleRemoveImage(viewType, publicId)}
    >
      Remove
    </Button>
  );
};

export default RemoveImage;
