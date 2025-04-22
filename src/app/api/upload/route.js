import cloudinary from "@/lib/cloudinary";
import { NextResponse } from "next/server";
import User from "@/models/User";
import dbConnect from "@/lib/db";
export async function POST(req) {
  try {
    await dbConnect();
    const formData = await req.formData();
    const file = formData.get("file");
    const isProfileImage = formData.get("isProfileImage");
    const userId = formData.get("userId");

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    const uploadResult = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.v2.uploader.upload_stream(
        { folder: "nm-demo", format: "webp" },
        (error, result) => (error ? reject(error) : resolve(result))
      );
      uploadStream.end(buffer);
    });

    if (isProfileImage && userId) {
      const user = await User.findById(userId);
      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      user.profileImage = {
        url: uploadResult.secure_url,
        publicId: uploadResult.public_id,
      };
      await user.save();
    }
    return NextResponse.json(
      {
        url: uploadResult.secure_url,
        publicId: uploadResult.public_id,
      },
      { status: 200 }
    );
  } catch (error) {
    console.log(error.message, "error.message");
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

    const imageExists = await cloudinary.api
      .resource(publicId, {
        resource_type: "image",
      })
      .catch(() => null);

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
