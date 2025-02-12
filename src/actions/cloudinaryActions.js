'use server';
import cloudinary from "@/lib/cloudinary";

export async function updateCloudinaryImage(publicId, file) {
  try {
    if (!publicId || !file) {
      throw new Error("Missing required parameters: 'publicId' or 'file'");
    }
    // Upload the new file with the same publicId to replace the image
    const result = await cloudinary.v2.uploader.upload(file, {
    folder: 'nm-demo',
    format: 'webp',    
    });
    
    return {
      success: true,
      message: "Image updated successfully",
      data: result,
    };
  } catch (error) {
    console.error("Error updating Cloudinary image:", error);
    return {
      success: false,
      message: "Failed to update the image",
      error: error.message,
    };
  }
}
