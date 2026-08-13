import dbConnect from "@/lib/db";
import SiteSetting from "@/models/SiteSetting";
import { decrypt } from "@/actions/encryption";

// Server-only — never import this into a client component. It returns the
// plaintext Shopify storefront password, so it must stay off the "use
// server" action surface that a browser could call directly.
export const SHOPIFY_STOREFRONT_PASSWORD_KEY = "shopifyStorefrontPassword";

export async function getShopifyStorefrontPassword() {
  await dbConnect();
  const setting = await SiteSetting.findOne({ key: SHOPIFY_STOREFRONT_PASSWORD_KEY }).lean();
  if (!setting?.value) return null;
  try {
    return decrypt(setting.value);
  } catch {
    return null;
  }
}

// Shopify's password-protected storefronts accept ?password=xxx on any
// storefront URL to bypass the wall (sets a cookie for the rest of the
// visit) — appends it to a URL if a password is configured, otherwise
// returns the URL untouched.
export function withStorefrontPassword(url, password) {
  if (!url || !password) return url;
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}password=${encodeURIComponent(password)}`;
}
