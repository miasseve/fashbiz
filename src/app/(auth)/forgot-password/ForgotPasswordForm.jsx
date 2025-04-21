"use client";
import { forgotPassword } from "@/actions/authActions";
import { useState } from "react";
import { toast } from "react-toastify";
import { Card, CardHeader, CardBody, CardFooter } from "@heroui/react";
import { Input, Button } from "@heroui/react";
import Link from "next/link";

const ForgotPasswordForm = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!email) {
      setError("Email is required");
      return;
    }

    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const response = await forgotPassword(email);
      if (response.status != 200) {
        setError(response?.message || "Something went wrong.");
      } else {
        setEmail("");
        toast.success(response.message);
      }
    } catch (error) {
      toast.error(error.response?.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen px-6 bg-fash-gradient">
      <Card className="w-full max-w-4xl p-16 shadow-2xl rounded-2xl bg-white">
        <CardHeader className="text-center flex flex-col gap-4">
          <h2 className="text-4xl font-extrabold text-gray-900">
            Forgot Password
          </h2>
          <p className="text-gray-700 text-xl">
            Enter your email to receive a password reset link
          </p>
        </CardHeader>
        <CardBody className="mt-6">
          <form onSubmit={handleForgotPassword} className="">
            <div className="mb-6">
              <input 
                type="text"
                placeholder="Enter your email"
                className="text-xl"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              {error && (
                <span className="text-red-500 font-bold text-[12px]">{error}</span>
              )}
            </div>
            <div className="text-center">
              <Button
                type="submit"
                color="primary"
                className="auth-btn bg-[#06cb03] m-auto"
                isLoading={loading}
              >
                {loading ? "Sending" : "Send Reset Link"}
              </Button>
            </div>
          </form>
        </CardBody>
        <CardFooter className="text-center text-xl text-gray-600  block">
          <div className="text-center "> 
            Remembered your password?
            <Link href="/login" className="font-semibold ml-1 underline">
              Login
            </Link>
            
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default ForgotPasswordForm;
