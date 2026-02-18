"use server";
import { auth } from "@/auth";
import dbConnect from "@/lib/db";
import User from "@/models/User";

export async function updateBranding(brandingData) {
  try {
    const session = await auth();
    if (!session) {
      return { status: 401, error: "Not authenticated" };
    }

    await dbConnect();

    const {
      logoUrl,
      logoPublicId,
      primaryColor,
      secondaryColor,
      accentColor,
      storeDescription,
      socialLinks,
    } = brandingData;

    const branding = {
      logoUrl: logoUrl || "",
      logoPublicId: logoPublicId || "",
      primaryColor: primaryColor || "#000000",
      secondaryColor: secondaryColor || "#ffffff",
      accentColor: accentColor || "#ff6b6b",
      storeDescription: storeDescription || "",
      socialLinks: {
        instagram: socialLinks?.instagram || "",
        facebook: socialLinks?.facebook || "",
        website: socialLinks?.website || "",
      },
    };

    await User.findByIdAndUpdate(session.user.id, { branding });

    return { status: 200, message: "Branding updated successfully" };
  } catch (error) {
    return { status: 500, error: error.message };
  }
}

export async function getBranding() {
  try {
    const session = await auth();
    if (!session) {
      return { status: 401, error: "Not authenticated" };
    }

    await dbConnect();
    const user = await User.findById(session.user.id).select(
      "branding storename profileImage",
    );

    return {
      status: 200,
      data: JSON.stringify(user),
    };
  } catch (error) {
    return { status: 500, error: error.message };
  }
}

// Save branding AND apply to Shopify theme in one operation
export async function saveAndApplyBranding(brandingData) {
  const saveResult = await updateBranding(brandingData);
  if (saveResult.status !== 200) return saveResult;

  const { applyBrandingToTheme } = await import("./shopifyThemeActions");
  const applyResult = await applyBrandingToTheme();
  return applyResult;
}
