"use client";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { registerUser } from "@/actions/authActions";
import { EyeFilledIcon } from "../icons/EyeFilledIcon ";
import { EyeSlashFilledIcon } from "../icons/EyeSlashFilledIcon ";
import { validatePassword } from "../validation/validation";
import { useRouter } from "next/navigation";
import { Input, Button } from "@heroui/react";
const StoreForm = () => {
  const {
    register,
    handleSubmit,
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
          <span className="text-red-500 right-0 text-[10px]">{error}</span>
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
              <EyeSlashFilledIcon className="h-5 w-5" />
            ) : (
              <EyeFilledIcon className="h-5 w-5" />
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
          className="auth-btn bg-[#06cb03]"
        >
          REGISTER
        </Button>
      </form>
    </div>
  );
};

export default StoreForm;
