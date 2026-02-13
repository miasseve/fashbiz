"use client";
import React, { useEffect, useState } from "react";
import { Button, Spinner } from "@heroui/react";
import axios from "axios";
import { useForm, Controller } from "react-hook-form";
import { removeProfile, updateUser } from "@/actions/authActions";
import { toggleSoldNotifications } from "@/actions/notificationActions";
// import { updateBranding } from "@/actions/brandingActions";
// import { applyBrandingToTheme } from "@/actions/shopifyThemeActions";
// import { registerShopifyWebhooks } from "@/actions/shopifyWebhookActions";
import { toast } from "react-toastify";
import { FaCamera, FaUserEdit } from "react-icons/fa";
import { RiDeleteBinFill } from "react-icons/ri";
import { motion } from "framer-motion";
import { countries } from "countries-list";
import { useSession } from "next-auth/react";
import { yupResolver } from "@hookform/resolvers/yup";
import { State } from "country-state-city";
import * as Yup from "yup";
import { useRouter } from "next/navigation";
import { isValidPhoneNumber } from "react-phone-number-input";
import "react-phone-number-input/style.css";
import PhoneInput from "react-phone-number-input";

const Profile = ({ user, stripeResponse }) => {
  let sOptions = [];
  const router = useRouter();
  if (user?.country) {
    sOptions = State.getStatesOfCountry(user.country).map((state) => ({
      value: state.isoCode,
      label: state.name,
    }));
  } else {
    sOptions = State.getStatesOfCountry("DK").map((state) => ({
      value: state.isoCode,
      label: state.name,
    }));
  }

  const [stateOptions, setStateOptions] = useState(sOptions || []);

  const profileSchema = Yup.object({
    firstname: Yup.string().trim().required("First name is required"),
    lastname: Yup.string().trim().required("Last name is required"),
    storename: Yup.string().when("role", {
      is: "store",
      then: () => Yup.string().trim().required("Store name is required"),
      otherwise: () => Yup.string(),
    }),
    email: Yup.string()
      .email("Invalid email format")
      .required("Email is required"),
    phone: Yup.string()
      .required("Phone number is required")
      .test("is-valid-phone", "Phone number is not valid", (value) => {
        if (!value) return false;
        return isValidPhoneNumber(value);
      }),
    contactTitle: Yup.string().when("role", {
      is: "brand",
      then: () =>
        Yup.string()
          .trim()
          .required("Contact Person Title is required")
          .max(50, "Title cannot exceed 50 characters"),
      otherwise: () => Yup.string().nullable(),
    }),
    brandname: Yup.string().when("role", {
      is: "brand",
      then: () => Yup.string().trim().required("Brand Name is required"),
      otherwise: () => Yup.string(),
    }),
    legalCompanyName: Yup.string().when("role", {
      is: "brand",
      then: () =>
        Yup.string().trim().required("Legal Company Name is required"),
      otherwise: () => Yup.string(),
    }),
    companyWebsite: Yup.string().when("role", {
      is: "brand",
      then: () =>
        Yup.string()
          .trim()
          .url("Must be a valid URL")
          .required("Company Website is required"),
      otherwise: () => Yup.string(),
    }),
    companyNumber: Yup.string().when("role", {
      is: "brand",
      then: () =>
        Yup.string()
          .trim()
          .matches(
            /^[A-Za-z0-9\s\-\/]+$/,
            "Enter a valid company registration number"
          )
          .required("Company Registration Number is required"),
      otherwise: () => Yup.string(),
    }),
    businessNumber: Yup.string().when("role", {
      is: "store",
      then: () =>
        Yup.string()
          .trim()
          .matches(
            /^\d+$/,
            "Please enter a valid company VAT/CVR number (numbers only, without country code like FR or DK)"
          )
          .required("Business Registration Number is required"),
      otherwise: () => Yup.string().nullable(),
    }),
    address: Yup.string().trim().required("Address is required"),
    city: Yup.string().trim().required("City is required"),
    zipcode: Yup.string().when("country", {
      is: "DK",
      then: () =>
        Yup.string()
          .matches(/^\d{4}$/, "Zipcode must be 4 digits")
          .required("Zipcode is required"),
      otherwise: () =>
        Yup.string()
          .matches(/^[a-zA-Z0-9\s\-]{3,10}$/, "Enter a valid postal/zip code")
          .required("Zipcode is required"),
    }),
    state: Yup.string().trim().required("State is required"),
    country: Yup.string().trim().required("Country is required"),
  });

  const {
    register,
    control,
    handleSubmit,
    setValue,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm({
    mode: "onTouched",
    resolver: yupResolver(profileSchema),
    defaultValues: {
      profileImage: user?.profileImage || {},
      firstname: user?.firstname || "",
      lastname: user?.lastname || "",
      email: user?.email || "",
      storename: user?.storename || "",
      businessNumber: user?.businessNumber || "",
      contactTitle: user?.contactTitle || "",
      legalCompanyName: user?.legalCompanyName || "",
      companyWebsite: user?.companyWebsite || "",
      companyNumber: user?.companyNumber || "",
      brandname: user?.brandname || "",
      phone: user?.phone || "",
      address: user?.address || "",
      city: user?.city || "",
      zipcode: user?.zipcode || "",
      state: user?.state || "",
      country: user?.country || "DK",
      role: user?.role || "",
    },
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(user?.profileImage?.url || "");
  const [notificationsEnabled, setNotificationsEnabled] = useState(
    user?.soldNotifications !== false,
  );

  // const [activeTab, setActiveTab] = useState("profile");

  // // Branding state
  // const [logoUrl, setLogoUrl] = useState(user?.branding?.logoUrl || "");
  // const [logoPublicId, setLogoPublicId] = useState(user?.branding?.logoPublicId || "");
  // const [primaryColor, setPrimaryColor] = useState(user?.branding?.primaryColor || "#000000");
  // const [secondaryColor, setSecondaryColor] = useState(user?.branding?.secondaryColor || "#ffffff");
  // const [accentColor, setAccentColor] = useState(user?.branding?.accentColor || "#ff6b6b");
  // const [storeDescription, setStoreDescription] = useState(user?.branding?.storeDescription || "");
  // const [instagram, setInstagram] = useState(user?.branding?.socialLinks?.instagram || "");
  // const [facebook, setFacebook] = useState(user?.branding?.socialLinks?.facebook || "");
  // const [brandWebsite, setBrandWebsite] = useState(user?.branding?.socialLinks?.website || "");
  // const [savingBranding, setSavingBranding] = useState(false);
  // const [applyingBranding, setApplyingBranding] = useState(false);
  // const [uploadingLogo, setUploadingLogo] = useState(false);

  const [imageInputRef, setImageInputRef] = useState(null);
  const { data: session } = useSession();

  const countryOptions = Object.keys(countries).map((countryCode) => ({
    value: countryCode,
    label: countries[countryCode].name,
  }));

  useEffect(() => {
    if (user?.state) {
      setValue("state", user?.state);
    }
  }, []);

  const handleCountryChange = (e) => {
    const options = State.getStatesOfCountry(e.target.value).map((state) => ({
      value: state.isoCode,
      label: state.name,
    }));
    // stateOptions=options;
    setStateOptions(options);
    setValue("state", "");
    setValue("country", e.target.value);
    clearErrors("country");
  };
  const handleStateChange = (e) => {
    clearErrors("state");
    setValue("state", e.target.value);
  };
  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    setLoading(true);
    if (file) {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("userId", user._id);
      formData.append("isProfileImage", true);

      const response = await axios.post("/api/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (response.status == 200) {
        const { publicId, url } = response.data;
        setValue("profileImage", { publicId, url });
        setPreviewUrl(url);
        setLoading(false);
      } else {
        toast.error("Failed to upload image", {
          position: "top-right",
          autoClose: 2000,
        });
      }
    }
  };

  const onSubmit = async (data) => {
    try {
      setError("");
      await profileSchema.validate(data, { abortEarly: false });

      if (!isValidPhoneNumber(data.phone)) {
        setError("Invalid phone number");
        toast.error("Invalid phone number!", {
          position: "top-right",
          autoClose: 2000,
        });
        return;
      }
      if (session?.user?.role === "brand") {
        user.contactTitle = data.contactTitle;
        user.brandname = data.brandname;
        user.legalCompanyName = data.legalCompanyName;
        user.companyWebsite = data.companyWebsite;
        user.companyNumber = data.companyNumber;
        user.role = "brand";
      }
      const response = await updateUser(data);
      if (response.status === 200) {
        toast.success("Profile updated successfully!", {
          position: "top-right",
          autoClose: 2000,
        });
        if (stripeResponse.status != 200) {
          router.push("/dashboard/stripe-connect");
        }
      } else {
        setError(response.error);
      }
    } catch (error) {
      console.log(error.message, "erroror");
      toast.error("Something went wrong!", {
        position: "top-right",
        autoClose: 2000,
      });
    }
  };

  const handleRemoveImage = async () => {
    setLoading(true);
    const response = await removeProfile();
    setLoading(false);
    if (response.status === 200) {
      setValue("profileImage", {});
      setPreviewUrl("");
      toast.success("Image deleted successfully!", {
        position: "top-right",
        autoClose: 2000,
      });
    } else {
      setValue("profileImage", {});
      toast.error("Something went wrong!", {
        position: "top-right",
        autoClose: 2000,
      });
    }
  };

  const handleImageClick = () => {
    if (imageInputRef) {
      imageInputRef.click();
    }
  };

  // const handleLogoUpload = async (e) => {
  //   const file = e.target.files[0];
  //   if (!file) return;
  //   setUploadingLogo(true);
  //   try {
  //     const formData = new FormData();
  //     formData.append("file", file);
  //     formData.append("isProfileImage", false);
  //     const response = await axios.post("/api/upload", formData, {
  //       headers: { "Content-Type": "multipart/form-data" },
  //     });
  //     if (response.status === 200) {
  //       setLogoUrl(response.data.url);
  //       setLogoPublicId(response.data.publicId);
  //       toast.success("Logo uploaded!");
  //     }
  //   } catch {
  //     toast.error("Failed to upload logo");
  //   } finally {
  //     setUploadingLogo(false);
  //   }
  // };

  // const handleSaveBranding = async () => {
  //   setSavingBranding(true);
  //   try {
  //     const res = await updateBranding({
  //       logoUrl,
  //       logoPublicId,
  //       primaryColor,
  //       secondaryColor,
  //       accentColor,
  //       storeDescription,
  //       socialLinks: { instagram, facebook, website: brandWebsite },
  //     });
  //     if (res.status === 200) {
  //       toast.success("Branding saved successfully!");
  //     } else {
  //       toast.error(res.error || "Failed to save branding");
  //     }
  //   } catch {
  //     toast.error("Something went wrong");
  //   } finally {
  //     setSavingBranding(false);
  //   }
  // };

  // const handleApplyToStore = async () => {
  //   setApplyingBranding(true);
  //   try {
  //     const res = await applyBrandingToTheme();
  //     if (res.status === 200) {
  //       toast.success("Branding applied to Le Store theme!");
  //     } else {
  //       toast.error(res.error || "Failed to apply branding");
  //     }
  //     // Register Shopify order webhook (idempotent - safe to call multiple times)
  //     await registerShopifyWebhooks();
  //   } catch {
  //     toast.error("Something went wrong");
  //   } finally {
  //     setApplyingBranding(false);
  //   }
  // };

  const isStore = session?.user?.role === "store";

  return (
    <motion.div
      className="mx-auto lg:my-[10px] bg-white rounded-xl shadow-sm dark:bg-gray-900 transition-all"
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* Tabs */}
      {/* {isStore && (
        <div className="flex border-b border-gray-200">
          <button
            type="button"
            onClick={() => setActiveTab("profile")}
            className={`px-6 py-3 text-[13px] font-semibold transition-colors ${
              activeTab === "profile"
                ? "border-b-2 border-black text-black"
                : "text-gray-400 hover:text-gray-600"
            }`}
          >
            Profile
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("branding")}
            className={`px-6 py-3 text-[13px] font-semibold transition-colors ${
              activeTab === "branding"
                ? "border-b-2 border-black text-black"
                : "text-gray-400 hover:text-gray-600"
            }`}
          >
            Store Branding
          </button>
        </div>
      )} */}

      {/* Profile Tab */}
      {(
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 p-[30px]">
          <div className="flex flex-col items-center text-center">
            <div className="relative w-[100%] flex justify-between p-0 ">
              <motion.div
                whileHover={{ scale: 1.1 }}
                className="cursor-pointer border transform-none w-[100px] h-[100px] flex items-center justify-center rounded-full overflow-hidden  bg-gray-200 dark:bg-gray-700"
                onClick={handleImageClick}
              >
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <FaCamera
                    size={40}
                    className="text-gray-500 dark:text-gray-300"
                  />
                )}
              </motion.div>
              {loading && (
                <div className="mt-4">
                  <Spinner size="md" color="success" />
                </div>
              )}
              {previewUrl && (
                <div className="flex gap-4">
                  <Button
                    className="success-btn"
                    onPress={handleImageClick}
                    color="success"
                  >
                    <FaUserEdit />
                  </Button>
                  <Button className="danger-btn" onPress={handleRemoveImage}>
                    <RiDeleteBinFill />
                  </Button>
                </div>
              )}
            </div>
          </div>

          <input
            ref={(ref) => setImageInputRef(ref)}
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="hidden"
          />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                First Name
              </label>
              <input {...register("firstname")} className="mt-2 w-full" />
              {errors.firstname && (
                <span className="text-red-500 font-bold text-[12px]">
                  {errors.firstname.message}
                </span>
              )}
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Last Name
              </label>
              <input {...register("lastname")} className="mt-2 w-full" />
              {errors.lastname && (
                <span className="text-red-500 font-bold text-[12px]">
                  {errors.lastname.message}
                </span>
              )}
            </div>
          </div>

          {isStore && (
            <div>
              <label className="text-sm font-semibold text-gray-700">
                Store Name
              </label>
              <input
                disabled
                {...register("storename")}
                className="mt-2 w-full"
              />
            </div>
          )}
          {isStore && (
            <>
              <div>
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Business Registration Number (VAT/CVR)
                </label>
                <input
                  type="text"
                  {...register("businessNumber")}
                  placeholder="e.g., 12345678 (numbers only)"
                  className="mt-2 w-full border border-gray-300 rounded px-3 py-2"
                />
                {errors.businessNumber && (
                  <span className="text-red-500 font-bold text-[12px]">
                    {errors.businessNumber.message}
                  </span>
                )}
              </div>
            </>
          )}
          {session?.user?.role === "brand" && (
            <>
              <div>
                <label className="text-sm font-semibold text-gray-700">
                  Contact Person Title
                </label>
                <input {...register("contactTitle")} className="mt-2 w-full" />
                {errors.contactTitle && (
                  <span className="text-red-500 text-[12px]">
                    {errors.contactTitle.message}
                  </span>
                )}
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-700">
                  Brand Name
                </label>
                <input {...register("brandname")} className="mt-2 w-full" />
                {errors.brandname && (
                  <span className="text-red-500 text-[12px]">
                    {errors.brandname.message}
                  </span>
                )}
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-700">
                  Legal Company Name
                </label>
                <input
                  {...register("legalCompanyName")}
                  className="mt-2 w-full"
                />
                {errors.legalCompanyName && (
                  <span className="text-red-500 text-[12px]">
                    {errors.legalCompanyName.message}
                  </span>
                )}
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-700">
                  Company Website
                </label>
                <input {...register("companyWebsite")} className="mt-2 w-full" />
                {errors.companyWebsite && (
                  <span className="text-red-500 text-[12px]">
                    {errors.companyWebsite.message}
                  </span>
                )}
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-700">
                  Company Registration Number
                </label>
                <input {...register("companyNumber")} className="mt-2 w-full" />
                {errors.companyNumber && (
                  <span className="text-red-500 text-[12px]">
                    {errors.companyNumber.message}
                  </span>
                )}
              </div>
            </>
          )}
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Phone Number
              </label>
              <Controller
                name="phone"
                control={control}
                defaultValue={user?.phone || ""}
                render={({ field }) => (
                  <PhoneInput
                    {...field}
                    international
                    defaultCountry="DK"
                    className="mt-2 w-full"
                    placeholder="Enter phone number"
                  />
                )}
              />
              {errors.phone && (
                <span className="text-red-500 font-bold text-[12px]">
                  {errors.phone.message}
                </span>
              )}
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700">Email</label>
              <input
                type="email"
                disabled
                defaultValue={user?.email || "mailto:user@example.com"}
                className="mt-2 w-full"
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Address
            </label>
            <input type="text" {...register("address")} className="mt-2 w-full" />
            {errors.address && (
              <span className="text-red-500 font-bold text-[12px]">
                {errors.address.message}
              </span>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                City
              </label>
              <input type="text" {...register("city")} />
              {errors.city && (
                <span className="text-red-500 font-bold text-[12px]">
                  {errors.city.message}
                </span>
              )}
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Zipcode
              </label>
              <input type="text" {...register("zipcode")} />
              {errors.zipcode && (
                <span className="text-red-500 font-bold text-[12px]">
                  {errors.zipcode.message}
                </span>
              )}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                State
              </label>
              <select
                {...register("state")}
                className="max-w-xs border border-gray-300 rounded px-3 py-2"
                onChange={handleStateChange}
                defaultValue=""
              >
                <option value="" disabled>
                  Select state
                </option>
                {stateOptions.map((state) => (
                  <option key={state.value} value={state.value}>
                    {state.label}
                  </option>
                ))}
              </select>
              {errors.state && (
                <span className="text-red-500 font-bold text-[12px]">
                  {errors.state.message}
                </span>
              )}
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Country
              </label>
              <select
                {...register("country")}
                className="max-w-xs border border-gray-300 rounded px-3 py-2"
                onChange={handleCountryChange}
                defaultValue=""
              >
                <option value="" disabled>
                  Select country
                </option>
                {countryOptions.map((country) => (
                  <option key={country.value} value={country.value}>
                    {country.label}
                  </option>
                ))}
              </select>
              {errors.country && (
                <span className="text-red-500 font-bold text-[12px]">
                  {errors.country.message}
                </span>
              )}
            </div>
          </div>
          {/* Notification Preferences */}
          {isStore && (
            <div className="flex items-center justify-between border border-gray-200 rounded-lg p-4">
              <div>
                <p className="text-md font-semibold text-gray-700">
                  Sold Item Notifications
                </p>
                <p className="text-[12px] text-gray-600 mt-0.5">
                  Get notified when a product is sold on Shopify
                </p>
              </div>
              <button
                type="button"
                onClick={async () => {
                  const newValue = !notificationsEnabled;
                  setNotificationsEnabled(newValue);
                  const res = await toggleSoldNotifications(newValue);
                  if (res.status !== 200) {
                    setNotificationsEnabled(!newValue);
                    toast.error("Failed to update notification setting");
                  }
                }}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  notificationsEnabled ? "bg-green-500" : "bg-gray-300"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    notificationsEnabled ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          )}

          <div className="flex justify-center">
            <Button
              isLoading={isSubmitting}
              type="submit"
              color="success"
              className="success-btn"
            >
              Save
            </Button>
          </div>
          {error && (
            <span className="text-red-500 left-0 text-[12px]">{error}</span>
          )}
        </form>
      )}

      {/* Store Branding Tab */}
      {/* {activeTab === "branding" && isStore && (
        <div className="space-y-6 p-[30px]">
          <div>
            <h3 className="text-xl font-bold mb-1">Store Branding</h3>
            <p className="text-[12px] text-gray-400 mb-5">
              Customize your store appearance for Le Store
            </p>
          </div>

          <div>
            <label className="text-lg font-semibold text-gray-700 block mb-2">
              Store Logo
            </label>
            <div className="flex items-center gap-4">
              <div className="w-[80px] h-[80px] rounded-lg border border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden">
                {logoUrl ? (
                  <img
                    src={logoUrl}
                    alt="Store Logo"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <FaCamera size={24} className="text-gray-300" />
                )}
              </div>
              <div className="flex gap-2">
                <label className="cursor-pointer">
                  <Button
                    as="span"
                    size="sm"
                    className="success-btn"
                    isLoading={uploadingLogo}
                  >
                    {uploadingLogo ? "Uploading..." : "Upload Logo"}
                  </Button>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                </label>
                {logoUrl && (
                  <Button
                    size="sm"
                    className="danger-btn"
                    onPress={() => {
                      setLogoUrl("");
                      setLogoPublicId("");
                    }}
                  >
                    <RiDeleteBinFill />
                  </Button>
                )}
              </div>
            </div>
          </div>

          <div>
            <label className="text-md font-semibold text-gray-700 block mb-2">
              Brand Colors
            </label>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-sm text-gray-500 block mb-1">Primary</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="w-10 h-10 rounded cursor-pointer border-0"
                  />
                  <input
                    type="text"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="flex-1 text-sm border border-gray-300 rounded px-2 py-1"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm text-gray-500 block mb-1">Secondary</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={secondaryColor}
                    onChange={(e) => setSecondaryColor(e.target.value)}
                    className="w-10 h-10 rounded cursor-pointer border-0"
                  />
                  <input
                    type="text"
                    value={secondaryColor}
                    onChange={(e) => setSecondaryColor(e.target.value)}
                    className="flex-1 text-sm border border-gray-300 rounded px-2 py-1"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Accent</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={accentColor}
                    onChange={(e) => setAccentColor(e.target.value)}
                    className="w-10 h-10 rounded cursor-pointer border-0"
                  />
                  <input
                    type="text"
                    value={accentColor}
                    onChange={(e) => setAccentColor(e.target.value)}
                    className="flex-1 text-sm border border-gray-300 rounded px-2 py-1"
                  />
                </div>
              </div>
            </div>
          </div>

          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-2">
              Store Description
            </label>
            <textarea
              value={storeDescription}
              onChange={(e) => setStoreDescription(e.target.value)}
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-md"
              placeholder="Describe your store..."
            />
          </div>

          <div>
            <label className="text-md font-semibold text-gray-700 block mb-2">
              Social Links
            </label>
            <div className="space-y-3">
              <div>
                <label className="text-md text-gray-500 block mb-1">Instagram</label>
                <input
                  type="url"
                  value={instagram}
                  onChange={(e) => setInstagram(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-md"
                  placeholder="https://instagram.com/yourstore"
                />
              </div>
              <div>
                <label className="text-md text-gray-500 block mb-1">Facebook</label>
                <input
                  type="url"
                  value={facebook}
                  onChange={(e) => setFacebook(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-md"
                  placeholder="https://facebook.com/yourstore"
                />
              </div>
              <div>
                <label className="text-md text-gray-500 block mb-1">Website</label>
                <input
                  type="url"
                  value={brandWebsite}
                  onChange={(e) => setBrandWebsite(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-md"
                  placeholder="https://yourstore.com"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              onPress={handleSaveBranding}
              isLoading={savingBranding}
              color="success"
              className="font-semibold p-7 border border-blue-500 rounded-[4px] success-btn"
            >
              {savingBranding ? "Saving..." : "Save Branding"}
            </Button>
            <Button
              onPress={handleApplyToStore}
              isLoading={applyingBranding}
              className="font-semibold p-7 border border-blue-500 rounded-[4px] text-black bg-white"
            >
              {applyingBranding ? "Applying..." : "Apply to Le Store"}
            </Button>
          </div>
        </div>
      )} */}

    </motion.div>
  );
};

export default Profile;
