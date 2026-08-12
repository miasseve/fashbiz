"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@heroui/button";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
} from "@heroui/react";
import { toast } from "react-toastify";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { yupResolver } from "@hookform/resolvers/yup";
import { updateProductSchema } from "@/actions/validations";
import { updateProduct } from "@/actions/productActions";
import { useDispatch } from "react-redux";
import { updateProductInCart } from "@/features/cartSlice";
import { FiEdit2 } from "react-icons/fi";
import { FaTimes, FaPlus, FaSpinner, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import axios from "axios";

const EditButton = ({ product, compact = false }) => {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const router = useRouter();
  const dispatch = useDispatch();
  const [fabricOptions, setFabricOptions] = useState([]);
  const [images, setImages] = useState(product?.images || []);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [deletingPublicId, setDeletingPublicId] = useState(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: yupResolver(updateProductSchema),
    context: {
      hasPrice: product?.price > 1,
    },
    defaultValues: {
      title: product?.title || "",
      brand: product?.brand || "",
      price:  Number(product?.price) || "",
      pointsValue: Number(product?.pointsValue) || "",
      description: product?.description || "",
      subcategory: product?.subcategory || "",
      sku: product?.sku || "",
      size: Array.isArray(product?.size)
        ? product.size.join(", ")
        : product.size || "",
      fabric: product?.fabric || "",
    },
  });

  useEffect(() => {
    const fetchFabricOptions = async () => {
      try {
        const response = await fetch("/api/fabric-options");
        const data = await response.json();
        if (data.status != 200) {
          setFabricOptions([]);
        }
        setFabricOptions(data.map((item) => item.name));
      } catch (error) {
        console.error("Error fetching fabric options:", error);
      }
    };
    fetchFabricOptions();
  }, []);

  const onSubmit = async (data) => {
    const response = await updateProduct(product._id, { ...data, images });
    if (response.status === 200) {
      toast.success("Product updated successfully!");
      dispatch(
        updateProductInCart({
          _id: product._id,
          updatedData: {
            ...data,
            images,
            price: Number(data.price),
          },
        }),
      );

      onOpenChange(false);
      router.push("/dashboard/product/" + product._id);
    } else {
      toast.error(response.error || "Failed to update product.");
    }
  };
  const onError = (errors) => {
    console.log("Form errors:", errors);
    toast.error("Error in Updating the Product details.");
  }

  const handleAddImage = async (e) => {
    const file = e.target.files[0];
    e.target.value = "";
    if (!file) return;
    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await axios.post("/api/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const { url, publicId } = response.data;
      setImages((prev) => [...prev, { url, publicId }]);
    } catch (err) {
      toast.error("Failed to upload image");
    } finally {
      setUploadingImage(false);
    }
  };

  // The first photo becomes the hero image everywhere it's shown (Ree,
  // webstore, Instagram) — this lets the store pick which one that is,
  // instead of it always being whatever was uploaded first.
  const moveImage = (index, direction) => {
    setImages((prev) => {
      const next = [...prev];
      const target = index + direction;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const handleRemoveImage = async (publicId) => {
    setDeletingPublicId(publicId);
    try {
      await axios.delete(`/api/upload?publicId=${encodeURIComponent(publicId)}`);
      setImages((prev) => prev.filter((img) => img.publicId !== publicId));
    } catch (err) {
      toast.error("Failed to remove image");
    } finally {
      setDeletingPublicId(null);
    }
  };

  return (
    <>
      {compact ? (
        <button
          type="button"
          onClick={onOpen}
          title="Edit product"
          className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200"
        >
          <FiEdit2 size={15} />
        </button>
      ) : (
        <Button onPress={onOpen} className="auth-btn">
          <FiEdit2 size={18} />
          Edit Product
        </Button>
      )}

      <Modal
        backdrop="blur"
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        size="2xl"
        placement="center"
        scrollBehavior="inside"
        classNames={{
          wrapper: "items-center",
          base: "my-8 max-h-[90vh]",
        }}
      >
        <ModalContent>
          {(onClose) => (
            <form
              onSubmit={handleSubmit(onSubmit, onError)}
              className="flex flex-col max-h-[90vh]"
            >
              <ModalHeader className="flex-shrink-0 flex justify-center text-2xl">
                Edit Product
              </ModalHeader>

              <ModalBody className="overflow-y-auto flex-grow px-6">
                <div className="mb-4">
                  <label className="text-sm font-medium block mb-2">
                    Photos
                  </label>
                  <p className="text-xs text-gray-500 mb-2">
                    The first photo is the main one shown everywhere — use the arrows to reorder.
                  </p>
                  <div className="flex flex-wrap gap-3">
                    {images.map((img, index) => (
                      <div
                        key={img.publicId}
                        className="relative w-20 h-20 rounded-lg overflow-hidden border"
                      >
                        <img
                          src={img.url}
                          alt="Product"
                          className="w-full h-full object-cover"
                        />
                        {index === 0 && (
                          <span className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-[9px] text-center py-0.5">
                            Main
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(img.publicId)}
                          disabled={deletingPublicId === img.publicId}
                          className="absolute top-1 right-1 w-5 h-5 flex items-center justify-center rounded-full bg-black/60 text-white text-[10px] hover:bg-red-600 disabled:opacity-50"
                        >
                          {deletingPublicId === img.publicId ? (
                            <FaSpinner className="animate-spin" size={10} />
                          ) : (
                            <FaTimes size={10} />
                          )}
                        </button>
                        {index > 0 && (
                          <button
                            type="button"
                            onClick={() => moveImage(index, -1)}
                            className="absolute top-1 left-1 w-5 h-5 flex items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
                            title="Move earlier"
                          >
                            <FaChevronLeft size={9} />
                          </button>
                        )}
                        {index < images.length - 1 && (
                          <button
                            type="button"
                            onClick={() => moveImage(index, 1)}
                            className="absolute top-1 right-1 w-5 h-5 flex items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
                            style={{ right: "1.5rem" }}
                            title="Move later"
                          >
                            <FaChevronRight size={9} />
                          </button>
                        )}
                      </div>
                    ))}
                    <label className="w-20 h-20 rounded-lg border-2 border-dashed flex items-center justify-center cursor-pointer text-gray-400 hover:text-gray-600 hover:border-gray-400">
                      {uploadingImage ? (
                        <FaSpinner className="animate-spin" />
                      ) : (
                        <FaPlus />
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleAddImage}
                        disabled={uploadingImage}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium block mb-1">
                      SKU
                    </label>
                    <input
                      {...register("sku")}
                      className="w-full border px-3 py-2 rounded"
                      readOnly
                    />
                    {errors.sku && (
                      <p className="text-red-500 font-bold text-[12px]">
                        {errors.sku.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="text-sm font-medium block mb-1">
                      Title
                    </label>
                    <input
                      {...register("title")}
                      className="w-full border px-3 py-2 rounded"
                    />
                    {errors.title && (
                      <p className="text-red-500 font-bold text-[12px]">
                        {errors.title.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="text-sm font-medium block mb-1">
                      Brand
                    </label>
                    <input
                      {...register("brand")}
                      className="w-full border px-3 py-2 rounded"
                    />
                    {errors.brand && (
                      <p className="text-red-500 font-bold text-[12px]">
                        {errors.brand.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="text-sm font-medium block mb-1">
                      Sub Category
                    </label>
                    <input
                      {...register("subcategory")}
                      className="w-full border px-3 py-2 rounded"
                    />
                    {errors.subcategory && (
                      <span className="text-red-500 font-bold text-[12px]">
                        {errors.subcategory.message}
                      </span>
                    )}
                  </div>

                  <div>
                    <label className="text-sm font-medium block mb-1">
                      Size
                    </label>
                    <input
                      {...register("size")}
                      className="w-full border px-3 py-2 rounded"
                    />
                    {errors.size && (
                      <span className="text-red-500 font-bold text-[12px]">
                        {errors.size.message}
                      </span>
                    )}
                  </div>

                  <div>
                    <label className="text-sm font-medium block mb-1">
                      Fabric
                    </label>
                    <select
                      {...register("fabric")}
                      className="w-full border px-3 py-2 rounded"
                    >
                      <option value="">Select Fabric</option>
                      {fabricOptions.map((fabric) => (
                        <option key={fabric} value={fabric}>
                          {fabric}
                        </option>
                      ))}
                    </select>
                    {errors.fabric && (
                      <span className="text-red-500 font-bold text-[12px]">
                        {errors.fabric.message}
                      </span>
                    )}
                  </div>

                  <div>
                    {/* PRICE (hidden but registered) */}
                    <div hidden={product?.price <= 1}>
                      <label className="text-sm font-medium block mb-1">
                        Price
                      </label>
                      <input
                        type="number"
                        {...register("price")}
                        className="w-full border px-3 py-2 rounded"
                      />
                      {errors.price && (
                        <p className="text-red-500 font-bold text-[12px]">
                          {errors.price.message}
                        </p>
                      )}
                    </div>

                    {/* POINTS (hidden but registered) */}
                    <div hidden={!product?.pointsValue}>
                      <label className="text-sm font-medium block mb-1">
                        Points Value
                      </label>
                      <input
                        type="number"
                        {...register("pointsValue")}
                        className="w-full border px-3 py-2 rounded"
                      />
                      {errors.pointsValue && (
                        <p className="text-red-500 font-bold text-[12px]">
                          {errors.pointsValue.message}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <label className="text-sm font-medium block mb-1">
                      Description
                    </label>
                    <textarea
                      {...register("description")}
                      placeholder="Enter description"
                      className="w-full border px-3 py-2 rounded min-h-[80px]"
                      rows={3}
                    />
                    {errors.description && (
                      <p className="text-red-500 font-bold text-[12px]">
                        {errors.description.message}
                      </p>
                    )}
                  </div>
                </div>
              </ModalBody>
              <ModalFooter className="flex-shrink-0">
                <Button className="danger-btn" onPress={onClose}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="success-btn"
                  isLoading={isSubmitting}
                >
                  Save Changes
                </Button>
              </ModalFooter>
            </form>
          )}
        </ModalContent>
      </Modal>
    </>
  );
};

export default EditButton;
