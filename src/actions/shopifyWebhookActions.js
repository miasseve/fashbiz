"use server";
import axios from "axios";

const shopifyStoreDomain = process.env.SHOPIFY_STORE_DOMAIN;
const shopifyAccessToken = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN;

const shopify = axios.create({
  baseURL: `https://${shopifyStoreDomain}/admin/api/2024-10/graphql.json`,
  headers: {
    "X-Shopify-Access-Token": shopifyAccessToken,
    "Content-Type": "application/json",
  },
});

export async function registerShopifyWebhooks() {
  const webhookUrl = `${process.env.NEXT_PUBLIC_FRONTEND_LIVE_URL || process.env.NEXT_PUBLIC_FRONTEND_URL}/api/shopify/webhook`;

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

  try {
    const response = await shopify.post("", {
      query: REGISTER_WEBHOOK,
      variables: {
        topic: "ORDERS_CREATE",
        webhookSubscription: {
          callbackUrl: webhookUrl,
          format: "JSON",
        },
      },
    });

    const result = response.data?.data?.webhookSubscriptionCreate;

    if (result?.userErrors?.length) {
      return {
        status: 400,
        error: result.userErrors.map((e) => e.message).join(", "),
      };
    }

    return {
      status: 200,
      message: "Webhook registered successfully",
      webhookId: result?.webhookSubscription?.id,
    };
  } catch (error) {
    return {
      status: 500,
      error: error.message,
    };
  }
}

export async function listShopifyWebhooks() {
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

  try {
    const response = await shopify.post("", {
      query: LIST_WEBHOOKS,
    });

    const subscriptions =
      response.data?.data?.webhookSubscriptions?.edges || [];

    return {
      status: 200,
      webhooks: subscriptions.map(({ node }) => ({
        id: node.id,
        topic: node.topic,
        callbackUrl: node.endpoint?.callbackUrl,
      })),
    };
  } catch (error) {
    return {
      status: 500,
      error: error.message,
    };
  }
}
