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

const ConsignorForm = () => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    mode: "onTouched",
  });
  const router = useRouter();
  const [error, setError] = useState("");
  const [isVisible, setIsVisible] = React.useState(false);
  const toggleVisibility = () => setIsVisible(!isVisible);

  const consignorSubmit = async (data) => {
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
        }); // Show success toast
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
      <form
        className="flex flex-col gap-4"
        onSubmit={handleSubmit(consignorSubmit)}
      >
        {error && (
          <span className="text-red-500 left-0 text-[12px]">{error}</span>
        )}
        <div className="relative mb-5">
          <Input
            placeholder="First Name"
            {...register("firstname", {
              required: "First Name is required",
            })}
          />
          {errors.firstname && (
            <span className="text-red-500 absolute left-0 text-[12px]">
              {errors.firstname.message}
            </span>
          )}
        </div>

        <div className="relative mb-5">
          <Input
            placeholder="Last Name"
            {...register("lastname", {
              required: "Last Name is required",
            })}
          />
          {errors.lastname && (
            <span className="text-red-500 absolute left-0 text-[12px]">
              {errors.lastname.message}
            </span>
          )}
        </div>
        <div className="relatve mb-5">
          <Input
            placeholder="Email"
            {...register("email", {
              required: "Email is required",
            })}
          />
          {errors.email && (
            <span className="text-red-500 absolute text-[12px]">
              {errors.email.message}
            </span>
          )}
        </div>

        <div className="relative mb-5">
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
            <span className="text-red-500 absolute left-0  text-[12px]">
              {errors.password.message}
            </span>
          )}
        </div>

        <Button
          isLoading={isSubmitting}
          type="submit"
          color="primary"
          fullWidth
          className="bg-[#0c0907] text-white py-6 px-6 rounded-lg text-lg"
        >
          Register
        </Button>
      </form>
    </div>
  );
};

export default ConsignorForm;
