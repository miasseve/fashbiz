import crypto from "crypto";
import SsoCode from "@/models/SsoCode";

const CODE_TTL_MS = 2 * 60 * 1000; // 2 minutes — just long enough for the redirect round-trip

// Every origin a Discover SSO code may be sent to: the Discover web app
// (DISCOVER_APP_ORIGIN) plus an exact, comma-separated list of extras
// (DISCOVER_APP_EXTRA_ORIGINS) - e.g. https://lestores-ai.com for the mobile
// app's callback at /api/mobile/v1/auth/callback/<state>. Exact origins only:
// no wildcards, no prefix matching, no custom schemes.
function allowedDiscoverOrigins() {
  return [process.env.DISCOVER_APP_ORIGIN, ...(process.env.DISCOVER_APP_EXTRA_ORIGINS ?? "").split(",")]
    .map((o) => (o ?? "").trim())
    .filter(Boolean)
    .map((o) => {
      try {
        const url = new URL(o);
        return url.protocol === "https:" || url.protocol === "http:" ? url.origin : null;
      } catch {
        return null;
      }
    })
    .filter(Boolean);
}

// Shared open-redirect guard for the Discover SSO flow (login + signup).
// Only ever send the browser back to an allow-listed origin.
export function validateDiscoverRedirect(redirectUri) {
  const allowed = allowedDiscoverOrigins();
  if (!allowed.length) {
    return { ok: false, status: 500, error: "Discover connection is not configured" };
  }
  let redirectOrigin;
  try {
    redirectOrigin = new URL(redirectUri).origin;
  } catch {
    return { ok: false, status: 400, error: "Invalid redirect" };
  }
  if (!allowed.includes(redirectOrigin)) {
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
