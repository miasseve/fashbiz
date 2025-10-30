"use client";
import React, { useState, useEffect } from "react";
import { Spinner } from "@heroui/react";
import axios from "axios";
import { Card, CardHeader, CardBody, CardFooter, Button } from "@heroui/react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
} from "@heroui/react";
import { yupResolver } from "@hookform/resolvers/yup";
import { productSchema } from "@/actions/validations";
import { useForm } from "react-hook-form";
import { clearProductState, clearConsignors, setCurrentStep } from "@/features/productSlice";
import { useDispatch, useSelector } from "react-redux";
import { createProduct } from "@/actions/productActions";
import { useRouter } from "next/navigation";

const SecondStep = ({
  handleBackStep,
  handleAddMoreProducts,
  user,
  productCount,
}) => {
  const dispatch = useDispatch();
  const router = useRouter();
  const consignorData = useSelector((state) => state.product.consignor);
  const [loading, setLoading] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [generatedLink, setGeneratedLink] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const targetRef = React.useRef(null);

  const [collections, setCollections] = useState([]);
  const [colorHex, setColorHex] = useState("");

  const reduxImages = useSelector((state) => state.product.uploadedImages);
  // const currentYear = new Date().getFullYear();
  const currentYear = new Date().getFullYear().toString().slice(-2);
  const formattedStoreName = user.storename
  .toUpperCase()               
  .replace(/[^A-Z0-9]/g, '')   
  .slice(0, 3);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isValid, isSubmitting },
  } = useForm({
    mode: "onTouched",
    resolver: yupResolver(productSchema),
    defaultValues: {
      sku: formattedStoreName + currentYear + (parseInt(productCount) + 1),
      images: Object.values(reduxImages)
        .filter((image) => image !== null)
        .map((image) => ({
          url: image.url,
          publicId: image.publicId,
        })),
    },
  });

  useEffect(() => {
    const fetchCollections = async () => {
      try {
        const response = await axios.get("/api/wixCollections");
        if (response.status !== 200) {
          setErrorMessage("Failed to fetch categories.Please try again !!");
        }
        setCollections(response.data.collections);
      } catch (error) {
        setErrorMessage("Failed to fetch categories.Please try again !!");
      }
    };

    fetchCollections();
  }, []);

  useEffect(() => {
    const fetchProductDetails = async () => {
      setLoading(true);
      const imagesFiltered = Object.values(reduxImages)
        .filter((image) => image !== null)
        .map((image) => ({
          url: image.url,
          publicId: image.publicId,
        }));

      if (imagesFiltered.length > 0) {
        try {
          const response = await axios.post("/api/google-vision", {
            imageUrl: imagesFiltered[0]?.url ?? "",
          });
          if (response.status === 200) {
            const { title = '', brand = '', description = "", color = {}, subcategory = "" } = response.data;
            setValue("title", title);
            setValue("brand", brand);
            setValue("description", description || "");
            setValue("color.name", color?.name || "");
            setValue("color.hex", color?.hex || "");
            setValue("subcategory", subcategory || "");
            setColorHex(color?.hex);
          }
        } catch (error) {
          console.error("Error fetching product details:", error);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchProductDetails();
  }, []);

  const brandValue = watch("brand");

  useEffect(() => {
    if (brandValue) {
      const formattedBrand = brandValue.replace(/\s+/g, "").toUpperCase().slice(0, 2);;
      const generatedSKU = `${formattedStoreName}${currentYear}${formattedBrand}${parseInt(productCount) + 1}`;
      setValue("sku", generatedSKU);
    }
  }, [brandValue, setValue, user.storename, currentYear, productCount]);


  const onSubmit = async (data) => {
    setErrorMessage("");
    const response = await createProduct({ ...data, ...consignorData });
    if (response.status == 200) {
      setGeneratedLink(response.data);
      dispatch(clearProductState());
      setShowConfirmation(true);
    } else {
      setErrorMessage(response.error);
    }
  };

  // Function to handle the action of navigating to the dashboard
  const handleGoToDashboard = () => {
    // Set the state to hide the confirmation message
    setShowConfirmation(false);
    dispatch(clearConsignors());
    dispatch(setCurrentStep(1));
    router.push("/dashboard/store");
  };

  const handleCopyLink = async () => {
    if (!generatedLink) {
      alert("No link to copy!");
      return;
    }

    try {
      await navigator.clipboard.writeText(generatedLink);
    } catch (err) {
      alert("Failed to copy link. Please try again.");
    }
  };

  return (
    <>
      {loading ? (
        <div className="flex flex-col justify-center items-center h-screen">
          <Spinner size="lg" color="success" label="Loading..." />
        </div>
      ) : (
        <div className="flex justify-center">
          <Card className="lg:w-[38%] md:w-[45%] w-[90%] m-auto mt-[50px] inline-block mb-10">
            <form
              onSubmit={handleSubmit(onSubmit)}
              className="p-3 sm:p-[11px] md:p-[12px] lg:p-[14px] xl:p-[12px]"
            >
              <div>
                <h2 className="text-center font-semibold">
                  Enter Product Info
                </h2>
              </div>
              <CardBody className="gap-[15px]">
                {errorMessage && (
                  <span className="text-red-500 font-bold text-[12px]">
                    {errorMessage}
                  </span>
                )}

                <div>
                  <label className="text-sm font-medium">Category</label>
                  <select
                    {...register("collectionId")}
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
                    <span className="text-red-500 font-bold text-[12px]">
                      {errors.collectionId.message}
                    </span>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium">Sub Category</label>
                  <input
                    placeholder="Sub Category"
                    {...register("subcategory")}
                  />
                  {errors.subcategory && (
                    <span className="text-red-500 font-bold text-[12px]">
                      {errors.subcategory.message}
                    </span>
                  )}
                </div>
                <div className="h-full">
                  <label className="text-sm font-medium">SKU</label>
                  <input
                    placeholder="Enter SKU"
                    {...register("sku")}
                  />
                  {errors.sku && (
                    <span className="text-red-500 font-bold text-[12px]">
                      {errors.sku.message}
                    </span>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium">Title</label>
                  <input
                    placeholder="Title"
                    {...register("title")}
                  />
                  {errors.title && (
                    <span className="text-red-500 font-bold text-[12px]">
                      {errors.title.message}
                    </span>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium">Brand</label>
                  <input
                    placeholder="Brand"
                    {...register("brand")}
                  />
                  {errors.brand && (
                    <span className="text-red-500 font-bold text-[12px]">
                      {errors.brand.message}
                    </span>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium">Color</label>
                  <div className="flex items-center gap-4">
                    <input
                      type="text"
                      placeholder="white"
                      {...register("color.name")}
                      className="border border-gray-300 rounded-md px-3 py-2 w-full"
                    />
                    <input
                      type="hidden"
                      {...register("color.hex")}
                      value={colorHex || ""}
                    />
                    <div
                      style={{
                        width: "40px",
                        height: "40px",
                        borderRadius: "8px",
                        border: "1px solid #D3D3D3",
                        backgroundColor:
                          colorHex && colorHex !== "transparent"
                            ? colorHex
                            : watch("color.name")?.trim()
                              ? watch("color.name")
                              : "transparent",
                        transition: "background-color 0.3s ease",
                      }}
                    ></div>
                  </div>
                </div>
                {errors.color && (
                  <p className="text-red-500 text-sm mt-1">{errors.color.message}</p>
                )}

                <div>
                  <label className="text-sm font-medium">Price</label>
                  <input
                    {...register("price")}
                    type="text"
                    placeholder="Price in €"
                  />
                  {errors.price && (
                    <span className="text-red-500 font-bold text-[12px]">
                      {errors.price.message}
                    </span>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium">Description</label>
                  <textarea
                    id="description"
                    rows="4"
                    placeholder="Enter description"
                    {...register("description")}
                  />
                  {errors.description && (
                    <span className="text-red-500 font-bold text-[12px]">
                      {errors.description.message}
                    </span>
                  )}
                </div>
              </CardBody>
              <CardFooter className="flex justify-between">
                <Button onPress={handleBackStep} className="auth-btn">
                  Back
                </Button>
                <Button
                  type="submit"
                  isLoading={isSubmitting}
                  className="success-btn"
                >
                  Submit Product Info
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div >
      )}

      {
        showConfirmation && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 m-auto">
            <Modal
              ref={targetRef}
              isOpen={showConfirmation}
              onOpenChange={onOpenChange}
              className="lg:max-w-xl w-full m-auto  mt-[15rem]" // Ensures proper width
            >
              <ModalContent>
                {(onClose) => (
                  <>
                    <ModalHeader className="flex flex-col gap-1 text-center">
                      Product Added Successfully
                      <input type="text" value={generatedLink} readOnly />
                      <Button onPress={handleCopyLink} className="dark-btn">
                        Copy Link
                      </Button>
                    </ModalHeader>
                    <ModalBody className="text-center">
                      <p>Do you want to add more products?</p>
                    </ModalBody>
                    <ModalFooter className="flex justify-center">
                      <Button
                        onPress={handleAddMoreProducts}
                        className="success-btn m-auto"
                      >
                        Yes
                      </Button>
                      <Button
                        onPress={handleGoToDashboard}
                        className="danger-btn m-auto"
                      >
                        No
                      </Button>
                    </ModalFooter>
                  </>
                )}
              </ModalContent>
            </Modal>
          </div>
        )
      }
    </>
  );
};

export default SecondStep;
