"use client";
import React, { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { toast } from "react-toastify";
import { registerUser } from "@/actions/authActions";
import { EyeFilledIcon } from "../icons/EyeFilledIcon ";
import { EyeSlashFilledIcon } from "../icons/EyeSlashFilledIcon ";
import { validatePassword } from "../validation/validation";
import { useRouter } from "next/navigation";
import { Button } from "@heroui/react";
import "react-phone-number-input/style.css";
import { yupResolver } from "@hookform/resolvers/yup";
import { isValidPhoneNumber } from "react-phone-number-input";
import PhoneInput from "react-phone-number-input";
import { registerSchema } from "@/actions/validations";

const BrandForm = () => {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
    setError,
  } = useForm({
    mode: "onTouched",
    resolver: yupResolver(registerSchema),
    defaultValues: {
      role: "brand",
    },
  });

  const [apiError, setApiError] = useState("");
  const [isVisible, setIsVisible] = useState(false);
  const toggleVisibility = () => setIsVisible(!isVisible);
  const router = useRouter();

  const brandSubmit = async (data) => {
    setError("");
    try {
      const payload = {
        ...data,
        email: data.email.toLowerCase(),
        role: "brand",
      };

      if (!isValidPhoneNumber(data.phone)) {
        setError("phone", {
          type: "manual",
          message: "Phone number is not valid",
        });
        return;
      }
      const result = await registerUser(payload);
      if (result.status === 200) {
        toast.success("Your account has been created!", {
          position: "top-center",
        });
        router.push("/login");
      } else {
        setApiError(result.error);
      }
    } catch (error) {
      console.error("Error during signup:", error);
    }
  };

  return (
    <div>
      <form className="flex flex-col" onSubmit={handleSubmit(brandSubmit)}>
        {apiError && (
          <span className="text-red-500 left-0 text-[12px] font-bold mb-2">
            {apiError}
          </span>
        )}
        <div className="flex justify-between lg:flex-row flex-col w-full ">
          <div className="relative mb-8 lg:w-[48%]">
            <input
              placeholder="Contact Person Name"
              {...register("firstname", {
                required: "Contact Person Name is required",
              })}
            />
            {errors.firstname && (
              <span className="text-red-500 font-bold text-[10px]  left-0">
                {errors.firstname.message}
              </span>
            )}
          </div>
           <div className="relative mb-8 lg:w-[48%]">
            <input
              placeholder="Last Name"
              {...register("lastname", {
                required: "Last Name is required",
              })}
            />
            {errors.lastname && (
              <span className="text-red-500 font-bold text-[10px]  left-0">
                {errors.lastname.message}
              </span>
            )}
          </div>
        </div>
        <div className="relative mb-8">
          <input
            placeholder="Contact Person Title"
            {...register("contactTitle", {
              required: "Contact Person Title is required",
            })}
          />
          {errors.contactTitle && (
            <span className="text-red-500 font-bold text-[10px]  left-0">
              {errors.contactTitle.message}
            </span>
          )}
        </div>
        <div className="relative mb-8">
          <input
            placeholder="Brand Name"
            {...register("brandname", {
              required: "Brand Name is required",
            })}
          />
          {errors.brandname && (
            <span className="text-red-500 font-bold text-[10px]  left-0">
              {errors.brandname.message}
            </span>
          )}
        </div>
        <div className="relative mb-8">
          <input
            placeholder="Legal Company Name"
            {...register("legalCompanyName", {
              required: "Legal Company Name is required",
            })}
          />
          {errors.legalCompanyName && (
            <span className="text-red-500 font-bold text-[10px]  left-0">
              {errors.legalCompanyName.message}
            </span>
          )}
        </div>
        <div className="relative mb-8">
          <input
            placeholder="Company Website"
            {...register("companyWebsite", {
              required: "Company Website is required",
            })}
          />
          {errors.companyWebsite && (
            <span className="text-red-500 font-bold text-[10px]  left-0">
              {errors.companyWebsite.message}
            </span>
          )}
        </div>
        <div className="relative mb-8">
          <select
            className="w-full border border-gray-300 rounded-md p-2"
            {...register("country", {
              required: "Country is required",
            })}
          >
            <option value="">Select Country</option>
            <option value="DK">Denmark (DK)</option>
            <option value="FR">France (FR)</option>
            <option value="DE">Germany (DE)</option>
            <option value="IT">Italy (IT)</option>
            <option value="ES">Spain (ES)</option>
            <option value="NL">Netherlands (NL)</option>
            <option value="SE">Sweden (SE)</option>
            <option value="NO">Norway (NO)</option>
          </select>
          {errors.country && (
            <span className="text-red-500 font-bold text-[10px]  left-0">
              {errors.country.message}
            </span>
          )}
        </div>

        <div className="relative mb-8 leading-tight">
          <input
            placeholder="Company Registration Number"
            {...register("companyNumber", {
              required: "Company Registration Number is required",
            })}
          />
          {errors.companyNumber && (
            <span className="text-red-500  font-bold text-[10px]  left-0">
              {errors.companyNumber.message}
            </span>
          )}
        </div>

        <div className="relative mb-8">
          <Controller
            name="phone"
            control={control}
            defaultValue=""
            render={({ field }) => (
              <PhoneInput
                {...field}
                international
                defaultCountry="DK"
                className="mt-2 w-full rounded-md py-2 text-gray-800"
                placeholder="Enter phone number"
              />
            )}
          />
          {errors.phone && (
            <span className="text-red-500 font-bold text-[10px]  left-0">
              {errors.phone.message}
            </span>
          )}
        </div>
        <div className="flex justify-between lg:flex-row flex-col w-full ">
          <div className="relative mb-8 lg:w-[48%]">
            <input
              placeholder="Business Email"
              {...register("email", {
                required: "Business Email is required",
              })}
            />
            {errors.email && (
              <span className="text-red-500 font-bold text-[10px] left-0">
                {errors.email.message}
              </span>
            )}
          </div>

          <div className="relative mb-8 lg:w-[48%] leading-tight ">
            <div className="relative">
              <input
                placeholder="Password"
                type={isVisible ? "text" : "password"}
                {...register("password", {
                  validate: validatePassword,
                })}
              />
              <button
                type="button"
                onClick={toggleVisibility}
                className="absolute right-4 transform text-gray-500"
              >
                {isVisible ? (
                  <EyeSlashFilledIcon className="h-8 w-10" />
                ) : (
                  <EyeFilledIcon className="h-8 w-10" />
                )}
              </button>
            </div>
            {errors.password && (
              <span className="text-red-500 font-bold text-[10px]  left-0">
                {errors.password.message}
              </span>
            )}
          </div>
        </div>
        <Button
          isLoading={isSubmitting}
          type="submit"
          color="primary"
          className="auth-btn m-auto"
        >
          REGISTER
        </Button>
      </form>
    </div>
  );
};

export default BrandForm;
