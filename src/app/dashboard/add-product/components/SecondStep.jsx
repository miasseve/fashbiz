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
import {
  clearProductState,
  clearConsignors,
  setCurrentStep,
} from "@/features/productSlice";
import { useDispatch, useSelector } from "react-redux";
import { createProduct } from "@/actions/productActions";
import { useRouter } from "next/navigation";
import { activateCollectSubscription } from "@/actions/accountAction";
import { FaBoxOpen } from "react-icons/fa6";
import { toast } from "react-toastify";

const FABRIC_OPTIONS = [
  "Cotton",
  "Wool",
  "Denim",
  "Tweed",
  "Leather",
  "Suede",
  "Silk",
  "Fur",
  "Viscose",
  "Acrylic",
  "Cashmere",
  "Alpaca",
  "Synthetique",
  "Synthetic Leather",
  "Lace",
  "Synthetic Fur",
  "Linen",
  "Merinos",
  "Mousseline",
  "Nylon",
  "Polyester",
  "Satin",
  "Velvet",
  "Corduroy",
  "Elastane",
];

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
  const [isCollectOpen, setIsCollectOpen] = useState(false);
  const [collectSelection, setCollectSelection] = useState(null);
  const [formData, setFormData] = useState(null);

  const reduxImages = useSelector((state) => state.product.uploadedImages);
  // const currentYear = new Date().getFullYear();
  const currentYear = new Date().getFullYear().toString().slice(-2);
  const formattedStoreName = user.storename
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
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

  const handleCollectSubmit = async () => {
    if (collectSelection === null) {
      toast.error("Please select Yes or No");
      return;
    }

    if (formData) {
      await handleFinalProductCreation(formData);
      setIsCollectOpen(false);
    }
  };

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
            const {
              title = "",
              brand = "",
              description = "",
              color = {},
              subcategory = "",
            } = response.data;
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
      const formattedBrand = brandValue
        .replace(/\s+/g, "")
        .toUpperCase()
        .slice(0, 2);
      const generatedSKU = `${formattedStoreName}${currentYear}${formattedBrand}${
        parseInt(productCount) + 1
      }`;
      setValue("sku", generatedSKU);
    }
  }, [brandValue, setValue, user.storename, currentYear, productCount]);

  const onSubmit = async (data) => {
    setErrorMessage("");
    //check if the product brand has Ree collect subscription
    try {
      const collectResponse = await activateCollectSubscription(brandValue);

      if (collectResponse.status === 200 && collectResponse.data !== null) {
        const updatedData = {
          ...data,
          brandPrice: collectResponse.data,
        };
        setFormData(updatedData);
        setIsCollectOpen(true);
        return;
      }

      await handleFinalProductCreation(data);
    } catch (error) {
      console.error("Error checking collect subscription:", error);
      await handleFinalProductCreation(data);
    }
    // const response = await createProduct({ ...data, ...consignorData,collect:collectSelection });
    // if (response.status == 200) {
    //   setGeneratedLink(response.data);
    //   dispatch(clearProductState());
    //   setShowConfirmation(true);
    // } else {
    //   setErrorMessage(response.error);
    // }
  };

  const handleFinalProductCreation = async (data) => {
    if (!data) return;
    try {
      const response = await createProduct({
        ...data,
        ...consignorData,
        collect: collectSelection ?? false,
      });

      if (response.status === 200) {
        setGeneratedLink(response.data);
        setShowConfirmation(true);
        dispatch(clearProductState());
        setFormData(null);
        setCollectSelection(null);
      } else {
        setErrorMessage(response.error);
      }
    } catch (e) {
      console.log("Error in product creation:", e);
      setErrorMessage("Failed to create product. Please try again.");
    }
  };

  // Function to handle the action of navigating to the dashboard
  const handleGoToDashboard = () => {
    // Set the state to hide the confirmation message
    setShowConfirmation(false);
    dispatch(clearConsignors());
    dispatch(setCurrentStep(1));
    if (collectSelection) {
      router.push("/dashboard/ree-collect");
      return;
    }
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
                    className="w-full border border-gray-300 rounded px-3 py-2"
                  >
                    <option value="">Select Category</option>
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
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
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
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
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
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
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
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                  {errors.brand && (
                    <span className="text-red-500 font-bold text-[12px]">
                      {errors.brand.message}
                    </span>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium">Size:
                    <span className="text-s font-normal"><em> (Enter sizes separated by commas,e.g.S,M or 38,40)</em></span></label>
                  <input
                    placeholder="e.g. S, M, L, XL or 38, 40, 42"
                    {...register("size")}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                  {errors.size && (
                    <span className="text-red-500 font-bold text-[12px]">
                      {errors.size.message}
                    </span>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium">Fabric</label>
                  <select
                    {...register("fabric")}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  >
                    <option value="">Select Fabric</option>
                    {FABRIC_OPTIONS.map((fabric) => (
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
                  {errors.color && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.color.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium">Price</label>
                  <input
                    {...register("price")}
                    type="text"
                    placeholder="Price in €"
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
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
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
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
        </div>
      )}

      {showConfirmation && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 m-auto">
          <Modal
            ref={targetRef}
            isOpen={showConfirmation}
            onOpenChange={onOpenChange}
            className="lg:max-w-xl w-full m-auto mt-[15rem]"
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
      )}

      <Modal
        backdrop="blur"
        isOpen={isCollectOpen}
        onClose={() => setIsCollectOpen(false)}
        isDismissable={false}
        placement="center"
        size="2xl"
        className="rounded-xl mx-6 sm:mx-8"
      >
        <ModalContent>
          <ModalHeader className="flex justify-center items-center text-2xl font-semibold">
            Brand Collect
          </ModalHeader>

          <ModalBody className="flex flex-col gap-6 items-center justify-center py-6">
            <div className="bg-pink-500 p-6 rounded-full border-4 border-white flex items-center justify-center shadow-lg">
              <FaBoxOpen className="text-white text-5xl" />
            </div>

            <p className="text-center text-gray-700 dark:text-gray-300 text-lg leading-relaxed px-4">
              Do you want to add this product to the{" "}
              <strong>Ree Collect</strong> program? If yes, this product will
              not appear in your store but will be visible in the Ree Collect
              marketplace.
            </p>

            <div className="flex flex-col sm:flex-row gap-6 items-center">
              <label className="flex items-center gap-3 cursor-pointer text-lg">
                <input
                  type="radio"
                  name="collectOption"
                  value="yes"
                  onChange={() => setCollectSelection(true)}
                  className="w-5 h-5 cursor-pointer"
                />
                Yes
              </label>

              <label className="flex items-center gap-3 cursor-pointer text-lg">
                <input
                  type="radio"
                  name="collectOption"
                  value="no"
                  onChange={() => setCollectSelection(false)}
                  className="w-5 h-5 cursor-pointer"
                />
                No
              </label>
            </div>
          </ModalBody>

          <div className="flex justify-center mb-6">
            <button
              onClick={handleCollectSubmit}
              className="px-8 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg shadow-md text-lg"
            >
              Continue
            </button>
          </div>
        </ModalContent>
      </Modal>
    </>
  );
};

export default SecondStep;
