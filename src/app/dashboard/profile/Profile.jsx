"use client";
import React, { useState } from "react";
import { Button, Input } from "@heroui/react";
import axios from "axios";
import { useForm } from "react-hook-form";
import { removeProfile, updateUserById } from "@/actions/authActions";
import { toast } from "react-toastify";
import { FaCamera } from "react-icons/fa";
import { motion } from "framer-motion";

const Profile = ({ user }) => {
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    mode: "onTouched",
    defaultValues: {
      profileImage: user?.profileImage || {},
      firstname: user?.firstname || "",
      lastname: user?.lastname || "",
      email: user?.email || "",
      storename: user?.storename || "",
    },
  });

  const [loading, setLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(user?.profileImage?.url || "");
  const [imageInputRef, setImageInputRef] = useState(null);

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    setLoading(true);
    if (file) {
      const formData = new FormData();
      formData.append("file", file);

      const response = await axios.post("/api/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const { publicId, url } = response.data;
      setValue("profileImage", { publicId, url });
      setPreviewUrl(url);
      setLoading(false);
    }
  };

  const onSubmit = async (data) => {
    try {
      const response = await updateUserById(user._id, data);
      if (response.status === 200) {
        toast.success("Profile updated successfully!", {
          position: "top-right",
          autoClose: 2000,
        });
      }
    } catch (error) {
      console.error("Error updating user:", error);
    }
  };

  const handleRemoveImage = async () => {
    const response = await removeProfile(user._id);
    if (response.status === 200) {
      setValue("profileImage", {});
      setPreviewUrl("");
      toast.success("Image deleted successfully!", {
        position: "top-right",
        autoClose: 2000,
      });
    }
  };

  const handleImageClick = () => {
    if (imageInputRef) {
      imageInputRef.click();
    }
  };

  return (
    <motion.div 
      className="max-w-3xl mx-auto lg:my-[50px] p-6 bg-white rounded-xl shadow-lg dark:bg-gray-900 transition-all"
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="flex flex-col items-center text-center">
          <h1 className="text-xl font-semibold text-gray-700 dark:text-gray-300">Profile Picture</h1>
          <div className="relative mt-4">
            <motion.div
              whileHover={{ scale: 1.1 }}
              className="cursor-pointer border m-auto w-[150px] h-[150px] flex items-center justify-center rounded-full overflow-hidden shadow-md bg-gray-200 dark:bg-gray-700"
              onClick={handleImageClick}
            >
              {previewUrl ? (
                <img src={previewUrl} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <FaCamera size={40} className="text-gray-500 dark:text-gray-300" />
              )}
            </motion.div>
            {previewUrl && (
              <div className="flex gap-4 mt-5">
                <Button className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700" onClick={handleImageClick}>
                  Edit Image
                </Button>
                <Button className="px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700" onClick={handleRemoveImage}>
                  Remove Image
                </Button>
              </div>
            )}
          </div>
        </div>

        <input ref={(ref) => setImageInputRef(ref)} type="file" accept="image/*" onChange={handleImageChange} className="hidden" />

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">First Name</label>
            <Input {...register("firstname", { required: "First Name is required" })} className="mt-2 w-full" />
            {errors.firstname && <span className="text-red-500 text-sm">{errors.firstname.message}</span>}
          </div>
          <div>
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Last Name</label>
            <Input {...register("lastname", { required: "Last Name is required" })} className="mt-2 w-full" />
            {errors.lastname && <span className="text-red-500 text-sm">{errors.lastname.message}</span>}
          </div>
        </div>

        <div>
          <label className="text-sm font-semibold text-gray-700">Store Name</label>
          <Input disabled {...register("storename")} className="mt-2 w-full" />
        </div>

        <div>
          <label className="text-sm font-semibold text-gray-700">Email</label>
          <Input type="email" disabled defaultValue={user?.email || "mailto:user@example.com"} className="mt-2 w-full" />
        </div>

        <div className="flex justify-center">
          <Button isLoading={isSubmitting} type="submit" className="text-lg px-6 py-3 text-white bg-green-600 rounded-lg hover:bg-green-500">
            Save
          </Button>
        </div>
      </form>
    </motion.div>
  );
};

export default Profile;
 