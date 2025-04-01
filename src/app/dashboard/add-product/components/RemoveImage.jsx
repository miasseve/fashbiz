import React from "react";
import axios from "axios";
import { Button } from "@heroui/react";
import { toast } from "react-toastify";
import { Spinner } from "@heroui/react";
import { useDispatch, useSelector } from "react-redux";
import { setUploadedImagesOfProduct } from "@/features/productSlice";
const RemoveImage = ({
  viewType,
  publicId,
  disabled,
  uploadedImagesWithView,
  setDeleteImageLoader,
  deleteImageLoader,
  setUploadedImagesWithView
}) => {
  const dispatch = useDispatch();
  const storedProductImages = useSelector(
    (state) => state.product.uploadedImages
  );
 
  const handleRemoveImage = async () => {

    try {
      setDeleteImageLoader({ index:viewType, loading: true });
      const response = await axios.delete(
        `/api/upload?publicId=${publicId}&removeBgPublicId=${uploadedImagesWithView[viewType].removePublicId}`
      );
      if (response.status == 200) {
        setDeleteImageLoader({ index : viewType, loading: false });


        // const latestImages = uploadedImages.filter(
        //   (image) => image.publicId !== publicId
        // );
        // const latestImagesWithView = uploadedImagesWithView.filter(
        //   (image) => image.publicId !== publicId
        // );
        // const newImages = Object.values(storedProductImages).filter((image) => {
        //   console.log("Checking image:", image); // Log each image
        //   return image.publicId !== publicId;
        // });
        // console.log(newImages,'new-images');
        // dispatch(setUploadedImagesOfProduct(newImages));
        setUploadedImagesWithView((prevImages) => ({
          ...prevImages,
          [viewType]: null
        }));

        toast.success("Image deleted successfully!", {
          position: "top-right",
          autoClose: 2000,
        });
      
      }
    } catch (error) {
      setDeleteImageLoader({ index:viewType, loading: false });
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
      color="danger"
      isDisabled={disabled}
      className="rounded-lg px-6 py-6"
      onPress={() => handleRemoveImage(viewType , publicId)} 
    >
      Remove
    </Button>
  );
};

export default RemoveImage;
