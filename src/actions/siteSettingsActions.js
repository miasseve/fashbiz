"use server";

import { auth } from "@/auth";
import dbConnect from "@/lib/db";
import SiteSetting from "@/models/SiteSetting";
import { encrypt } from "@/actions/encryption";
import { SHOPIFY_STOREFRONT_PASSWORD_KEY } from "@/lib/shopifySettings";

function requireAdmin(session) {
  return session && (session.user.role === "admin" || session.user.role === "developer");
}

export async function setShopifyStorefrontPassword(password) {
  const session = await auth();
  if (!requireAdmin(session)) {
    return { status: 401, error: "Unauthorized" };
  }

  try {
    await dbConnect();
    const trimmed = (password || "").trim();

    if (!trimmed) {
      await SiteSetting.deleteOne({ key: SHOPIFY_STOREFRONT_PASSWORD_KEY });
      return { status: 200 };
    }

    await SiteSetting.findOneAndUpdate(
      { key: SHOPIFY_STOREFRONT_PASSWORD_KEY },
      { value: encrypt(trimmed) },
      { upsert: true },
    );
    return { status: 200 };
  } catch (error) {
    // Temporary: surface the real error instead of a bare digest so this
    // can be root-caused from the UI without Vercel log access.
    console.error("setShopifyStorefrontPassword failed:", error);
    return { status: 500, error: error.message };
  }
}

export async function hasShopifyStorefrontPassword() {
  const session = await auth();
  if (!requireAdmin(session)) {
    return { status: 401, error: "Unauthorized" };
  }

  await dbConnect();
  const setting = await SiteSetting.findOne({ key: SHOPIFY_STOREFRONT_PASSWORD_KEY }).select("_id");
  return { status: 200, isSet: !!setting };
}
