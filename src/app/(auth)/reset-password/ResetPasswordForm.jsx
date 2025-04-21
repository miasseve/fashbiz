"use client";
import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { resetPassword, verifypasswordToken } from "@/actions/authActions";
import { Card, CardHeader, CardBody, CardFooter } from "@heroui/react";
import { EyeFilledIcon } from "../icons/EyeFilledIcon ";
import { EyeSlashFilledIcon } from "../icons/EyeSlashFilledIcon ";
import { Input, Button } from "@heroui/react";

const ResetPasswordForm = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setErrors] = useState([]);
  const [isVisible, setIsVisible] = useState(false);
  const toggleVisibility = () => setIsVisible(!isVisible);
  const [isVisibleConfirm, setIsVisibleConfirm] = useState(false);
  const toggleVisibilityConfirm = () => setIsVisibleConfirm(!isVisibleConfirm);

  useEffect(() => {
    if (!token) {
      setErrors(["Invalid or expired token."]);
      return;
    }
    const checkTokenValidity = async () => {
      try {
        const response = await verifypasswordToken(token);
        if (response.status != 200) {
          setErrors([response.error || "Invalid or expired token."]);
        }
      } catch (error) {
        setErrors(["Invalid or expired token."]);
      }
    };

    checkTokenValidity();
  }, [token]);

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setErrors([]);
    setLoading(true);

    if (!password || !confirmPassword) {
      setErrors(["All fields are required."]);
      setLoading(false);
      return;
    }

    // Check if passwords match
    if (password !== confirmPassword) {
      setErrors(["Passwords do not match."]);
      setLoading(false);
      return;
    }

    try {
      const response = await resetPassword(token, password, confirmPassword);
      if (response.status != 200) {
        setErrors(response.error);
        return;
      }
      toast.success(response.message);
      router.push("/login");
    } catch (error) {
      setErrors([error.response?.message || "Something went wrong."]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-fash-gradient px-6">
      <Card className="w-full max-w-2xl p-12 shadow-2xl rounded-2xl bg-white">
        <form onSubmit={handleResetPassword} className="space-y-6">
          <CardHeader className="text-center flex flex-col gap-4">
            <h2 className="text-3xl font-extrabold text-gray-900">
              Reset Password
            </h2>
            <p className="text-gray-700 text-lg">
              Enter your new password below
            </p>
          </CardHeader>
          <CardBody className="mt-6">
            <div className="mb-8 relative">
              <input
                type={isVisible ? "text" : "password"}
                placeholder="Enter new password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
            </div>
            <div className="mb-8 relative">
              <input
                type={isVisibleConfirm ? "text" : "password"}
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
                <button
                type="button"
                onClick={toggleVisibilityConfirm}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500"
              >
                {isVisibleConfirm ? (
                  <EyeSlashFilledIcon className="h-5 w-5" />
                ) : (
                  <EyeFilledIcon className="h-5 w-5" />
                )}
              </button>
            </div>

            {error && error.length > 0 && (
              <div className="text-red-500 font-bold text-[12px]">
                <ul style={{ listStyleType: "disc", paddingLeft: "20px" }}>
                  {error.map((err, index) => (
                    <li key={index}>{err}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardBody>
          <CardFooter className="text-center text-lg text-gray-600 block">
            <Button
              type="submit"
              className="auth-btn bg-[#06cb03] m-auto"
              color="primary"
              isLoading={loading}
            >
              {loading ? "Resetting" : "Reset Password"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default ResetPasswordForm;
