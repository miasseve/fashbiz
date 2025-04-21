"use client";
import React, { useEffect, useState } from "react";
import { Button,Spinner } from "@heroui/react";
import axios from "axios";
import { useForm, Controller } from "react-hook-form";
import { removeProfile, updateUser } from "@/actions/authActions";
import { toast } from "react-toastify";
import { FaCamera } from "react-icons/fa";
import { motion } from "framer-motion";
import { countries } from "countries-list";
import { useSession } from "next-auth/react";
import { Select, SelectItem } from "@heroui/react";
import { yupResolver } from "@hookform/resolvers/yup";
import { State } from "country-state-city";
import * as Yup from "yup";
import { useRouter } from "next/navigation";
import { FaUserEdit } from "react-icons/fa";
import { RiDeleteBinFill } from "react-icons/ri";
import { isValidPhoneNumber } from "react-phone-number-input";
import "react-phone-number-input/style.css";
import { storeProfileImage } from "@/actions/cloudinaryActions";
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
    phoneNumber: Yup.string()
      .required("Phone number is required")
      .test("is-valid-phone", "Phone number is not valid", (value) => {
        if (!value) return false;
        return isValidPhoneNumber(value);
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
      phoneNumber: user?.phoneNumber || "",
      address: user?.address || "",
      city: user?.city || "",
      zipcode: user?.zipcode || "",
      state: user?.state || "",
      country: user?.country || "DK",
    },
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(user?.profileImage?.url || "");

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
      // const res = await storeProfileImage(formData);
      const response = await axios.post("/api/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      // console.log(res,'res')

    //  if(res.status==200){
      const { publicId, url } = response.data;
      setValue("profileImage", { publicId, url });
      setPreviewUrl(url);
      setLoading(false);
    //  }
    }
  };

  const onSubmit = async (data) => {
    try {
      setError("");
      await profileSchema.validate(data, { abortEarly: false });

      if (!isValidPhoneNumber(data.phoneNumber)) {
        setError("Invalid phone number");
        toast.error("Invalid phone number!", {
          position: "top-right",
          autoClose: 2000,
        });
        return;
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

  return (
    <motion.div
      className="mx-auto lg:my-[10px]  bg-white rounded-xl shadow-sm dark:bg-gray-900 transition-all"
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
    >
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
                  // className="px-4 py-2 rounded-md text-white hover:bg-blue-700"
                  className="success-btn"
                  onPress={handleImageClick}
                  color="success"
                >
                  <FaUserEdit />
                </Button>
                <Button
                  // className="px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700"
                  className="danger-btn"
                  onPress={handleRemoveImage}
                >
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

        {session?.user?.role === "store" && (
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
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Phone Number
            </label>
            <Controller
              name="phoneNumber"
              control={control}
              defaultValue={user?.phoneNumber || ""}
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
            {errors.phoneNumber && (
              <span className="text-red-500 font-bold text-[12px]">
                {errors.phoneNumber.message}
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
            {/* <Select
              {...register("state")}
              className="max-w-xs"
              placeholder="Select state"
              onChange={handleStateChange}
            >
              {stateOptions.map((state) => (
                <SelectItem key={state.value} value={state.value}>
                  {state.label}
                </SelectItem>
              ))}
            </Select> */}
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
            {/* <Select
              {...register("country")}
              className="max-w-xs"
              placeholder="Select country"
              onChange={handleCountryChange}
            >
              {countryOptions.map((country) => (
                <SelectItem key={country.value} value={country.value}>
                  {country.label}
                </SelectItem>
              ))}
            </Select> */}
            {errors.country && (
              <span className="text-red-500 font-bold text-[12px]">
                {errors.country.message}
              </span>
            )}
          </div>
        </div>
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
    </motion.div>
  );
};

export default Profile;
