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

// Verified against the live store: Shopify's password wall does NOT accept
// ?password=xxx as a query string on an arbitrary page — it's ignored and
// the visitor still lands on /password. The only way through is POSTing the
// password to /password, which sets a cookie in THAT VISITOR'S browser. We
// can't set that cookie for them from our server (cookies are scoped to the
// domain that sets them), so instead we route shared links through our own
// /go page, which does the POST client-side (in the visitor's own browser)
// before forwarding them on. Returns the URL untouched if no password is
// configured — nothing to bypass.
export function buildStorefrontLink(url, password) {
  if (!url || !password) return url;
  const base =
    process.env.NODE_ENV === "development"
      ? process.env.NEXT_PUBLIC_FRONTEND_URL
      : process.env.NEXT_PUBLIC_FRONTEND_LIVE_URL;
  if (!base) return url;
  return `${base}/go?to=${encodeURIComponent(url)}`;
}
