import React from "react";
import axios from "axios";
import { Button } from "@heroui/react";
import { toast } from "react-toastify";
import { Spinner } from "@heroui/react";
const RemoveImage = ({
  index,
  publicId,
  disabled,
  uploadedImages,
  setDeleteImageLoader,
  setUploadedImages,
  deleteImageLoader,
}) => {
  const handleRemoveImage = async (index, publicId) => {
    try {
      setDeleteImageLoader({ index, loading: true });
      const response = await axios.delete(
        `/api/upload?publicId=${publicId}&removeBgPublicId=${uploadedImages[index].removePublicId}`
      );
      if (response.status == 200) {
        setDeleteImageLoader({ index, loading: false });
        const latestImages = uploadedImages.filter(
          (image) => image.publicId !== publicId
        );

        toast.success("Image deleted successfully!", {
          position: "top-right",
          autoClose: 2000,
        });
        setUploadedImages(latestImages);
      }
    } catch (error) {
      console.log(error, "error");
      setDeleteImageLoader({ index, loading: false });
      toast.error("Error deleting image. Please try again.");
    }
  };

  return deleteImageLoader.index == index &&
    deleteImageLoader.loading == true ? (
    <span className="text-[2rem]">
      {" "}
      <Spinner />
    </span>
  ) : (
    <Button
      color="danger"
      isDisabled={disabled}
      className="rounded-lg px-6 py-6"
      onPress={() => handleRemoveImage(index, publicId)} // Call remove handler
    >
      Remove
    </Button>
  );
};

export default RemoveImage;
