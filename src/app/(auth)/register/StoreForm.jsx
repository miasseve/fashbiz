"use client";
import React, { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { toast } from "react-toastify";
import { registerUser } from "@/actions/authActions";
import { EyeFilledIcon } from "../icons/EyeFilledIcon ";
import { EyeSlashFilledIcon } from "../icons/EyeSlashFilledIcon ";
import { validatePassword } from "../validation/validation";
import { useRouter } from "next/navigation";
import { Input, Button } from "@heroui/react";
import "react-phone-number-input/style.css";
import { isValidPhoneNumber } from "react-phone-number-input";
import PhoneInput from "react-phone-number-input";

const StoreForm = () => {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm({
    mode: "onTouched",
  });
  const [error, setError] = useState("");
  const [isVisible, setIsVisible] = React.useState(false);
  const toggleVisibility = () => setIsVisible(!isVisible);

  const router = useRouter();

  const storeSubmit = async (data) => {
    setError("");
    try {
      const payload = {
        ...data,
        email: data.email.toLowerCase(),
        role: "store",
      };

      if (!isValidPhoneNumber(data.phone)) {
        setError("Invalid phone number");
        return;
      }

      const result = await registerUser(payload);

      if (result.status === 200) {
        toast.success("Your account has been created!", {
          position: "top-center",
        });
        router.push("/login");
      } else {
        setError(result.error);
      }
    } catch (error) {
      console.error("Error during signup:", error);
    }
  };
  return (
    <div>
      <form className="flex flex-col" onSubmit={handleSubmit(storeSubmit)}>
        {error && (
          <span className="text-red-500 right-0 text-[14px]  font-bold">{error}</span>
        )}
        <div className="relative mb-10">
          <input
            placeholder="First Name"
            {...register("firstname", {
              required: "First Name is required",
            })}
          />
          {errors.firstname && (
            <span className="text-red-500 font-bold text-[12px] absolute left-0 -bottom-[19px]">
              {errors.firstname.message}
            </span>
          )}
        </div>

        <div className="relative mb-10">
          <input
            placeholder="Last Name"
            {...register("lastname", {
              required: "Last Name is required",
            })}
          />
          {errors.lastname && (
            <span className="text-red-500 font-bold text-[12px] absolute left-0 -bottom-[19px]">
              {errors.lastname.message}
            </span>
          )}
        </div>

        <div className="relative mb-10">
          <input
            placeholder="Store Name"
            {...register("storename", {
              required: "Store Name is required",
            })}
          />
          {errors.storename && (
            <span className="text-red-500 font-bold text-[12px] absolute left-0 -bottom-[19px]">
              {errors.storename.message}
            </span>
          )}
        </div>
        <div className="relative mb-10">
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
            <span className="text-red-500 font-bold text-[12px] absolute left-0 -bottom-[19px]">
              {errors.country.message}
            </span>
          )}
        </div>

        <div className="relative mb-10">
          <input
            placeholder="Business Registration Number (VAT/CVR)"
            {...register("businessNumber", {
              required: "Business Registration Number is required",
            })}
          />
          {errors.businessNumber && (
            <span className="text-red-500 font-bold text-[12px] absolute left-0 -bottom-[19px]">
              {errors.businessNumber.message}
            </span>
          )}
        </div>

        <div className="relative mb-10">
          <Controller
            name="phone"
            control={control}
            defaultValue=""
            rules={{
              pattern: {
                value: /^[0-9+\-\s()]*$/,
                message: "Invalid phone number format",
              },
            }}
            render={({ field }) => (
              <PhoneInput
                {...field}
                international
                defaultCountry="DK"
                className="mt-2 w-full rounded-md px-3 py-2 text-gray-800"
                placeholder="Enter phone number"
              />
            )}
          />

          {errors.phone && (
            <span className="text-red-500 text-sm mt-1">
              {errors.phone.message}
            </span>
          )}
        </div>
        <div className="relative mb-10">
          <input
            placeholder="Email"
            {...register("email", {
              required: "Email is required",
            })}
          />
          {errors.email && (
            <span className="text-red-500 font-bold text-[12px] absolute left-0 -bottom-[19px]">
              {errors.email.message}
            </span>
          )}
        </div>

        <div className="relative mb-10">
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
            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500"
          >
            {isVisible ? (
              <EyeSlashFilledIcon className="h-8 w-10" />
            ) : (
              <EyeFilledIcon className="h-8 w-10" />
            )}
          </button>
          {errors.password && (
            <span className="text-red-500 font-bold text-[12px] absolute left-0 -bottom-[19px]">
              {errors.password.message}
            </span>
          )}
        </div>

        <Button
          isLoading={isSubmitting}
          type="submit"
          color="primary"
          className="auth-btn m-auto"
        >
          Create Account - Free 14 days
        </Button>
      </form>
    </div>
  );
};

export default StoreForm;
