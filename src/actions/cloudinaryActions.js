"use server";
import cloudinary from "@/lib/cloudinary";

import User from "@/models/User";

export async function updateCloudinaryImage(file) {
  try {
    if (!file) {
      throw new Error("Missing required parameters: 'file'");
    }
    // Upload the new file with the same publicId to replace the image
    const result = await cloudinary.v2.uploader.upload(file, {
      folder: "nm-demo",
      format: "webp",
    });

    return {
      status: 200,
      message: "Image stored successfully",
      data: result,
    };
  } catch (error) {
    return {
      status: 500,
      message: "Failed to store the image",
      error: error.message,
    };
  }
}

export async function storeProfileImage(formData) {
  try {
    const isProfileImage = formData.get("isProfileImage");
    const file = formData.get("file");
    const userId = formData.get("userId");

    if (!file) {
      return { status: 400, error: "No file uploaded" };
    }
    const buffer = Buffer.from(await file.arrayBuffer());

    const uploadPromise = new Promise((resolve, reject) => {
      const uploadStream = cloudinary.v2.uploader.upload_stream(
        {
          folder: "nm-demo",
          format: "webp",
        },
        (error, result) => {
          if (error) {
            return reject(error);
          }
          resolve(result);
        }
      );

      uploadStream.end(buffer);
    });

    const uploadResponse = await uploadPromise;
    if (isProfileImage == "true") {
      const user = await User.findById(userId);
      if (!user) throw new Error("User not found");
      user.profileImage = {
        url: uploadResponse.secure_url,
        publicId: uploadResponse.public_id,
      }; // Update the profile image URL
      await user.save();
    }
    return {
      status: 200,
      data: {
        url: uploadResponse.secure_url,
        publicId: uploadResponse.publicId,
      },
    };
  } catch (error) {
    return { status: 500, error: error.message };
  }
}
