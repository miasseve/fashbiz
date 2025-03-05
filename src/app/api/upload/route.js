import cloudinary from "@/lib/cloudinary";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
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

    return NextResponse.json({
      url: uploadResponse.secure_url,
      publicId: uploadResponse.public_id,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url);
    const publicId = searchParams.get("publicId");
    const removeBgPublicId = searchParams.get("removeBgPublicId");

    if (!publicId) {
      return NextResponse.json(
        { error: "No public ID provided" },
        { status: 400 }
      );
    }

       const imageExists = await cloudinary.api.resource(publicId, {
        resource_type: "image",
      }).catch(() => null);
  
      if (!imageExists) {
        return NextResponse.json({ message: "Image deleted successfully" });
      }

    const deleteResponse = await cloudinary.uploader.destroy(publicId, {
      resource_type: "image",
    });

    if (removeBgPublicId) {
      await cloudinary.uploader.destroy(removeBgPublicId, {
        resource_type: "image",
      });
    }

    if (deleteResponse.result === "ok") {
      return NextResponse.json({ message: "Image deleted successfully" });
    } else {
      return NextResponse.json(
        { error: "Failed to delete image" },
        { status: 500 }
      );
    }
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
