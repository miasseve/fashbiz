import axios from "axios";
import { requireApiKey, handlePreflight } from "@/lib/apiKeyMiddleware";

export async function OPTIONS() {
  return handlePreflight();
}

// Temporary diagnostic: checks what access scopes the existing Shopify
// Admin API token actually has (specifically whether it can read/write
// theme files), so we know whether a theme-code fix for the password-wall
// redirect is achievable with what's already configured, or needs a new
// token requested from Mia's Shopify admin.
export async function GET(req) {
  const unauthorized = requireApiKey(req);
  if (unauthorized) return unauthorized;

  const shopifyStoreDomain = process.env.SHOPIFY_STORE_DOMAIN;
  const shopifyAccessToken = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN;

  const shopify = axios.create({
    baseURL: `https://${shopifyStoreDomain}/admin/api/2024-10/graphql.json`,
    headers: { "X-Shopify-Access-Token": shopifyAccessToken, "Content-Type": "application/json" },
  });

  try {
    const res = await shopify.post("", {
      query: `query { currentAppInstallation { accessScopes { handle } } }`,
    });
    const scopes = res.data?.data?.currentAppInstallation?.accessScopes?.map((s) => s.handle) || [];
    return Response.json({
      ok: true,
      scopes,
      hasReadThemes: scopes.includes("read_themes"),
      hasWriteThemes: scopes.includes("write_themes"),
      errors: res.data?.errors || null,
    });
  } catch (error) {
    return Response.json({ ok: false, error: error.message, details: error.response?.data }, { status: 500 });
  }
}
