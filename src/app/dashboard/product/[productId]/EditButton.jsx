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
  const [fabricOptions, setFabricOptions] = useState([]);

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
      subcategory: product?.subcategory || "",
      sku: product?.sku || "",
      size: product?.size || "",
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

      <Modal
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
              onSubmit={handleSubmit(onSubmit)}
              className="flex flex-col max-h-[90vh]"
            >
              <ModalHeader className="flex-shrink-0 flex justify-center text-2xl">
                Edit Product
              </ModalHeader>

              <ModalBody className="overflow-y-auto flex-grow px-6">
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