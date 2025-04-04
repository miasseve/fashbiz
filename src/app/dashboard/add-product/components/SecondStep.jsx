"use client";
import React, { useState, useEffect } from "react";
import { IoArrowBack } from "react-icons/io5";
import { Spinner } from "@heroui/react";
import axios from "axios";
import {
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Input,
  Textarea,
  Button,
  Select,
  SelectItem,
} from "@heroui/react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  useDraggable,
} from "@heroui/react";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { clearProductState, clearConsignors } from "@/features/productSlice";
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
  //   const [imgColors, setImgColors] = useState("");
  const targetRef = React.useRef(null);

  const [collections, setCollections] = useState([]);

  const reduxImages = useSelector((state) => state.product.uploadedImages);
  const currentYear = new Date().getFullYear();

  console.log(reduxImages, "reduxImages");


  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isValid, isSubmitting },
  } = useForm({
    mode: "onTouched",
    defaultValues: {
      sku: user.storename + currentYear + (parseInt(productCount) + 1),
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

      if(imagesFiltered.length > 0){
      try {
        const response = await axios.post("/api/google-vision", {
          imageUrl: imagesFiltered[0]?.url ?? "",
        });

        if (response.status === 200) {
          const color = response.data?.colors[0];

          //   if (color) {
          //     const { red, green, blue } = color;
          //     const rgbColor = `rgb(${red}, ${green}, ${blue})`;
          //     setImgColors(rgbColor);
          //   }

          const description = response.data?.texts
            ?.map((text) => text.description)
            .join(" , ");
          const garments = response.data?.garmentLabels
            ?.map((label) => label.description)
            .join(" , ");

          setValue("title", garments || "");
          setValue(
            "brand",
            response.data?.logos[0]?.description || garments || ""
          );
          setValue("description", description || "");
        }
      } catch (error) {
        toast.error("Failed to load product data");
      } finally {
        setLoading(false);
      }
    }
    };

    fetchProductDetails();
  }, []);
  const onSubmit = async (data) => {
    setErrorMessage("");
    const response = await createProduct({ ...data, ...consignorData });
    if (response.status == 200) {
      // const parsedData = JSON.parse(response.data);
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
        <Card className="lg:w-[38%] w-full m-auto mt-[50px]">
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="p-3 sm:p-[11px] md:p-[12px] lg:p-[14px] xl:p-[12px]"
          >
            <CardHeader>
              <Button onPress={handleBackStep}>
                <IoArrowBack />
              </Button>
              <h2 className="lg:ml-[10%] ml-[1%]">Enter Product Info</h2>
            </CardHeader>
            <CardBody className="gap-[15px]">
              {errorMessage && (
                <span style={{ color: "red", fontSize: "12px" }}>
                  {errorMessage}
                </span>
              )}

              <div>
                <label className="text-sm font-medium">Category</label>
                <Select
                  size="lg"
                  {...register("collectionId", {
                    required: "Category is required",
                  })}
                  placeholder="Select Category"
                  fullWidth
                >
                  {collections.map((collection) => (
                    <SelectItem key={collection.id} value={collection.id}>
                      {collection.name}
                    </SelectItem>
                  ))}
                </Select>
                {errors.collectionId && (
                  <span style={{ color: "red", fontSize: "12px" }}>
                    {errors.collectionId.message}
                  </span>
                )}
              </div>
              <div className="h-full">
                <Input
                  label="SKU"
                  size="lg"
                  {...register("sku", {
                    required: "SKU is required",
                  })}
                  fullWidth
                />
                {errors.sku && (
                  <span style={{ color: "red", fontSize: "12px" }}>
                    {errors.sku.message}
                  </span>
                )}
              </div>
              <div>
                <Input
                  label="Title"
                  size="lg"
                  {...register("title", {
                    required: "Title is required",
                  })}
                  fullWidth
                />
                {errors.title && (
                  <span style={{ color: "red", fontSize: "12px" }}>
                    {errors.title.message}
                  </span>
                )}
              </div>
              <div>
                <Input
                  size="lg"
                  label="Brand"
                  {...register("brand", {
                    required: "Brand is required",
                  })}
                  fullWidth
                />
                {errors.brand && (
                  <span style={{ color: "red", fontSize: "12px" }}>
                    {errors.brand.message}
                  </span>
                )}
              </div>
              <div>
                <Input
                  label="Price"
                  size="lg"
                  startContent={
                    <div className="pointer-events-none flex items-center">
                      <span className="text-default-400 text-small">€</span>
                    </div>
                  }
                  {...register("price", {
                    required: "Price is required",
                  })}
                  type="number"
                />
                {errors.price && (
                  <span style={{ color: "red", fontSize: "12px" }}>
                    {errors.price.message}
                  </span>
                )}
              </div>
              {/* <div>
                <label className="text-sm font-medium">Color</label>
                <Select
                  size="lg"
                  {...register("color", { required: "Color is required" })}
                  fullWidth
                >
                  <SelectItem key="red" value="red">
                      Red
                    </SelectItem>
                    <SelectItem key="blue" value="blue">
                      Blue
                    </SelectItem>
                    <SelectItem key="green" value="green">
                      Green
                    </SelectItem>
                    <SelectItem key="black" value="black">
                      Black
                    </SelectItem>
                </Select>
                {errors.color && (
                  <span style={{ color: "red", fontSize: "12px" }}>
                    {errors.color.message}
                  </span>
                )}
              </div> */}
              {/* <div>
                <label className="text-sm font-medium">Color</label>
                <Input
                  type="text"
                  size="lg"
                  fullWidth
                  {...register("color", { required: "Color is required" })}
                  value={imgColors} 
                  readOnly
                  style={{ backgroundColor: imgColors, color: "#fff" }} 
                />
                {errors.color && (
                  <span style={{ color: "red", fontSize: "12px" }}>
                    {errors.color.message}
                  </span>
                )}
              </div> */}
              <div>
                <Textarea
                  size="lg"
                  label="Description"
                  {...register("description", {
                    required: "Description is required",
                  })}
                  fullWidth
                  rows={4}
                />
                {errors.description && (
                  <span style={{ color: "red", fontSize: "12px" }}>
                    {errors.description.message}
                  </span>
                )}
              </div>
              {/* <div>
              <h6>Color</h6>
              <div
                style={{
                  display: "flex",
                  gap: "10px",
                  flexWrap: "nowrap",
                  alignItems: "center", // Align items vertically centered if the height differs
                }}
              >
                <div
                    style={{
                      backgroundColor: imgColors,
                      color: "#fff",
                      width: "20px", // Set the width of each circle
                      height: "20px", // Set the height to match the width for a perfect circle
                      borderRadius: "50%", // Make it round
                      textAlign: "center",
                      display: "flex",
                      justifyContent: "center", // Center text horizontally
                      alignItems: "center", // Center text vertically
                    }}
                  ></div>
              </div>
            </div> */}
            </CardBody>
            <CardFooter>
              <Button
                type="submit"
                isLoading={isSubmitting}
                className="text-[1.2rem] px-6 py-6 text-white rounded-lg flex m-auto"
                color="success"
              >
                Submit Product Info
              </Button>
            </CardFooter>
          </form>
        </Card>
      )}

      {showConfirmation && (
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
                    <Input
                      type="text"
                      value={generatedLink}
                      readOnly
                      className="w-full p-2 mt-2 border rounded"
                    />
                    <Button
                      onPress={handleCopyLink}
                      className="mt-2 px-6 py-6 rounded"
                    >
                      Copy Link
                    </Button>
                  </ModalHeader>
                  <ModalBody className="text-center">
                    <p>Do you want to add more products?</p>
                  </ModalBody>
                  <ModalFooter className="flex justify-center">
                    <Button
                      color="secondary"
                      onPress={handleAddMoreProducts}
                      className="rounded-lg"
                    >
                      Yes
                    </Button>
                    <Button
                      color="danger"
                      onPress={handleGoToDashboard}
                      className="rounded-lg"
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
    </>
  );
};

export default SecondStep;
