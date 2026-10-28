import dbConnect from "@/lib/db";
import ShopifyStore from "@/models/ShopifyStore";
import { encrypt } from "@/actions/encryption";
import {
  consumeStateToken,
  exchangeCodeForAccessToken,
  normalizeShopDomain,
  verifyOAuthCallbackHmac,
} from "@/lib/shopifyOAuth";
import { registerWebhooksForStore } from "@/actions/shopifyOAuthWebhooks";

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderPage({ ok, heading, message, detail = "", status }) {
  const accent = ok ? "#0f7b3d" : "#b3261e";
  const badge = ok ? "Connected" : "Not connected";

  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${ok ? "Shopify connected" : "Shopify connection failed"}</title>
    <style>
      body { margin:0; min-height:100vh; display:flex; align-items:center; justify-content:center;
             background:#f6f7f9; font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif; padding:24px; }
      .card { background:#fff; max-width:560px; width:100%; border:1px solid #e5e7eb; border-radius:14px;
              padding:32px; box-shadow:0 1px 3px rgba(0,0,0,.06); }
      .badge { display:inline-block; font-size:12px; font-weight:700; letter-spacing:.04em; text-transform:uppercase;
               color:${accent}; border:1px solid ${accent}33; background:${accent}11; border-radius:999px; padding:4px 10px; }
      h1 { font-size:22px; margin:16px 0 8px; color:#111827; }
      p { color:#4b5563; line-height:1.6; margin:0 0 12px; font-size:15px; }
      .detail { margin-top:16px; padding:12px 14px; background:#f9fafb; border:1px solid #e5e7eb;
                border-radius:8px; font-family:ui-monospace,SFMono-Regular,Menlo,monospace; font-size:13px; color:#374151;
                word-break:break-word; }
    </style>
  </head>
  <body>
    <div class="card">
      <span class="badge">${badge}</span>
      <h1>${escapeHtml(heading)}</h1>
      <p>${escapeHtml(message)}</p>
      ${detail ? `<div class="detail">${escapeHtml(detail)}</div>` : ""}
    </div>
  </body>
</html>`;

  return new Response(html, {
    status,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

function failure(message, { detail = "", status = 400 } = {}) {
  return renderPage({
    ok: false,
    heading: "We couldn't connect this Shopify store",
    message,
    detail,
    status,
  });
}

/**
 * GET /api/shopify/oauth/callback
 *
 * Shopify redirects the store owner here after they approve the app.
 * Verifies the request, exchanges the code for a token, and stores an
 * encrypted per-store connection.
 *
 * Reachable without a session by design (the store owner may not be logged
 * into leStores). src/proxy.js excludes /api from its matcher, so no
 * middleware change is needed.
 */
export async function GET(request) {
  const { searchParams } = new URL(request.url);

  const shopParam = searchParams.get("shop");
  const code = searchParams.get("code");
  const state = searchParams.get("state");

  try {
    if (!shopParam || !code || !state) {
      return failure(
        "The authorization link was incomplete. Please ask your leStores contact for a new link."
      );
    }

    const shopDomain = normalizeShopDomain(shopParam);
    if (!shopDomain) {
      return failure("The Shopify store address in this link isn't valid.");
    }

    // 1. Prove the redirect really came from Shopify.
    if (!verifyOAuthCallbackHmac(searchParams)) {
      return failure(
        "This link could not be verified as coming from Shopify, so it was rejected.",
        { status: 401 }
      );
    }

    // 2. Validate + atomically burn the single-use state token.
    let claim;
    try {
      claim = await consumeStateToken(state, shopDomain);
    } catch (stateError) {
      return failure(stateError.message, { status: 400 });
    }

    // 3. Trade the code for a permanent Admin API token.
    let accessToken;
    let grantedScopes;
    try {
      const exchanged = await exchangeCodeForAccessToken({ shopDomain, code });
      accessToken = exchanged.accessToken;
      grantedScopes = exchanged.scope;
    } catch (exchangeError) {
      console.error(
        `[shopify-oauth] Token exchange failed for ${shopDomain}:`,
        exchangeError.message
      );
      return failure(
        "Shopify wouldn't complete the authorization. Please request a fresh link and try again.",
        { status: 502 }
      );
    }

    await dbConnect();

    // 4. Safety guards — never touch a record this flow doesn't own.
    const existing = await ShopifyStore.findOne({ storeDomain: shopDomain });

    if (existing?.isBaseStore) {
      console.error(
        `[shopify-oauth] Refusing to overwrite the base store record for ${shopDomain}.`
      );
      return failure(
        "This Shopify store is already configured as the platform's base store and can't be reconnected here.",
        { status: 409 }
      );
    }

    if (existing?.userId && String(existing.userId) !== String(claim.userId)) {
      console.error(
        `[shopify-oauth] Refusing to reassign ${shopDomain} to a different store owner.`
      );
      return failure(
        "This Shopify store is already connected to a different leStores account. Please contact support.",
        { status: 409 }
      );
    }

    // 5. Save the connection. The app's client secret is stored as this
    //    store's apiSecret so the existing webhook route — which resolves a
    //    per-store secret by shop domain — verifies this shop's webhooks
    //    without any change to how lestoresweb's webhooks are handled.
    const appClientSecret = process.env.SHOPIFY_APP_CLIENT_SECRET;

    await ShopifyStore.findOneAndUpdate(
      { storeDomain: shopDomain },
      {
        $set: {
          userId: claim.userId,
          storeDomain: shopDomain,
          accessToken: encrypt(accessToken),
          ...(appClientSecret ? { apiSecret: encrypt(appClientSecret) } : {}),
          isBaseStore: false,
          isActive: true,
          status: "connected",
          connectedVia: "oauth",
          appClientId: process.env.SHOPIFY_APP_CLIENT_ID || null,
          grantedScopes: grantedScopes || "",
          connectedAt: new Date(),
          lastConnectionError: "",
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    console.log(
      `[shopify-oauth] Connected ${shopDomain} for user ${claim.userId} (scopes: ${grantedScopes || "none reported"})`
    );

    // 6. Webhooks are best-effort — a localhost PUBLIC_APP_URL must not fail
    //    an otherwise-successful connection.
    let webhookNote = "";
    try {
      const outcome = await registerWebhooksForStore({ shopDomain, accessToken });
      if (outcome.skipped) {
        webhookNote = `Webhooks not registered: ${outcome.reason}. Set PUBLIC_APP_URL to a public HTTPS origin and reconnect to enable order/inventory sync.`;
      } else {
        webhookNote = `Webhooks: ${outcome.results
          .map((r) => `${r.topic} ${r.status}`)
          .join(", ")}`;
      }
    } catch (webhookError) {
      webhookNote = `Webhook registration could not be completed: ${webhookError.message}`;
      console.error(
        `[shopify-oauth] Webhook registration threw for ${shopDomain}:`,
        webhookError.message
      );
    }

    return renderPage({
      ok: true,
      heading: "Shopify store connected",
      message: `${shopDomain} is now connected to leStores. You can close this window.`,
      detail: webhookNote,
      status: 200,
    });
  } catch (error) {
    console.error("[shopify-oauth] Callback error:", error.message);
    return failure("Something went wrong while connecting this store.", {
      status: 500,
    });
  }
}
