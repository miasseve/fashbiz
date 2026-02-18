import { auth } from "@/auth";
import dbConnect from "@/lib/db";
import ShopifyStore from "@/models/ShopifyStore";
import { encrypt } from "@/actions/encryption";

function maskToken(token) {
  if (!token || token.length < 8) return "****";
  return `****${token.slice(-4)}`;
}

export async function PUT(request, { params }) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "developer") {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { storeId } = await params;
    const { userId, storeDomain, accessToken, apiSecret, isBaseStore, isActive } =
      await request.json();

    await dbConnect();

    const existing = await ShopifyStore.findById(storeId);
    if (!existing) {
      return new Response(JSON.stringify({ error: "Store not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    const updates = {};
    if (storeDomain) updates.storeDomain = storeDomain.trim().toLowerCase();
    if (typeof isBaseStore === "boolean") updates.isBaseStore = isBaseStore;
    if (typeof isActive === "boolean") updates.isActive = isActive;
    if (userId !== undefined) updates.userId = userId || null;

    // Only re-encrypt if a new token was provided (non-empty string)
    if (accessToken && accessToken.trim() !== "") {
      updates.accessToken = encrypt(accessToken.trim());
    }
    if (apiSecret && apiSecret.trim() !== "") {
      updates.apiSecret = encrypt(apiSecret.trim());
    }

    const updated = await ShopifyStore.findByIdAndUpdate(storeId, updates, {
      new: true,
    });

    return new Response(
      JSON.stringify({
        store: {
          _id: updated._id,
          storeDomain: updated.storeDomain,
          isBaseStore: updated.isBaseStore,
          isActive: updated.isActive,
          updatedAt: updated.updatedAt,
          accessTokenMasked: maskToken(updated.accessToken),
          apiSecretMasked: maskToken(updated.apiSecret),
        },
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    if (error.code === 11000) {
      return new Response(
        JSON.stringify({ error: "A store with this domain already exists" }),
        { status: 409, headers: { "Content-Type": "application/json" } }
      );
    }
    console.error("Developer shopify-stores PUT error:", error);
    return new Response(JSON.stringify({ error: "Something went wrong" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export async function DELETE(request, { params }) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "developer") {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { storeId } = await params;
    await dbConnect();

    const deleted = await ShopifyStore.findByIdAndDelete(storeId);
    if (!deleted) {
      return new Response(JSON.stringify({ error: "Store not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Developer shopify-stores DELETE error:", error);
    return new Response(JSON.stringify({ error: "Something went wrong" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
