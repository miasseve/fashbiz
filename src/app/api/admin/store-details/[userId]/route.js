import { auth } from "@/auth";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import Product from "@/models/Product";

export async function GET(request, { params }) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "admin" && session.user.role !== "developer") {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { userId } = await params;
    await dbConnect();

    const user = await User.findById(userId)
      .select(
        "firstname lastname email role storename phone country city address state zipcode latitude longitude businessNumber isActive isVerified isProfileComplete subscriptionType subscriptionStart subscriptionEnd soldNotifications shopifyStoreCreated branding createdAt profileImage"
      )
      .lean();

    if (!user) {
      return new Response(JSON.stringify({ error: "User not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Fetch product stats for this user
    const totalProducts = await Product.countDocuments({ userId });
    const shopifySyncedProducts = await Product.countDocuments({
      userId,
      shopifyProductId: { $exists: true, $ne: "" },
    });
    const soldProducts = await Product.countDocuments({ userId, sold: true });

    return new Response(
      JSON.stringify({
        user,
        productStats: {
          total: totalProducts,
          shopifySynced: shopifySyncedProducts,
          sold: soldProducts,
          shopifyConnected: shopifySyncedProducts > 0,
        },
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Admin store-details error:", error);
    return new Response(JSON.stringify({ error: "Something went wrong" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export async function PATCH(request, { params }) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "admin" && session.user.role !== "developer") {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { userId } = await params;
    const body = await request.json();
    await dbConnect();

    const update = {};

    if (typeof body.shopifyStoreCreated === "boolean") {
      update.shopifyStoreCreated = body.shopifyStoreCreated;
    }

    const stringFields = ["address", "city", "state", "zipcode", "businessNumber"];
    for (const field of stringFields) {
      if (typeof body[field] === "string") {
        update[field] = body[field].trim();
      }
    }

    if (body.latitude !== undefined && body.latitude !== null && body.latitude !== "") {
      const lat = Number(body.latitude);
      if (Number.isNaN(lat) || lat < -90 || lat > 90) {
        return new Response(JSON.stringify({ error: "Invalid latitude" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }
      update.latitude = lat;
    }

    if (body.longitude !== undefined && body.longitude !== null && body.longitude !== "") {
      const lng = Number(body.longitude);
      if (Number.isNaN(lng) || lng < -180 || lng > 180) {
        return new Response(JSON.stringify({ error: "Invalid longitude" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }
      update.longitude = lng;
    }

    if (typeof body.isVerified === "boolean") {
      update.isVerified = body.isVerified;
    }

    if (Object.keys(update).length === 0) {
      return new Response(JSON.stringify({ error: "No valid fields to update" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const updated = await User.findByIdAndUpdate(userId, update, {
      new: true,
      runValidators: true,
    }).select(
      "shopifyStoreCreated address city state zipcode businessNumber latitude longitude isVerified"
    );

    if (!updated) {
      return new Response(JSON.stringify({ error: "User not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(updated), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Admin store-details PATCH error:", error);
    return new Response(JSON.stringify({ error: "Something went wrong" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
