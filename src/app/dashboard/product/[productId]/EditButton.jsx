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

const EditButton = ({ product }) => {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const router = useRouter();
  const dispatch = useDispatch();
 
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: yupResolver(updateProductSchema),
    defaultValues: {
      title: product?.title || "",
      brand: product?.brand || "",
      price: product?.price || "",
      description: product?.description || "",
      subcategory:product?.subcategory || "",
      sku: product?.sku || "",
    },
  });

  const onSubmit = async (data) => {
    const response = await updateProduct(product._id, data);
    if (response.status === 200) {
      toast.success("Product updated successfully!");
      dispatch(
        updateProductInCart({
          _id: product._id,
          updatedData: {
            ...data,
            price: Number(data.price),
          },
        })
      );

      onOpenChange(false);
      router.push("/dashboard/product/" + product._id);
    } else {
      toast.error(response.error || "Failed to update product.");
    }
  };

  return (
    <>
      <Button onPress={onOpen} className="auth-btn">
        <FiEdit2 size={18} />
        Edit Product
      </Button>

      <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="lg">
        <ModalContent>
          {(onClose) => (
            <form onSubmit={handleSubmit(onSubmit)}>
              <ModalHeader>Edit Product</ModalHeader>
              <ModalBody className="space-y-3">
                {/* <div>
                  <label className="text-sm font-medium">Category</label>
                  <select
                    {...register("collectionId")}
                     defaultValue={product?.collectionId || ""}
                    className="max-w-xs border border-gray-300 rounded px-3 py-2"
                    placeholder="Select Category"
                  >
                    <option value="">
                      Select Category
                    </option>
                    {collections.map((collection) => (
                      <option key={collection.id} value={collection.id}>
                        {collection.name}
                      </option>
                    ))}
                  </select>
                  {errors.collectionId && (
                    <p className="text-red-500 font-bold text-[12px]">
                      {errors.collectionId.message}
                    </p>
                  )}
                </div> */}

                <div>
                  <label className="text-sm font-medium">SKU</label>
                  <input
                    {...register("sku")}
                    placeholder="Enter SKU"
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
                  <label className="text-sm font-medium">Title</label>
                  <input
                    {...register("title")}
                    placeholder="Title"
                    className="w-full border px-3 py-2 rounded"
                  />
                  {errors.title && (
                    <p className="text-red-500 font-bold text-[12px]">
                      {errors.title.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium">Brand</label>
                  <input
                    {...register("brand")}
                    placeholder="Brand"
                    className="w-full border px-3 py-2 rounded"
                  />
                  {errors.brand && (
                    <p className="text-red-500 font-bold text-[12px]">
                      {errors.brand.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium">Sub Category</label>
                  <input
                    {...register("subcategory")}
                    placeholder="Sub Category"
                    className="w-full border px-3 py-2 rounded"
                  />
                  {errors.subcategory && (
                    <span className="text-red-500 font-bold text-[12px]">
                      {errors.subcategory.message}
                    </span>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium">Price</label>
                  <input
                    {...register("price")}
                    placeholder="Price (€)"
                    type="number"
                    className="w-full border px-3 py-2 rounded"
                  />
                  {errors.price && (
                    <p className="text-red-500 font-bold text-[12px]">
                      {errors.price.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium">Description</label>
                  <textarea
                    {...register("description")}
                    placeholder="Enter description"
                    className="w-full border px-3 py-2 rounded"
                  />
                  {errors.description && (
                    <p className="text-red-500 font-bold text-[12px]">
                      {errors.description.message}
                    </p>
                  )}
                </div>
              </ModalBody>
              <ModalFooter>
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
