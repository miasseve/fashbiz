"use client";
import React, { useState, useEffect } from "react";
import { Spinner } from "@heroui/react";
import axios from "axios";
import { Card, CardBody, CardFooter, Button } from "@heroui/react";
import { yupResolver } from "@hookform/resolvers/yup";
import { productSchema } from "@/actions/validations";
import { useForm } from "react-hook-form";
import { clearProductState } from "@/features/productSlice";
import { useDispatch, useSelector } from "react-redux";
import { createGuestProduct } from "@/actions/productActions";
import { toast } from "react-toastify";
import Link from "next/link";
import GenerateBarcode from "../../dashboard/product/[productId]/GenerateBarcode";

// Get or create a guest session ID stored in a cookie
function getGuestSessionId() {
  const cookieName = "ree_guest_session";
  const existing = document.cookie
    .split("; ")
    .find((row) => row.startsWith(cookieName + "="));
  if (existing) return existing.split("=")[1];

  const id = crypto.randomUUID();
  // Set cookie for 30 days
  document.cookie = `${cookieName}=${id}; path=/; max-age=${30 * 24 * 60 * 60}; SameSite=Lax`;
  return id;
}

const TrySecondStep = ({ handleBackStep, handleAddMoreProducts }) => {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [productDetails, setProductDetails] = useState(null);
  const [productLink, setProductLink] = useState("");
  const [shopifyProductUrl, setShopifyProductUrl] = useState("");
  const [linkCopied, setLinkCopied] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [fabricOptions, setFabricOptions] = useState([]);
  const [colorHex, setColorHex] = useState("");

  const reduxImages = useSelector((state) => state.product.uploadedImages);
  const currentYear = new Date().getFullYear().toString().slice(-2);
  const [uniqueId] = useState(() => Date.now().toString().slice(-4));

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    mode: "onTouched",
    resolver: yupResolver(productSchema),
    defaultValues: {
      sku: `TRY${currentYear}${uniqueId}`,
      images: Object.values(reduxImages)
        .filter((image) => image !== null)
        .map((image) => ({
          url: image.url,
          publicId: image.publicId,
        })),
    },
  });

  // Fetch fabric options
  useEffect(() => {
    const fetchFabricOptions = async () => {
      try {
        const response = await axios.get("/api/fabric-options");
        if (response.status === 200) {
          const fabricsFromAPI = response.data.map((fabric) => fabric.name);
          setFabricOptions(fabricsFromAPI);
        }
      } catch (error) {
        console.error("Failed to fetch fabric options");
      }
    };
    fetchFabricOptions();
  }, []);

  // AI auto-fill from product image
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
              size = "",
              fabric = "",
              tags = [],
            } = response.data;
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
        } catch (error) {
          console.error("Error fetching product details:", error);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };
    fetchProductDetails();
  }, []);

  // Update SKU when brand changes
  const brandValue = watch("brand");
  useEffect(() => {
    if (brandValue) {
      const formattedBrand = brandValue
        .replace(/\s+/g, "")
        .toUpperCase()
        .slice(0, 2);
      setValue("sku", `TRY${currentYear}${formattedBrand}${uniqueId}`);
    }
  }, [brandValue, setValue, currentYear, uniqueId]);

  const onSubmit = async (data) => {
    setErrorMessage("");
    try {
      const guestSessionId = getGuestSessionId();
      const productPayload = {
        ...data,
        firstName: "",
        lastName: "",
        email: "",
        accountId: "",
        collect: false,
        guestSessionId,
      };

      const response = await createGuestProduct(productPayload);

      if (response.status === 200) {
        setProductDetails(JSON.parse(response.data.product));
        setProductLink(response.data.link);
        setShopifyProductUrl(response.data.shopifyProductUrl || "");
        setShowConfirmation(true);
        dispatch(clearProductState());
      } else {
        toast.error(
          response.error || "Failed to create product. Please try again.",
        );
      }
    } catch (e) {
      console.error("Error in product creation:", e);
      toast.error("Failed to create product. Please try again.");
    }
  };

  const handleAddMore = () => {
    setShowConfirmation(false);
    setProductDetails(null);
    setProductLink("");
    setShopifyProductUrl("");
    setLinkCopied(false);
    handleAddMoreProducts();
  };

  const handleCopyLink = async () => {
    if (!shopifyProductUrl) return;
    try {
      await navigator.clipboard.writeText(shopifyProductUrl);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 3000);
    } catch {
      toast.error("Failed to copy link");
    }
  };

  if (showConfirmation) {
    return (
      <div className="flex justify-center py-12">
        <Card className="lg:w-[50%] md:w-[60%] w-[90%] text-center p-8">
          <div className="text-5xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold mb-2">Product Uploaded!</h2>
          <p className="text-gray-600 mb-6">
            Your product is now live on the webshop. View it or add more
            products.
          </p>

          {/* Barcode Section */}
          {productDetails?.barcode && (
            <div className="mb-6 flex justify-center">
              <GenerateBarcode
                barcode={productDetails.barcode}
                price={productDetails.price}
                size={productDetails.size}
                currency="DKK"
                autoOpen={true}
                onClose={() => {}}
              />
            </div>
          )}

          {/* Shopify Product Link - Copy Box */}
          {shopifyProductUrl && (
            <div className="mb-6 mx-auto max-w-md px-4">
              <p className="text-[12px] text-gray-600 mb-3 text-center">
                Copy and paste the link to Instagram or view your product in the
                browser
              </p>
              <div className="flex border border-gray-300 rounded-lg overflow-hidden shadow-sm">
                <input
                  type="text"
                  readOnly
                  value={shopifyProductUrl}
                  className="flex-1 px-4 py-2 text-md text-gray-700 bg-gray-50 outline-none truncate"
                  aria-label="Shopify product URL"
                  style={{ minHeight: "38px" }}
                />
                <button
                  onClick={handleCopyLink}
                  className={`px-5 py-2 text-md font-semibold text-white transition-colors ${
                    linkCopied ? "bg-green-600" : "bg-red-600 hover:bg-red-700"
                  }`}
                  aria-pressed={linkCopied}
                  aria-live="polite"
                  style={{ minHeight: "38px" }}
                >
                  {linkCopied ? "Copied!" : "Copy Link"}
                </button>
              </div>
              <a
                href={shopifyProductUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex items-center justify-center gap-1 text-[12px] text-blue-600 hover:underline"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                  focusable="false"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  />
                </svg>
                View Product on Shopify
              </a>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 justify-center mt-4">
            <Button
              onPress={handleAddMore}
              className="h-11 text-[14px] inline-flex items-center justify-center gap-2
               bg-green-500 text-white px-6
               rounded-lg font-semibold
               hover:bg-green-600 transition-all"
            >
              Add Another Product
            </Button>

            <Link
              href="/register"
              className="h-11 text-[14px] inline-flex items-center justify-center gap-2
               bg-green-500 text-white px-6
               rounded-lg font-semibold
               hover:bg-red-600 transition-all"
            >
              Sign Up
            </Link>
          </div>
          <p className="text-[12px] text-gray-400 mt-6">
            Ready to sell? Sign up, connect Stripe, and start accepting real
            payments.
          </p>
        </Card>
      </div>
    );
  }

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
                  <label className="text-sm font-medium">
                    Size:
                    <span className="text-s font-normal">
                      <em>
                        {" "}
                        (Enter sizes separated by commas, e.g. S,M or 38,40)
                      </em>
                    </span>
                  </label>
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
                    />
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
                    placeholder="Price in DKK"
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
                  Submit Product
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>
      )}
    </>
  );
};

export default TrySecondStep;
