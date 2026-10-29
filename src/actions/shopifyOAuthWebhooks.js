// Per-store webhook registration for shops connected through the Shopify
// OAuth app.
//
// This is deliberately separate from `shopifyWebhookActions.js`, which is
// hard-wired to the base store's env credentials and is used by the existing
// product-sync path. Nothing here touches that path.
//
// NOTE: not a "use server" module — it is called server-side from the OAuth
// callback route only, and must not be exposed as a callable server action.
import axios from "axios";
import { SHOPIFY_OAUTH_API_VERSION } from "@/lib/shopifyOAuth";

// GraphQL enums matching the topic strings `/api/shopify/webhook` already
// handles ("orders/create" and "inventory_levels/update").
//
// NOTE: there is NO `INVENTORY_LEVELS_SET` webhook topic in Shopify's Admin
// API — `inventory_levels/set` is a REST *action* endpoint, not a webhook
// event. Subscribing to that enum is rejected by GraphQL ("invalid value"),
// which is exactly why inventory registration used to come back as "error".
// The quantity-change event the handler consumes is INVENTORY_LEVELS_UPDATE,
// delivered with an `x-shopify-topic: inventory_levels/update` header.
const WEBHOOK_TOPICS = ["ORDERS_CREATE", "INVENTORY_LEVELS_UPDATE"];

const REGISTER_WEBHOOK = `
  mutation webhookSubscriptionCreate($topic: WebhookSubscriptionTopic!, $webhookSubscription: WebhookSubscriptionInput!) {
    webhookSubscriptionCreate(topic: $topic, webhookSubscription: $webhookSubscription) {
      webhookSubscription {
        id
        endpoint {
          __typename
          ... on WebhookHttpEndpoint {
            callbackUrl
          }
        }
      }
      userErrors {
        field
        message
      }
    }
  }
`;

/**
 * Works out the public callback URL Shopify should deliver webhooks to.
 * Shopify will not deliver to localhost or plain http, so we detect that up
 * front and skip registration with an actionable message instead of
 * registering something that silently never fires.
 */
export function resolvePublicWebhookUrl() {
  const base = process.env.PUBLIC_APP_URL;

  if (!base) {
    return { ok: false, reason: "PUBLIC_APP_URL is not set" };
  }

  let parsed;
  try {
    parsed = new URL(base);
  } catch {
    return { ok: false, reason: `PUBLIC_APP_URL is not a valid URL: ${base}` };
  }

  if (parsed.protocol !== "https:") {
    return {
      ok: false,
      reason: `PUBLIC_APP_URL must use https (got ${parsed.protocol.replace(":", "")})`,
    };
  }

  const host = parsed.hostname.toLowerCase();
  const isLocal =
    host === "localhost" ||
    host === "127.0.0.1" ||
    host === "::1" ||
    host === "[::1]" ||
    host.endsWith(".local");

  if (isLocal) {
    return { ok: false, reason: `PUBLIC_APP_URL points at a local address (${host})` };
  }

  return {
    ok: true,
    url: `${base.replace(/\/+$/, "")}/api/shopify/webhook`,
  };
}

/**
 * Registers orders/create + inventory_levels/update for one connected shop.
 *
 * Failures are reported, never thrown — a shop is still successfully connected
 * even if webhook registration can't complete (e.g. on localhost).
 *
 * @param {object} args
 * @param {string} args.shopDomain
 * @param {string} args.accessToken  never logged
 */
export async function registerWebhooksForStore({ shopDomain, accessToken }) {
  const target = resolvePublicWebhookUrl();

  if (!target.ok) {
    console.warn(
      `[shopify-oauth] Skipping webhook registration for ${shopDomain}: ${target.reason}. ` +
        `Set PUBLIC_APP_URL to a public HTTPS origin (e.g. an ngrok/Cloudflare tunnel or the deployed domain) ` +
        `and re-run the connection to subscribe orders/create and inventory_levels/update.`
    );
    return { skipped: true, reason: target.reason, results: [] };
  }

  if (!shopDomain || !accessToken) {
    return { skipped: true, reason: "Missing shop domain or access token", results: [] };
  }

  const client = axios.create({
    baseURL: `https://${shopDomain}/admin/api/${SHOPIFY_OAUTH_API_VERSION}/graphql.json`,
    headers: {
      "X-Shopify-Access-Token": accessToken,
      "Content-Type": "application/json",
    },
    timeout: 15000,
  });

  const results = [];

  for (const topic of WEBHOOK_TOPICS) {
    try {
      const response = await client.post("", {
        query: REGISTER_WEBHOOK,
        variables: {
          topic,
          webhookSubscription: { callbackUrl: target.url, format: "JSON" },
        },
      });

      const payload = response.data?.data?.webhookSubscriptionCreate;
      const userErrors = payload?.userErrors || [];

      if (response.data?.errors?.length) {
        results.push({
          topic,
          status: "error",
          error: response.data.errors.map((e) => e.message).join(", "),
        });
      } else if (userErrors.length) {
        // An existing identical subscription reports as a userError and is
        // harmless — re-connecting a shop shouldn't look like a failure.
        results.push({
          topic,
          status: "skipped",
          error: userErrors.map((e) => e.message).join(", "),
        });
      } else {
        results.push({
          topic,
          status: "registered",
          webhookId: payload?.webhookSubscription?.id || null,
        });
      }
    } catch (error) {
      // Log the message only — an access token must never reach the logs.
      results.push({ topic, status: "error", error: error.message });
    }
  }

  console.log(
    `[shopify-oauth] Webhook registration for ${shopDomain} -> ${target.url}:`,
    results
      .map((r) => (r.error ? `${r.topic}=${r.status} (${r.error})` : `${r.topic}=${r.status}`))
      .join(", ")
  );

  return { skipped: false, callbackUrl: target.url, results };
}
