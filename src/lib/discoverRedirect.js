import crypto from "crypto";
import SsoCode from "@/models/SsoCode";

const CODE_TTL_MS = 2 * 60 * 1000; // 2 minutes — just long enough for the redirect round-trip

// Shared open-redirect guard for the Discover SSO flow (login + signup).
// Only ever send the browser back to Discover's own real origin.
export function validateDiscoverRedirect(redirectUri) {
  const allowedOrigin = process.env.DISCOVER_APP_ORIGIN;
  if (!allowedOrigin) {
    return { ok: false, status: 500, error: "Discover connection is not configured" };
  }
  let redirectOrigin;
  try {
    redirectOrigin = new URL(redirectUri).origin;
  } catch {
    return { ok: false, status: 400, error: "Invalid redirect" };
  }
  if (redirectOrigin !== new URL(allowedOrigin).origin) {
    return { ok: false, status: 400, error: "Invalid redirect" };
  }
  return { ok: true };
}

/** Mints the one-time code Discover exchanges for this user's identity. */
export async function issueSsoCode(userId) {
  const code = crypto.randomUUID();
  await SsoCode.create({ code, userId, expiresAt: new Date(Date.now() + CODE_TTL_MS) });
  return code;
}
