"use client";
import React, { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { toast } from "react-toastify";
import PhoneInput from "react-phone-number-input";
import { registerUser } from "@/actions/authActions";
import { EyeFilledIcon } from "../icons/EyeFilledIcon ";
import { EyeSlashFilledIcon } from "../icons/EyeSlashFilledIcon ";
import { validatePassword } from "../validation/validation";
import { useRouter } from "next/navigation";
import { isValidPhoneNumber } from "react-phone-number-input";
import { Input, Button } from "@heroui/react";
import { yupResolver } from "@hookform/resolvers/yup";
import { registerSchema } from "@/actions/validations";

const ConsignorForm = () => {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
    setError,
  } = useForm({
    mode: "onTouched",
    resolver: yupResolver(registerSchema),
  });
  const router = useRouter();
  const [apiError, setApiError] = useState("");
  const [isVisible, setIsVisible] = React.useState(false);
  const toggleVisibility = () => setIsVisible(!isVisible);

  const consignorSubmit = async (data) => {
    if (!isValidPhoneNumber(data.phone)) {
       setError("phone", {
          type: "manual", 
          message: "Phone number is not valid"
        });
      return; 
    }

    setError("");

    try {
      const payload = {
        ...data,
        email: data.email.toLowerCase(),
        role: "consignor",
      };
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
      <form
        className="flex flex-col relative"
        onSubmit={handleSubmit(consignorSubmit)}
      >
        {apiError && (
          <span className="text-red-500 left-0 text-[12px] font-bold mb-2">{apiError}</span>
        )}
        <div className="relative mb-8">
          <input placeholder="First Name" {...register("firstname")} />
          {errors.firstname && (
            <span className="text-red-500 font-bold text-[10px] left-0">
              {errors.firstname.message}
            </span>
          )}
        </div>

        <div className="relative mb-8">
          <input placeholder="Last Name" {...register("lastname")} />
          {errors.lastname && (
            <span className="text-red-500 font-bold text-[10px] left-0">
              {errors.lastname.message}
            </span>
          )}
        </div>
        <div className="relative mb-8">
          <input placeholder="Email" {...register("email")} />

          {errors.email && (
            <span className="text-red-500 font-bold text-[10px] left-0">
              {errors.email.message}
            </span>
          )}
        </div>

        <div className="relative mb-8">
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
            className="absolute right-4 text-gray-500"
          >
            {isVisible ? (
              <EyeSlashFilledIcon className="h-8 w-10" />
            ) : (
              <EyeFilledIcon className="h-8 w-10" />
            )}
          </button>
          {errors.password && (
            <span className="text-red-500 font-bold text-[10px] left-0">
              {errors.password.message}
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
            <span className="text-red-500 font-bold text-[10px] left-0">
              {errors.phone.message}
            </span>
          )}
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

export default ConsignorForm;
