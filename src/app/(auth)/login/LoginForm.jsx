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
import { validatePassword } from "../validation/validation";

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
      email: data.email.toLowerCase(), // Convert email to lowercase before sending
    };
    const result = await signInUser(payload);
    console.log(result,'rrrrrrrrrrrrrrrrr')
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
    <section className="min-h-screen md:pt-[10rem] pt-[5rem] pb-[5rem] bg-gradient-to-b from-[#FFF0F0] to-[#DD8081]">
      <div className="md:max-w-[100%] md:px-[20px] 2xl:max-w-[1100px] mx-auto px-[15px] 2xl:px-20">
        <div className="lg:flex w-full gap-5 justify-between relative">
          <div className="lg:w-[60%] w-[100%] flex flex-col justify-between">
            <div className="w-full lg:w-[20%] h-30 text-center">
              <div className="icon-text text-black relative">
                <h1 className="text-[4.25rem] pl-[0rem] mb-8 lg:lg-0">
                  <img
                    src="/fashlogo.svg"
                    className="w-[120px] md:[200px] lg:m-0 m-auto"
                  />
                </h1>
              </div>
            </div>

            <div className="lg:pb-[5rem] pb-[5rem]">
              <div className="lg:pl-[5rem]">
                <div className="2xl:text-[6rem] lg:text-[5rem] md:text-[4rem] text-[4rem] text-center lg:text-left text-white 2xl:leading-[5rem] leading-[4rem] font-normal mb-[4rem] max-w-[100%]">
                  Sell <br></br> instantly
                </div>
              </div>
              <div className="text-center lg:text-right pr-[0] lg:pr-[8rem]">
                <Link
                  href="/register"
                  className="bg-white py-2 px-8 rounded-lg  hover:bg-[#53f84b] transition duration-300 text-[1.2rem] text-left py-4 inline-block leading-[1.5rem]"
                >
                  CREATE ACCOUNT
                </Link>
              </div>
            </div>
          </div>

          <div className="lg:w-[400px] w-[100%]  lg:absolute  right-0 top-0">
            <div
              className="text-center m-auto w-[300px] rounded-[8px] p-4"
              style={{
                backgroundImage: "url('/bg-img.png')",
                backgroundSize: "cover", // Ensures the image covers the container
                backgroundPosition: "center", // Centers the image
              }}
            >
              <div className="text-[1.5rem] font-bold text-white mb-[4rem]">
               Hi Welcome
              </div>
              <div className="text-[3.25rem] font-bold text-white leading-[4.2rem] mb-[2rem]">
                Login
              </div>
              <div className=" text-white mb-6 text-[1rem] font-bold">
                Sign in to continue
              </div>
              <Card className="p-8 bg-white shadow-lg rounded-[14px]">
                <form className="w-full" onSubmit={handleSubmit(onSubmit)}>
                  {error && (
                    <span className="text-red-500 right-0 text-[10px]">
                      {error}
                    </span>
                  )}
                  <div className="mb-8 relative">
                    <Input
                      placeholder="Enter Your Email"
                      type="text"
                      size="lg"
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
                      <span className="text-red-500 absolute right-0 text-[10px]">
                        {errors.email.message}
                      </span>
                    )}
                  </div>

                  <div className="mb-8 relative">
                    <Input
                      endContent={
                        <button
                          aria-label="toggle password visibility"
                          className="focus:outline-none"
                          type="button"
                          onClick={toggleVisibility}
                        >
                          {isVisible ? (
                            <EyeSlashFilledIcon className="text-2xl text-default-400 pointer-events-none" />
                          ) : (
                            <EyeFilledIcon className="text-2xl text-default-400 pointer-events-none" />
                          )}
                        </button>
                      }
                      type={isVisible ? "text" : "password"}
                      size="lg"
                      placeholder="Enter Your Password"
                      {...register("password", {
                        required: "Password is required",
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
                    color="primary"
                    type="submit"
                    className="bg-[#0c0907] flex m-auto w-fit-content text-white py-6 px-6 rounded-lg text-lg"
                  >
                    Login
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
