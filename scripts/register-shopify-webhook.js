/**
 * Register Shopify Webhook Script
 * Registers ORDERS_CREATE and INVENTORY_LEVELS_SET webhooks so Shopify notifies
 * your app when orders are placed and inventory changes.
 *
 * Usage: node --env-file=.env scripts/register-shopify-webhook.js [action]
 *
 * Actions:
 *   --register   Register webhooks (ORDERS_CREATE + INVENTORY_LEVELS_SET) (default)
 *   --update     Update existing webhook URLs to match current NEXT_PUBLIC_FRONTEND_LIVE_URL
 *   --list       List all registered webhooks
 *   --delete ID  Delete a webhook by its GID
 *
 * The webhook URL is built from NEXT_PUBLIC_FRONTEND_LIVE_URL in your .env:
 *   Local:  NEXT_PUBLIC_FRONTEND_LIVE_URL=http://localhost:3000
 *   Live:   NEXT_PUBLIC_FRONTEND_LIVE_URL=https://ree-gamma.vercel.app
 *
 * Requires env vars: SHOPIFY_STORE_DOMAIN, SHOPIFY_ADMIN_ACCESS_TOKEN, NEXT_PUBLIC_FRONTEND_LIVE_URL
 */

const axios = require("axios");

const shopifyStoreDomain = process.env.SHOPIFY_STORE_DOMAIN;
const shopifyAccessToken = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN;
const frontendUrl = process.env.NEXT_PUBLIC_FRONTEND_LIVE_URL;

if (!shopifyStoreDomain || !shopifyAccessToken) {
  console.error(
    "Missing env vars: SHOPIFY_STORE_DOMAIN, SHOPIFY_ADMIN_ACCESS_TOKEN",
  );
  process.exit(1);
}

if (!frontendUrl) {
  console.error("Missing env var: NEXT_PUBLIC_FRONTEND_LIVE_URL");
  process.exit(1);
}

const shopify = axios.create({
  baseURL: `https://${shopifyStoreDomain}/admin/api/2024-10/graphql.json`,
  headers: {
    "X-Shopify-Access-Token": shopifyAccessToken,
    "Content-Type": "application/json",
  },
});

const REGISTER_WEBHOOK = `
  mutation webhookSubscriptionCreate($topic: WebhookSubscriptionTopic!, $webhookSubscription: WebhookSubscriptionInput!) {
    webhookSubscriptionCreate(topic: $topic, webhookSubscription: $webhookSubscription) {
      webhookSubscription {
        id
        topic
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

const UPDATE_WEBHOOK = `
  mutation webhookSubscriptionUpdate($id: ID!, $webhookSubscription: WebhookSubscriptionInput!) {
    webhookSubscriptionUpdate(id: $id, webhookSubscription: $webhookSubscription) {
      webhookSubscription {
        id
        topic
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

const LIST_WEBHOOKS = `
  query {
    webhookSubscriptions(first: 25) {
      edges {
        node {
          id
          topic
          endpoint {
            __typename
            ... on WebhookHttpEndpoint {
              callbackUrl
            }
          }
        }
      }
    }
  }
`;

const DELETE_WEBHOOK = `
  mutation webhookSubscriptionDelete($id: ID!) {
    webhookSubscriptionDelete(id: $id) {
      deletedWebhookSubscriptionId
      userErrors {
        field
        message
      }
    }
  }
`;

async function registerWebhook() {
  const webhookUrl = `${frontendUrl}/api/shopify/webhook`;
  const topics = ["ORDERS_CREATE", "INVENTORY_LEVELS_SET"];

  for (const topic of topics) {
    console.log(`Registering ${topic} webhook...`);
    console.log(`Callback URL: ${webhookUrl}\n`);

    const response = await shopify.post("", {
      query: REGISTER_WEBHOOK,
      variables: {
        topic,
        webhookSubscription: {
          callbackUrl: webhookUrl,
          format: "JSON",
        },
      },
    });

    const result = response.data?.data?.webhookSubscriptionCreate;

    if (result?.userErrors?.length) {
      console.warn(`${topic}: ${result.userErrors.map((e) => e.message).join(", ")}`);
      continue;
    }

    const sub = result?.webhookSubscription;
    console.log(`${topic} registered successfully!`);
    console.log(`  ID:    ${sub?.id}`);
    console.log(`  Topic: ${sub?.topic}`);
    console.log(`  URL:   ${sub?.endpoint?.callbackUrl}\n`);
  }
}

async function updateWebhook() {
  const webhookUrl = `${frontendUrl}/api/shopify/webhook`;
  const topics = ["ORDERS_CREATE", "INVENTORY_LEVELS_SET"];

  console.log("Finding existing webhooks...\n");
  const listRes = await shopify.post("", { query: LIST_WEBHOOKS });
  const subscriptions = listRes.data?.data?.webhookSubscriptions?.edges || [];

  for (const topic of topics) {
    const existing = subscriptions.find(({ node }) => node.topic === topic);

    if (!existing) {
      console.log(`No existing ${topic} webhook found. Registering...\n`);
      const response = await shopify.post("", {
        query: REGISTER_WEBHOOK,
        variables: {
          topic,
          webhookSubscription: { callbackUrl: webhookUrl, format: "JSON" },
        },
      });
      const result = response.data?.data?.webhookSubscriptionCreate;
      if (result?.userErrors?.length) {
        console.warn(`${topic}: ${result.userErrors.map((e) => e.message).join(", ")}`);
      } else {
        console.log(`${topic} registered successfully!\n`);
      }
      continue;
    }

    const currentUrl = existing.node.endpoint?.callbackUrl;
    if (currentUrl === webhookUrl) {
      console.log(`${topic}: URL already up to date.\n`);
      continue;
    }

    console.log(`${topic}: Updating URL...`);
    console.log(`  Current: ${currentUrl}`);
    console.log(`  New:     ${webhookUrl}\n`);

    const response = await shopify.post("", {
      query: UPDATE_WEBHOOK,
      variables: {
        id: existing.node.id,
        webhookSubscription: { callbackUrl: webhookUrl, format: "JSON" },
      },
    });

    const result = response.data?.data?.webhookSubscriptionUpdate;
    if (result?.userErrors?.length) {
      console.error(`${topic} update failed:`);
      result.userErrors.forEach((e) => console.error(`  - ${e.message}`));
    } else {
      console.log(`${topic} updated successfully!\n`);
    }
  }
}

async function listWebhooks() {
  console.log("Fetching registered webhooks...\n");

  const response = await shopify.post("", {
    query: LIST_WEBHOOKS,
  });

  const subscriptions =
    response.data?.data?.webhookSubscriptions?.edges || [];

  if (subscriptions.length === 0) {
    console.log("No webhooks registered.");
    return;
  }

  console.log(`Found ${subscriptions.length} webhook(s):\n`);
  subscriptions.forEach(({ node }, i) => {
    console.log(`  ${i + 1}. Topic: ${node.topic}`);
    console.log(`     ID:    ${node.id}`);
    console.log(`     URL:   ${node.endpoint?.callbackUrl || "N/A"}`);
    console.log();
  });
}

async function deleteWebhook(id) {
  console.log(`Deleting webhook: ${id}\n`);

  const response = await shopify.post("", {
    query: DELETE_WEBHOOK,
    variables: { id },
  });

  const result = response.data?.data?.webhookSubscriptionDelete;

  if (result?.userErrors?.length) {
    console.error("Deletion failed:");
    result.userErrors.forEach((e) => console.error(`  - ${e.message}`));
    process.exit(1);
  }

  console.log("Webhook deleted successfully!");
  console.log(`  Deleted ID: ${result?.deletedWebhookSubscriptionId}`);
}

async function main() {
  const args = process.argv.slice(2);
  const action = args[0] || "--register";

  console.log(`NEXT_PUBLIC_FRONTEND_LIVE_URL = ${frontendUrl}\n`);

  switch (action) {
    case "--register":
      await registerWebhook();
      break;
    case "--update":
      await updateWebhook();
      break;
    case "--list":
      await listWebhooks();
      break;
    case "--delete":
      if (!args[1]) {
        console.error("Usage: --delete <webhook-gid>");
        process.exit(1);
      }
      await deleteWebhook(args[1]);
      break;
    default:
      console.error(`Unknown action: ${action}`);
      console.error(
        "Valid actions: --register, --list, --update, --delete <id>",
      );
      process.exit(1);
  }
}

main().catch((err) => {
  console.error("Script failed:", err.message);
  process.exit(1);
});
