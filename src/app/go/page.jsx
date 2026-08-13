import { getShopifyStorefrontPassword } from "@/lib/shopifySettings";
import ShopifyUnlocker from "./ShopifyUnlocker";

export const metadata = {
  title: "Redirecting...",
};

function getAllowedShopifyHost() {
  return (process.env.SHOPIFY_STOREFRONT_DOMAIN || process.env.SHOPIFY_STORE_DOMAIN || "").toLowerCase();
}

// Intermediate "unlock" hop for links to the (possibly password-protected)
// Shopify storefront. Only ever forwards to the configured Shopify domain —
// never an arbitrary ?to=, so this can't be turned into an open redirect or
// leak the storefront password to somewhere unrelated.
export default async function GoPage({ searchParams }) {
  const { to } = await searchParams;
  const allowedHost = getAllowedShopifyHost();

  let destination = null;
  try {
    const parsed = new URL(to);
    if (allowedHost && parsed.hostname.toLowerCase() === allowedHost) {
      destination = parsed.toString();
    }
  } catch {
    destination = null;
  }

  if (!destination) {
    return (
      <div style={{ textAlign: "center", padding: "80px 20px", fontFamily: "sans-serif", color: "#555" }}>
        <p>This link is invalid.</p>
      </div>
    );
  }

  let password = null;
  try {
    password = await getShopifyStorefrontPassword();
  } catch {
    password = null;
  }

  return <ShopifyUnlocker destination={destination} password={password} shopifyHost={allowedHost} />;
}
