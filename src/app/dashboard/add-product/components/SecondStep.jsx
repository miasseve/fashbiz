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
import { useSession } from "next-auth/react";
import PointsModal from "./PointsModal";
import GenerateBarcode from "../../product/[productId]/GenerateBarcode";
import ProductFormFields from "./ProductFormFields";

const SecondStep = ({
  handleBackStep,
  handleAddMoreProducts,
  user,
  productCount,
  addonPurchase,
}) => {
  const dispatch = useDispatch();
  const router = useRouter();
  const session = useSession();
  const pointsEnabled = session.data?.user?.points_mode || false;
  const [pointsPreview, setPointsPreview] = useState(null);
  const [isPointsModalOpen, setIsPointsModalOpen] = useState(false);
  const [pointsLoading, setPointsLoading] = useState(false);
  const [availableRules, setAvailableRules] = useState([]);

  const consignorData = useSelector((state) => state.product.consignor);
  const [loading, setLoading] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [productDetails, setProductDetails] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const targetRef = React.useRef(null);

  const [fabricOptions, setFabricOptions] = useState([]);
  const [colorHex, setColorHex] = useState("");
  const [isCollectOpen, setIsCollectOpen] = useState(false);
  const [collectSelection, setCollectSelection] = useState(null);
  const [formData, setFormData] = useState(null);

  // ── AI response tracking for corrections ──
  const [rawAiOutput, setRawAiOutput] = useState(null);
  const [aiMeta, setAiMeta] = useState(null);
  const [confidenceScore, setConfidenceScore] = useState(null);

  const reduxImages = useSelector((state) => state.product.uploadedImages);
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
      category: "",
      condition_grade: "",
      condition_notes: "",
    },
  });

  useEffect(() => {
    const fetchPointRules = async () => {
      if (!pointsEnabled) return;
      try {
        const res = await fetch("/api/dkkpointsrule");
        const response = await res.json();
        setAvailableRules(response);
      } catch (error) {
        console.error("Error fetching point rules:", error);
        toast.error("Failed to fetch point rules");
      }
    };
    fetchPointRules();
  }, [pointsEnabled]);

  const predictProductPoints = async (productData) => {
    setPointsLoading(true);
    try {
      const res = await axios.post("/api/predict-points", {
        imageUrls: productData?.images?.map((img) => img.url) || [],
        brand: productData.brand,
        subcategory: productData.subcategory,
        description: productData.description,
      });
      if (res.status === 200 && res.data?.success) {
        setPointsPreview(res.data.data);
        setIsPointsModalOpen(true);
        return res.data.data.points || 0;
      }
    } catch (err) {
      console.log("Error predicting product points:", err);
      toast.error("Failed to predict product points");
    } finally {
      setPointsLoading(false);
    }
  };

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
    if (pointsEnabled) {
      setValue("price", "1", { shouldValidate: true });
    }
  }, [pointsEnabled, setValue]);

  useEffect(() => {
    const fetchFabricOptions = async () => {
      try {
        const response = await axios.get("/api/fabric-options");
        if (response.status !== 200) {
          setErrorMessage("Failed to fetch fabric options. Please try again !!");
        }
        const fabricsFromAPI = response.data.map((fabric) => fabric.name);
        setFabricOptions(fabricsFromAPI);
      } catch (error) {
        setErrorMessage("Failed to fetch fabric options. Please try again !!");
      }
    };
    fetchFabricOptions();
  }, []);

  // ── Enhanced AI analysis using new pipeline ──
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
          const response = await axios.post("/api/ai/analyze-product", {
            imageUrls: imagesFiltered.map((img) => img.url),
            storeId: user.id,
          });

          if (response.status === 200) {
            const data = response.data;

            // Store raw AI output for correction tracking
            setRawAiOutput(data._meta?.rawVisionOutput || data);
            setAiMeta(data._meta || null);
            setConfidenceScore(data.confidence_score || 0);

            // Populate form fields
            setValue("title", data.title || "");
            setValue("brand", data.brand || "");
            setValue("description", data.description || "");
            setValue("subcategory", data.subcategory || "");
            setValue("size", data.size || "");
            setValue("category", data.category || "");
            setValue("condition_grade", data.condition_grade || "");
            setValue("condition_notes", data.condition_notes || "");

            // Handle color — normalize returns { name, hex }
            if (data.color?.name) {
              setValue("color.name", data.color.name);
              setValue("color.hex", data.color.hex || "");
              setColorHex(data.color.hex || "");
            }

            // Handle fabric — new format is array, form expects single string
            if (Array.isArray(data.fabric) && data.fabric.length > 0) {
              setValue("fabric", data.fabric[0] || "");
            }

            // Tags (sent to Shopify only — not stored on Product)
            if (Array.isArray(data.shopify_tags)) {
              setValue("tags", data.shopify_tags);
            }
          }
        } catch (error) {
          console.error("Enhanced AI analysis failed, falling back:", error);
          // Fallback to old endpoint
          try {
            const fallback = await axios.post("/api/google-vision", {
              imageUrl: imagesFiltered[0]?.url ?? "",
            });
            if (fallback.status === 200) {
              const {
                title = "", brand = "", description = "",
                color = {}, subcategory = "", size = "",
                fabric = "", tags = [],
              } = fallback.data;
              setValue("title", title);
              setValue("brand", brand);
              setValue("description", description || "");
              setValue("color.name", color?.name || "");
              setValue("color.hex", color?.hex || "");
              setValue("subcategory", subcategory || "");
              setValue("size", size || "");
              setValue("fabric", fabric || "");
              setValue("tags", tags || []);
              setColorHex(color?.hex);
            }
          } catch (fbErr) {
            console.error("Fallback vision also failed:", fbErr);
          }
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
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
    try {
      if (pointsEnabled) {
        const Productpoint = await predictProductPoints(data);
        const updatedData = { ...data, pointsValue: Productpoint };
        setFormData(updatedData);
        return;
      } else {
        const collectResponse = await activateCollectSubscription(brandValue);
        if (collectResponse.status === 200 && collectResponse.data !== null) {
          const updatedData = { ...data, brandPrice: collectResponse.data };
          setFormData(updatedData);
          setIsCollectOpen(true);
          return;
        }
      }
      await handleFinalProductCreation(data);
    } catch (error) {
      console.error("Error checking collect subscription:", error);
      await handleFinalProductCreation(data);
    }
  };

  const handleFinalProductCreation = async (data) => {
    if (!data) return;
    try {
      const productPayload = {
        ...data,
        ...consignorData,
        collect: collectSelection ?? false,
        condition_grade: data.condition_grade || null,
        condition_notes: data.condition_notes || "",
        needsReview: confidenceScore !== null && confidenceScore < 0.6,
        aiConfidenceScore: confidenceScore,
      };

      const response = await createProduct(productPayload);

      if (response.status != 400 && response.data?.error) {
        toast.error(response.data.error);
        return;
      }
      if (response.status === 200) {
        const createdProduct = JSON.parse(response.data.product);
        setProductDetails(createdProduct);

        // ── Save as gold example for future retrieval ──
        try {
          const imagesFiltered = Object.values(reduxImages)
            .filter((image) => image !== null)
            .map((image) => ({ url: image.url, publicId: image.publicId }));

          const approvedOutput = {
            title: data.title,
            brand: data.brand,
            size: data.size,
            category: data.category || "Uncategorized",
            subcategory: data.subcategory,
            color: data.color?.name ? [data.color.name] : [],
            fabric: data.fabric ? [data.fabric] : [],
            description: data.description,
            condition_grade: data.condition_grade || null,
            condition_notes: data.condition_notes || "",
            shopify_tags: data.shopify_tags || data.tags || [],
            value_score: data.pointsValue || 0,
          };

          await axios.post("/api/ai/approve-product", {
            productId: createdProduct._id,
            storeId: user.id,
            imageUrl: imagesFiltered[0]?.url || "",
            rawAiOutput: rawAiOutput || {},
            approvedOutput,
          });
        } catch (approveErr) {
          // Non-blocking — don't fail product creation
          console.error("Failed to save approved product:", approveErr);
        }

        // Link product to add-on purchase if applicable
        if (addonPurchase?.id && createdProduct?._id) {
          try {
            await fetch("/api/stripe/addon-purchase", {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                purchaseId: addonPurchase.id,
                productId: createdProduct._id,
              }),
            });
          } catch (err) {
            console.error("Failed to link add-on purchase:", err);
          }
        }

        setShowConfirmation(true);
        dispatch(clearProductState());
        setFormData(null);
        setCollectSelection(null);
      } else {
        toast.error(response.error || "Failed to create product. Please try again.");
      }
    } catch (e) {
      console.log("Error in product creation:", e);
      toast.error("Failed to create product. Please try again.");
    }
  };

  const handleGoToDashboard = () => {
    setShowConfirmation(false);
    dispatch(clearConsignors());
    dispatch(setCurrentStep(1));
    if (collectSelection) {
      router.push("/dashboard/ree-collect");
      return;
    }
    router.push("/dashboard/store");
  };

  const [pointsSubmitting, setPointsSubmitting] = useState(false);

  const handlePointsConfirm = async (confirmedPoints) => {
    const updatedData = { ...formData, pointsValue: confirmedPoints };
    setPointsSubmitting(true);
    await handleFinalProductCreation(updatedData);
    setPointsSubmitting(false);
    setIsPointsModalOpen(false);
  };

  return (
    <>
      {loading ? (
        <div className="flex flex-col justify-center items-center h-screen">
          <Spinner size="lg" color="success" label="AI is analyzing your product..." />
          <p className="text-[12px] text-gray-500 mt-3">
            Extracting details, searching similar products, and normalizing...
          </p>
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

                {/* AI Confidence Indicator */}
                {confidenceScore !== null && (
                  <div className="flex items-center justify-center gap-2 mt-2">
                    <div
                      className={`h-2 w-24 rounded-full overflow-hidden ${
                        confidenceScore >= 0.7
                          ? "bg-green-100"
                          : confidenceScore >= 0.4
                          ? "bg-yellow-100"
                          : "bg-red-100"
                      }`}
                    >
                      <div
                        className={`h-full rounded-full transition-all ${
                          confidenceScore >= 0.7
                            ? "bg-green-500"
                            : confidenceScore >= 0.4
                            ? "bg-yellow-500"
                            : "bg-red-500"
                        }`}
                        style={{ width: `${confidenceScore * 100}%` }}
                      />
                    </div>
                    <span className="text-[12px] text-gray-500">
                      AI Confidence: {(confidenceScore * 100).toFixed(0)}%
                    </span>
                    {aiMeta?.imagesAnalyzed > 1 && (
                      <span className="text-xs text-purple-500">
                        {aiMeta.imagesAnalyzed} images analyzed
                      </span>
                    )}
                    {aiMeta?.similarExamplesUsed > 0 && (
                      <span className="text-xs text-blue-500">
                        ({aiMeta.similarExamplesUsed} similar examples used)
                      </span>
                    )}
                  </div>
                )}

                {confidenceScore !== null && confidenceScore < 0.6 && (
                  <p className="text-xs text-orange-600 text-center mt-1 bg-orange-50 rounded px-2 py-1">
                    Low confidence — please review all fields carefully
                  </p>
                )}
              </div>

              <CardBody className="gap-[15px]">
                {errorMessage && (
                  <span className="text-red-500 font-bold text-[12px]">
                    {errorMessage}
                  </span>
                )}
                <ProductFormFields
                  register={register}
                  errors={errors}
                  watch={watch}
                  fabricOptions={fabricOptions}
                  colorHex={colorHex}
                  showPriceField={!session.data?.user?.points_mode}
                  showConditionFields
                  showCategoryField
                />
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
        <GenerateBarcode
          barcode={productDetails.barcode}
          price={
            productDetails.price > 1
              ? productDetails.price
              : productDetails.brandPrice
          }
          points={
            productDetails.pointsValue ? productDetails.pointsValue : null
          }
          size={productDetails.size}
          currency="DKK"
          autoOpen={true}
          onClose={handleGoToDashboard}
        />
      )}

      {/* modal for Ree Collect */}
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

      {/* modal for Points Preview */}
      <PointsModal
        isOpen={isPointsModalOpen}
        onClose={() => setIsPointsModalOpen(false)}
        pointsPreview={pointsPreview}
        pointsLoading={pointsLoading}
        availableRules={availableRules}
        onConfirm={handlePointsConfirm}
        isSubmitting={pointsSubmitting}
      />
    </>
  );
};

export default SecondStep;
