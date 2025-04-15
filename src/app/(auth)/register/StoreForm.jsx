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
        <div className="relative mb-8">
          <Input
            placeholder="First Name"
            {...register("firstname", {
              required: "First Name is required",
            })}
          />
          {errors.firstname && (
            <span className="text-red-500 absolute right-0 text-[10px]">
              {errors.firstname.message}
            </span>
          )}
        </div>

        <div className="relative mb-8">
          <Input
            placeholder="Last Name"
            {...register("lastname", {
              required: "Last Name is required",
            })}
          />
          {errors.lastname && (
            <span className="text-red-500 absolute right-0 text-[10px]">
              {errors.lastname.message}
            </span>
          )}
        </div>

        <div className="relative mb-8">
          <Input
            placeholder="Store Name"
            {...register("storename", {
              required: "Store Name is required",
            })}
          />
          {errors.storename && (
            <span className="text-red-500 absolute right-0 text-[10px]">
              {errors.storename.message}
            </span>
          )}
        </div>

        <div className="relative mb-8">
          <Input
            placeholder="Email"
            {...register("email", {
              required: "Email is required",
            })}
          />
          {errors.email && (
            <span className="text-red-500 absolute right-0 text-[10px]">
              {errors.email.message}
            </span>
          )}
        </div>

        <div className="relative mb-8">
          <Input
            endContent={
              <button type="button" onClick={toggleVisibility}>
                {isVisible ? <EyeSlashFilledIcon /> : <EyeFilledIcon />}
              </button>
            }
            placeholder="Password"
            type={isVisible ? "text" : "password"}
            {...register("password", {
              validate: validatePassword,
            })}
          />
          {errors.password && (
            <span className="text-red-500 absolute right-0 text-[10px]">
              {errors.password.message}
            </span>
          )}
        </div>

        <Button
          isLoading={isSubmitting}
          type="submit"
          color="primary"
          className="bg-[#0c0907] flex m-auto w-fit-content text-white py-6 px-6 rounded-lg text-lg"
        >
          Register
        </Button>
      </form>
    </div>
  );
};

export default StoreForm;
