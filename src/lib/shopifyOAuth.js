import crypto from "crypto";
import dbConnect from "@/lib/db";
import ShopifyOAuthState from "@/models/ShopifyOAuthState";

// Shopify Admin API version for all NEW per-store OAuth code. The existing
// base-store sync in shopifyAction.js stays on its own version — this constant
// deliberately does not touch it.
export const SHOPIFY_OAUTH_API_VERSION = "2026-01";

// Authorization links stay valid for 7 days.
export const STATE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

const SHOP_DOMAIN_REGEX = /^[a-z0-9][a-z0-9-]*\.myshopify\.com$/;

/**
 * Accepts what a human might paste ("https://Foo.myshopify.com/", "foo") and
 * returns a canonical "foo.myshopify.com", or null if it can't be made valid.
 */
export function normalizeShopDomain(input) {
  if (typeof input !== "string") return null;

  let value = input.trim().toLowerCase();
  if (!value) return null;

  value = value.replace(/^https?:\/\//, "");
  value = value.replace(/\/.*$/, "");
  value = value.replace(/:\d+$/, "");

  // Bare handle -> full domain.
  if (!value.includes(".")) value = `${value}.myshopify.com`;

  return SHOP_DOMAIN_REGEX.test(value) ? value : null;
}

export function isValidShopDomain(input) {
  return normalizeShopDomain(input) !== null;
}

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is not configured on the server`);
  }
  return value;
}

// State tokens are signed with AUTH_SECRET — the app's existing general-purpose
// signing secret — so the flow needs no new secret to be provisioned.
function getStateSigningSecret() {
  return requireEnv("AUTH_SECRET");
}

function signPayload(encodedPayload) {
  return crypto
    .createHmac("sha256", getStateSigningSecret())
    .update(encodedPayload)
    .digest("base64url");
}

function timingSafeEqualStrings(a, b) {
  const bufA = Buffer.from(String(a));
  const bufB = Buffer.from(String(b));
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

/**
 * Builds "<base64url(payload)>.<base64url(hmac)>".
 */
function createStateToken(payload) {
  const encoded = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  return `${encoded}.${signPayload(encoded)}`;
}

/**
 * Verifies the signature and expiry of a state token. Throws on any problem.
 * Does NOT consult the database — see consumeStateToken for single-use.
 */
export function verifyStateToken(token) {
  if (typeof token !== "string" || !token.includes(".")) {
    throw new Error("Malformed state token");
  }

  const [encoded, signature] = token.split(".");
  if (!encoded || !signature) {
    throw new Error("Malformed state token");
  }

  if (!timingSafeEqualStrings(signature, signPayload(encoded))) {
    throw new Error("State token signature is invalid");
  }

  let payload;
  try {
    payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8"));
  } catch {
    throw new Error("State token payload is unreadable");
  }

  if (!payload?.nonce || !payload?.userId || !payload?.shopDomain) {
    throw new Error("State token is missing required fields");
  }

  if (typeof payload.expiresAt !== "number" || Date.now() > payload.expiresAt) {
    throw new Error("State token has expired");
  }

  return payload;
}

/**
 * Creates the Shopify authorization URL for one store owner + one shop, and
 * records the single-use nonce backing it.
 *
 * @param {object}  args
 * @param {string}  args.userId          store owner's User _id
 * @param {string}  args.shopDomain      shop domain (validated + normalized)
 * @param {string} [args.issuedByUserId] admin/developer generating the link
 */
export async function createShopifyAuthorizeUrl({ userId, shopDomain, issuedByUserId = null }) {
  const clientId = requireEnv("SHOPIFY_APP_CLIENT_ID");
  const redirectUri = requireEnv("SHOPIFY_OAUTH_REDIRECT_URI");
  const scopes = requireEnv("SHOPIFY_OAUTH_SCOPES");

  if (!userId) {
    throw new Error("userId is required");
  }

  const normalizedShop = normalizeShopDomain(shopDomain);
  if (!normalizedShop) {
    throw new Error(
      "shopDomain must be a valid Shopify domain, e.g. your-store.myshopify.com"
    );
  }

  const nonce = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + STATE_TTL_MS);

  await dbConnect();
  await ShopifyOAuthState.create({
    nonce,
    userId,
    shopDomain: normalizedShop,
    issuedByUserId,
    expiresAt,
  });

  const state = createStateToken({
    nonce,
    userId: String(userId),
    shopDomain: normalizedShop,
    expiresAt: expiresAt.getTime(),
  });

  const params = new URLSearchParams({
    client_id: clientId,
    scope: scopes,
    redirect_uri: redirectUri,
    state,
  });

  return {
    url: `https://${normalizedShop}/admin/oauth/authorize?${params.toString()}`,
    shopDomain: normalizedShop,
    expiresAt,
  };
}

/**
 * Verifies a state token AND atomically marks its nonce used, so a replayed
 * link cannot connect a second time. Throws if invalid, expired, unknown,
 * already used, or if the shop doesn't match the one the link was issued for.
 */
export async function consumeStateToken(token, shopFromCallback) {
  const payload = verifyStateToken(token);

  const normalizedShop = normalizeShopDomain(shopFromCallback);
  if (!normalizedShop) {
    throw new Error("Callback shop parameter is not a valid Shopify domain");
  }

  if (payload.shopDomain !== normalizedShop) {
    throw new Error("Callback shop does not match the shop this link was issued for");
  }

  await dbConnect();

  // Atomic claim: only the first callback flips used:false -> true.
  const claimed = await ShopifyOAuthState.findOneAndUpdate(
    { nonce: payload.nonce, used: false, expiresAt: { $gt: new Date() } },
    { $set: { used: true, usedAt: new Date() } },
    { new: true }
  );

  if (!claimed) {
    throw new Error(
      "This authorization link has already been used or has expired. Please request a new one."
    );
  }

  if (claimed.shopDomain !== normalizedShop) {
    throw new Error("Callback shop does not match the stored authorization request");
  }

  return {
    userId: String(claimed.userId),
    shopDomain: claimed.shopDomain,
  };
}

/**
 * Verifies the HMAC Shopify appends to the OAuth callback query string.
 * Message = all query params except `hmac`/`signature`, sorted by key and
 * joined as key=value with "&", signed with the app's client secret.
 */
export function verifyOAuthCallbackHmac(searchParams) {
  const clientSecret = requireEnv("SHOPIFY_APP_CLIENT_SECRET");

  const provided = searchParams.get("hmac");
  if (!provided) return false;

  // Shopify sorts lexicographically by key and uses the URL-decoded values
  // (so base64 "=" padding in `host` stays literal). Sort by key rather than
  // by the joined string so a future param whose key prefixes another can't
  // reorder the message.
  const pairs = [];
  for (const [key, value] of searchParams.entries()) {
    if (key === "hmac" || key === "signature") continue;
    pairs.push([key, value]);
  }
  pairs.sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));

  const message = pairs.map(([key, value]) => `${key}=${value}`).join("&");

  const digest = crypto
    .createHmac("sha256", clientSecret)
    .update(message)
    .digest("hex");

  return timingSafeEqualStrings(provided, digest);
}

/**
 * Exchanges the temporary OAuth code for a permanent Admin API access token.
 * Returns { accessToken, scope }. Never logs the token.
 */
export async function exchangeCodeForAccessToken({ shopDomain, code }) {
  const clientId = requireEnv("SHOPIFY_APP_CLIENT_ID");
  const clientSecret = requireEnv("SHOPIFY_APP_CLIENT_SECRET");

  const normalizedShop = normalizeShopDomain(shopDomain);
  if (!normalizedShop) {
    throw new Error("Invalid shop domain for token exchange");
  }

  // The token endpoint is intentionally unversioned in Shopify's OAuth spec.
  const response = await fetch(`https://${normalizedShop}/admin/oauth/access_token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      code,
    }),
  });

  if (!response.ok) {
    // Status only — the body can echo credentials back.
    throw new Error(`Shopify rejected the token exchange (HTTP ${response.status})`);
  }

  const data = await response.json().catch(() => null);
  if (!data?.access_token) {
    throw new Error("Shopify did not return an access token");
  }

  return {
    accessToken: data.access_token,
    scope: data.scope || "",
  };
}
