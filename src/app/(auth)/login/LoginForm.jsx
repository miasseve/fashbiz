"use client";
import React, { useState } from "react";
import { Card } from "@heroui/react";
import { useForm } from "react-hook-form";
import Link from "next/link";
import { signInUser } from "@/actions/authActions";
import { useRouter } from "next/navigation";
import { Input } from "@heroui/input";
import { Button } from "@heroui/button";
import { EyeFilledIcon } from "../icons/EyeFilledIcon ";
import { EyeSlashFilledIcon } from "../icons/EyeSlashFilledIcon ";

const LoginForm = () => {
  const router = useRouter();
  const [isVisible, setIsVisible] = React.useState(false);
  const [error, setError] = useState("");
  const toggleVisibility = () => setIsVisible(!isVisible);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    mode: "onTouched",
  });

  const onSubmit = async (data) => {
    setError("");
    const payload = {
      ...data,
      email: data.email.toLowerCase(),
    };

    // const result = await signInUser(payload);
    const res = await fetch("api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const result = await res.json();
    if (result.status === 200) {
      if (result.profileStatus) {
        if (result.role == "store") {
          router.push("/dashboard/add-product");
        } else {
          router.push("/dashboard/storelist");
        }
      } else {
        router.push("/dashboard/profile");
      }
    } else {
      setError(result.error);
    }
  };

  return (
    <section className="min-h-screen bg-fash-gradient">
      <div className="md:max-w-[100%] mx-auto min-h-screen">
        <div className="sm:flex w-full gap-5 justify-between relative h-full min-h-screen">
          <div className=" sm:flex justify-end items-center  sm:p-4 lg:p-0  p-8 sm:p-0 sm:min-h-screen w-full sm:w-[50%]">
            <div className="w-100% md:w-[430px] sm:pr-[2rem] lftlogin">
              <div className="w-full text-center">
                <div className="icon-text text-black relative">
                  <Link href="/">
                    <img src="/fashlogo.svg" className="w-[37%] mb-[53px]" />
                  </Link>
                </div>
              </div>

              <div className="lg:pb-[5rem] sm:pb-[5rem]">
                <div className="">
                  <div className="text-[54px] font-bold uppercase leading-[60px] mb-[30px] text-[#06cb03]">
                    14 DAYS FREE TO SELL INSTANTLY
                  </div>
                  <p className="text-[18px] font-normal text-black m-0">
                    Your trusted marketplace to sell with ease.
                  </p>
                  <p className="text-[18px] font-normal text-black m-0 mb-[40px]">
                    Trouble logging in?{" "}
                    <Link href="/contact-support" className="underline">
                      Contact support
                    </Link>
                  </p>
                </div>
                <div className="md:w-1/2">
                  <Link href="/register" className="login-btn text-base">
                    CREATE ACCOUNT
                  </Link>
                </div>
              </div>
            </div>
          </div>

          <div className="sm:w-[50%] flex justify-center items-center pt-8 sm:pt-0">
            <div className="text-center m-auto md:w-[80%] w-[100%] rounded-[8px] p-4">
              <Card className="p-8 bg-white shadow-lg rounded-[14px]">
                <div className="text-[24px] font-bold  leading-[4.2rem] mb-[2rem]">
                  Sign In
                </div>
                <form
                  className="w-full text-start"
                  onSubmit={handleSubmit(onSubmit)}
                >
                  {error && (
                    <span className="text-red-500 left-0 text-[12px] font-bold mb-2">
                      {error}
                    </span>
                  )}
                  <div className="mb-8 relative">
                    <input
                      placeholder="Enter Your Email"
                      type="text"
                      size="lg"
                      radius="full"
                      {...register("email", {
                        required: "Email is required",
                        pattern: {
                          value:
                            /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
                          message: "Please enter a valid email",
                        },
                      })}
                    />
                    {errors.email && (
                      <span className="text-red-500 font-bold text-[10px] left-0">
                        {errors.email.message}
                      </span>
                    )}
                  </div>

                  <div className="mb-8 relative">
                    <div className="relative">
                      <input
                        type={isVisible ? "text" : "password"}
                        size="lg"
                        placeholder="Enter Your Password"
                        {...register("password", {
                          required: "Password is required",
                        })}
                      />
                      <button
                        aria-label="toggle password visibility"
                        type="button"
                        onClick={toggleVisibility}
                        className="absolute right-4 top-1/2 -translate-y-1/2  text-gray-500"
                      >
                        {isVisible ? (
                          <EyeSlashFilledIcon className="h-8 w-10" />
                        ) : (
                          <EyeFilledIcon className="h-8 w-10" />
                        )}
                      </button>
                    </div>
                    {errors.password && (
                      <span className="text-red-500 font-bold text-[10px] left-0">
                        {errors.password.message}
                      </span>
                    )}
                  </div>

                  <Button
                    isLoading={isSubmitting}
                    color="primary"
                    type="submit"
                    className="auth-btn m-auto"
                  >
                    LOGIN
                  </Button>
                </form>

                <div className="text-center mt-2">
                  <Link
                    href="/forgot-password"
                    className="text-[1.2rem] hover:underline"
                  >
                    Forgot Password ?
                  </Link>
                </div>
              </Card>

              <div className="text-[1.5rem] text-white text-center mt-4 leading-[2rem] ">
                Don't have an account?{" "}
                <Link
                  href="/register"
                  className="hover:underline text-[#6e482d]"
                >
                  Signup
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LoginForm;
