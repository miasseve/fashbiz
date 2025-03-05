'use server';
import cloudinary from "@/lib/cloudinary";

export async function updateCloudinaryImage(file) {
  try {
    if (!file) {
      throw new Error("Missing required parameters: 'file'");
    }
    // Upload the new file with the same publicId to replace the image
    const result = await cloudinary.v2.uploader.upload(file, {
    folder: 'nm-demo',
    format: 'webp',    
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
