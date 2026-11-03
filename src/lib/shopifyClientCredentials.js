// Access tokens for stores connected with their OWN Shopify app
// (connectedVia "client_credentials").
//
// The store creates an app in its own Shopify Dev Dashboard, installs it, and
// gives us the app's Client ID and Client Secret. Shopify then issues an Admin
// API token for that store through the client credentials grant. The token
// lasts 24 hours; there is no refresh token — a new one is simply requested
// with the same Client ID and Secret.
//
// Shopify only issues this token when the app and the store belong to the
// same Shopify organization.
//
// NOTE: not a "use server" module — it handles secrets and must never be
// callable from the browser.
import { normalizeShopDomain } from "@/lib/shopifyOAuth";

// Renew this long before the token runs out, so a long request never starts
// with a token that expires halfway through.
export const TOKEN_RENEW_MARGIN_MS = 60 * 60 * 1000;

const TOKEN_REQUEST_TIMEOUT_MS = 15000;

/**
 * Error from the token request. `permanent` is true when Shopify refused the
 * credentials themselves (wrong ID/secret, app removed, different
 * organization) — retrying won't help and the connection must be redone.
 */
export class ClientCredentialsError extends Error {
  constructor(message, { permanent = false, httpStatus = null } = {}) {
    super(message);
    this.name = "ClientCredentialsError";
    this.permanent = permanent;
    this.httpStatus = httpStatus;
  }
}

/**
 * Requests a new Admin API token for one store.
 * Never logs the secret or the token.
 *
 * @returns {Promise<{ accessToken: string, scope: string, expiresAt: Date }>}
 */
export async function requestClientCredentialsToken({ shopDomain, clientId, clientSecret }) {
  const shop = normalizeShopDomain(shopDomain);
  if (!shop) throw new ClientCredentialsError("Invalid shop domain", { permanent: true });
  if (!clientId || !clientSecret) {
    throw new ClientCredentialsError("Client ID and Client Secret are required", { permanent: true });
  }

  let response;
  try {
    response = await fetch(`https://${shop}/admin/oauth/access_token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
      },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        client_id: clientId,
        client_secret: clientSecret,
      }).toString(),
      signal: AbortSignal.timeout(TOKEN_REQUEST_TIMEOUT_MS),
    });
  } catch (networkError) {
    throw new ClientCredentialsError(`Could not reach Shopify: ${networkError.message}`);
  }

  if (!response.ok) {
    // Status only — the body can echo credentials back.
    const permanent = response.status >= 400 && response.status < 500 && response.status !== 429;
    throw new ClientCredentialsError(
      permanent
        ? `Shopify refused the app credentials (HTTP ${response.status}). Check the Client ID and Secret, that the app is installed on this store, and that the app was created in the same Shopify organization as the store.`
        : `Shopify token request failed (HTTP ${response.status})`,
      { permanent, httpStatus: response.status }
    );
  }

  const data = await response.json().catch(() => null);
  if (!data?.access_token) {
    throw new ClientCredentialsError("Shopify did not return an access token");
  }

  const expiresInSeconds = Number(data.expires_in) || 24 * 60 * 60;
  return {
    accessToken: data.access_token,
    scope: data.scope || "",
    expiresAt: new Date(Date.now() + expiresInSeconds * 1000),
  };
}

/** True when a token expiring at `expiresAt` should be renewed now. */
export function tokenNeedsRenewal(expiresAt, now = Date.now()) {
  if (!expiresAt) return false;
  return new Date(expiresAt).getTime() - now < TOKEN_RENEW_MARGIN_MS;
}
