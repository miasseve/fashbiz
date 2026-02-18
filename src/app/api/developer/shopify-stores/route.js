import { auth } from "@/auth";
import dbConnect from "@/lib/db";
import ShopifyStore from "@/models/ShopifyStore";
import User from "@/models/User";
import { encrypt } from "@/actions/encryption";

function maskToken(token) {
  if (!token || token.length < 8) return "****";
  return `****${token.slice(-4)}`;
}

export async function GET() {
  try {
    const session = await auth();
    if (!session || session.user.role !== "developer") {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    await dbConnect();

    const stores = await ShopifyStore.find()
      .sort({ createdAt: -1 })
      .lean();

    // Populate user info and mask tokens
    const storeUsers = await User.find(
      { _id: { $in: stores.map((s) => s.userId).filter(Boolean) } },
      "firstname lastname storename email"
    ).lean();

    const userMap = {};
    storeUsers.forEach((u) => { userMap[u._id.toString()] = u; });

    const result = stores.map((s) => ({
      _id: s._id,
      storeDomain: s.storeDomain,
      isBaseStore: s.isBaseStore,
      isActive: s.isActive,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
      userId: s.userId,
      user: s.userId ? userMap[s.userId.toString()] || null : null,
      accessTokenMasked: maskToken(s.accessToken),
      apiSecretMasked: maskToken(s.apiSecret),
    }));

    return new Response(JSON.stringify({ stores: result }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Developer shopify-stores GET error:", error);
    return new Response(JSON.stringify({ error: "Something went wrong" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export async function POST(request) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "developer") {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { userId, storeDomain, accessToken, apiSecret, isBaseStore } =
      await request.json();

    if (!storeDomain || !accessToken || !apiSecret) {
      return new Response(
        JSON.stringify({ error: "storeDomain, accessToken, and apiSecret are required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    await dbConnect();

    const store = await ShopifyStore.create({
      userId: userId || null,
      storeDomain: storeDomain.trim().toLowerCase(),
      accessToken: encrypt(accessToken),
      apiSecret: encrypt(apiSecret),
      isBaseStore: !!isBaseStore,
    });

    return new Response(
      JSON.stringify({
        store: {
          _id: store._id,
          storeDomain: store.storeDomain,
          isBaseStore: store.isBaseStore,
          isActive: store.isActive,
          createdAt: store.createdAt,
          accessTokenMasked: maskToken(accessToken),
          apiSecretMasked: maskToken(apiSecret),
        },
      }),
      { status: 201, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    if (error.code === 11000) {
      return new Response(
        JSON.stringify({ error: "A store with this domain already exists" }),
        { status: 409, headers: { "Content-Type": "application/json" } }
      );
    }
    console.error("Developer shopify-stores POST error:", error);
    return new Response(JSON.stringify({ error: "Something went wrong" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
