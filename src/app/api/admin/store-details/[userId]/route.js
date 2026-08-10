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

    const stringFields = [
      "address",
      "city",
      "state",
      "zipcode",
      "businessNumber",
      "storename",
      "firstname",
      "lastname",
      "phone",
    ];
    for (const field of stringFields) {
      if (typeof body[field] === "string") {
        update[field] = body[field].trim();
      }
    }

    if (typeof body.email === "string") {
      const email = body.email.trim().toLowerCase();
      if (!email) {
        return new Response(JSON.stringify({ error: "Email cannot be empty" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }
      const existing = await User.findOne({ email, _id: { $ne: userId } }).select("_id");
      if (existing) {
        return new Response(JSON.stringify({ error: "Email already in use by another account" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }
      update.email = email;
    }

    // A blank field means "clear this" — distinct from the field being
    // absent from the request entirely, which means "leave it alone".
    if (body.latitude !== undefined) {
      if (body.latitude === null || body.latitude === "") {
        update.latitude = null;
      } else {
        const lat = Number(body.latitude);
        if (Number.isNaN(lat) || lat < -90 || lat > 90) {
          return new Response(JSON.stringify({ error: "Invalid latitude" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }
        update.latitude = lat;
      }
    }

    if (body.longitude !== undefined) {
      if (body.longitude === null || body.longitude === "") {
        update.longitude = null;
      } else {
        const lng = Number(body.longitude);
        if (Number.isNaN(lng) || lng < -180 || lng > 180) {
          return new Response(JSON.stringify({ error: "Invalid longitude" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }
        update.longitude = lng;
      }
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
      "shopifyStoreCreated address city state zipcode businessNumber latitude longitude isVerified storename firstname lastname phone email"
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
