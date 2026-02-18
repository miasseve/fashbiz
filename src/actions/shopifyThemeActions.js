"use server";
import axios from "axios";
import { auth } from "@/auth";
import dbConnect from "@/lib/db";
import User from "@/models/User";

const shopifyStoreDomain = process.env.SHOPIFY_STORE_DOMAIN;
const shopifyAccessToken = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN;

const shopifyRest = axios.create({
  baseURL: `https://${shopifyStoreDomain}/admin/api/2024-10`,
  headers: {
    "X-Shopify-Access-Token": shopifyAccessToken,
    "Content-Type": "application/json",
  },
});

export async function getActiveTheme() {
  try {
    const response = await shopifyRest.get("/themes.json");
    const themes = response.data.themes;
    return themes.find((t) => t.role === "main");
  } catch (error) {
    console.error("Failed to fetch active theme:", error.message);
    return null;
  }
}

// Shared helper: applies branding from a user object to the active Shopify theme
async function _applyBrandingForUser(user) {
  if (!user?.branding) {
    return { status: 400, error: "No branding data configured" };
  }

  const activeTheme = await getActiveTheme();
  if (!activeTheme) {
    return { status: 500, error: "No active theme found" };
  }

  // Fetch current settings_data.json
  const settingsRes = await shopifyRest.get(
    `/themes/${activeTheme.id}/assets.json`,
    {
      params: { "asset[key]": "config/settings_data.json" },
    },
  );

  let settingsData;
  try {
    settingsData = JSON.parse(settingsRes.data.asset.value);
  } catch {
    return { status: 500, error: "Failed to parse theme settings" };
  }

  // Update theme settings with branding values
  const current = settingsData.current || {};

  // Colors
  current.colors_solid_button_labels =
    user.branding.secondaryColor || "#ffffff";
  current.colors_accent_1 = user.branding.accentColor || "#ff6b6b";
  current.colors_text = user.branding.primaryColor || "#000000";
  current.colors_background_1 = user.branding.secondaryColor || "#ffffff";
  current.colors_outline_button_labels =
    user.branding.primaryColor || "#000000";

  // Social links
  if (user.branding.socialLinks?.instagram) {
    current.social_instagram_link = user.branding.socialLinks.instagram;
  }
  if (user.branding.socialLinks?.facebook) {
    current.social_facebook_link = user.branding.socialLinks.facebook;
  }
  if (user.branding.socialLinks?.website) {
    current.social_twitter_link = user.branding.socialLinks.website;
  }

  settingsData.current = current;

  // Write updated settings back
  await shopifyRest.put(`/themes/${activeTheme.id}/assets.json`, {
    asset: {
      key: "config/settings_data.json",
      value: JSON.stringify(settingsData),
    },
  });

  // Upload logo to theme assets if available
  if (user.branding.logoUrl) {
    try {
      await shopifyRest.put(`/themes/${activeTheme.id}/assets.json`, {
        asset: {
          key: "assets/store-logo.png",
          src: user.branding.logoUrl,
        },
      });
    } catch (logoErr) {
      console.error("Failed to upload logo to theme:", logoErr.message);
    }
  }

  return { status: 200, message: "Theme branding applied successfully" };
}

// Apply branding using current authenticated user session
export async function applyBrandingToTheme() {
  try {
    const session = await auth();
    if (!session) {
      return { status: 401, error: "Not authenticated" };
    }

    await dbConnect();
    const user = await User.findById(session.user.id).select(
      "branding storename phone address city",
    );

    return await _applyBrandingForUser(user);
  } catch (error) {
    return { status: 500, error: error.message };
  }
}

// Apply branding using a userId directly (for webhook/server context where no session exists)
export async function applyBrandingToThemeForUser(userId) {
  try {
    await dbConnect();
    const user = await User.findById(userId).select(
      "branding storename phone address city",
    );

    if (!user) {
      return { status: 404, error: "User not found" };
    }

    return await _applyBrandingForUser(user);
  } catch (error) {
    return { status: 500, error: error.message };
  }
}

export async function setupStoreTheme() {
  try {
    const session = await auth();
    if (!session) {
      return { status: 401, error: "Not authenticated" };
    }

    await dbConnect();
    const user = await User.findById(session.user.id).select(
      "branding storename",
    );

    // Look for a template theme
    const themesRes = await shopifyRest.get("/themes.json");
    const templateTheme = themesRes.data.themes.find((t) =>
      t.name.startsWith("REE-Template"),
    );

    if (!templateTheme) {
      return {
        status: 400,
        error:
          "Template theme not found. An admin needs to create a theme named 'REE-Template' first.",
      };
    }

    // Apply branding to the current active theme
    const result = await applyBrandingToTheme();
    return result;
  } catch (error) {
    return { status: 500, error: error.message };
  }
}
