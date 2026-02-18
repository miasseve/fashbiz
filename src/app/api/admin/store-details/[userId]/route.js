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
        "firstname lastname email role storename phone country city businessNumber isActive isProfileComplete subscriptionType subscriptionStart subscriptionEnd soldNotifications shopifyStoreCreated branding createdAt profileImage"
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

    const updated = await User.findByIdAndUpdate(
      userId,
      { shopifyStoreCreated: body.shopifyStoreCreated },
      { new: true }
    ).select("shopifyStoreCreated");

    if (!updated) {
      return new Response(JSON.stringify({ error: "User not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({ shopifyStoreCreated: updated.shopifyStoreCreated }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Admin store-details PATCH error:", error);
    return new Response(JSON.stringify({ error: "Something went wrong" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
