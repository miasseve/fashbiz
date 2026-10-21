import { NextResponse } from "next/server";
import crypto from "crypto";
import dbConnect from "@/lib/db";
import Product from "@/models/Product";
import User from "@/models/User";
import Notification from "@/models/Notification";
import ShopifyStore from "@/models/ShopifyStore";
import Transaction from "@/models/Transaction";
import { decrypt } from "@/actions/encryption";
import {
  updateInventory,
  getShopifyLocations,
  disableShopifyProduct,
  getAllVariantInventoryIds,
} from "@/actions/shopifyAction";

// Platform transaction fee rates by subscription type.
// Old plans kept exactly as-is so existing subscribers' fees never change.
// New leStoresworld web plans added at 4% per the current commission decision.
const PLATFORM_FEE_RATES = {
  "Webstore Basic": 0.04, // 4%
  "Webstore Pro": 0.02,   // 2%
  // New plans — matched against user.subscriptionType (price.nickname || product.name)
  "lestores-ai-web": 0.04, // 4%
  "lestores-web": 0.04,    // 4%
  "link": 0.04,            // 4%
};

function verifyShopifyWebhook(body, hmacHeader, secret) {
  const generatedHmac = crypto
    .createHmac("sha256", secret)
    .update(body, "utf8")
    .digest("base64");
  return hmacHeader === generatedHmac;
}

export async function POST(req) {
  const body = await req.text();
  const hmacHeader = req.headers.get("x-shopify-hmac-sha256");

  // Resolve the webhook secret: check DB for per-store secret, fallback to env
  await dbConnect();
  let webhookSecret = process.env.SHOPIFY_API_SECRET;
  const shopDomain = req.headers.get("x-shopify-shop-domain");
  if (shopDomain) {
    const storeRecord = await ShopifyStore.findOne({ storeDomain: shopDomain.toLowerCase() });
    if (storeRecord) {
      webhookSecret = decrypt(storeRecord.apiSecret);
    }
  }

  if (!webhookSecret) {
    console.error("[Shopify Webhook] No webhook secret found (env or DB)");
    return NextResponse.json({ error: "Server config error" }, { status: 500 });
  }

  if (!verifyShopifyWebhook(body, hmacHeader, webhookSecret)) {
    console.error("[Shopify Webhook] HMAC verification failed");
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const topic = req.headers.get("x-shopify-topic");

  let event;
  try {
    event = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  switch (topic) {
    case "orders/create": {
      const lineItems = event.line_items || [];

      for (const item of lineItems) {
        const shopifyGid = `gid://shopify/Product/${item.product_id}`;

        const product = await Product.findOne({ shopifyProductId: shopifyGid });

        if (!product) {
          continue;
        }

        if (product.sold) {
          continue;
        }

        product.sold = true;
        product.soldVia = "shopify";
        await product.save();

        // Sync inventory to 0 and disable product on Shopify
        try {
          const locations = await getShopifyLocations();
          const activeLocation = locations.find((l) => l.isActive);
          if (activeLocation && product.shopifyProductId) {
            const inventoryItemIds = await getAllVariantInventoryIds(
              product.shopifyProductId,
            );
            for (const inventoryItemId of inventoryItemIds) {
              await updateInventory(inventoryItemId, activeLocation.id, 0);
            }
            await disableShopifyProduct(product.shopifyProductId);
          }
        } catch (invErr) {
          console.error(
            `[Shopify Webhook] Failed to sync inventory for product ${product._id}:`,
            invErr.message,
          );
        }

        // Create sold notification for the store owner
        const owner = await User.findById(product.userId);
        if (!owner) {
          continue;
        }

        if (owner.soldNotifications === false) {
          continue;
        }

        const notification = await Notification.create({
          userId: product.userId,
          productId: product._id,
          type: "sold",
          title: `"${product.title}" has been sold!`,
          message: `Order from ${event.customer?.first_name || "Customer"} ${event.customer?.last_name || ""}`.trim(),
          orderDetails: {
            shopifyOrderId: String(event.id),
            shopifyOrderUrl: `https://${process.env.SHOPIFY_STORE_DOMAIN}/admin/orders/${event.id}`,
            customerName:
              `${event.customer?.first_name || ""} ${event.customer?.last_name || ""}`.trim(),
            customerEmail: event.customer?.email || "",
            shippingAddress: event.shipping_address
              ? {
                  address1: event.shipping_address.address1,
                  address2: event.shipping_address.address2,
                  city: event.shipping_address.city,
                  province: event.shipping_address.province,
                  country: event.shipping_address.country,
                  zip: event.shipping_address.zip,
                }
              : null,
            fulfillmentMethod:
              event.shipping_lines?.length > 0 ? "shipping" : "pickup",
            totalPrice: event.total_price,
            currency: event.currency,
          },
        });

        // Create transaction record with platform fee
        try {
          const existingTx = await Transaction.findOne({
            orderId: String(event.id),
            productId: product._id,
          });
          if (!existingTx) {
            // Calculate platform fee based on store owner's subscription
            const normalizedSubType = (owner.subscriptionType || "").toLowerCase().trim();
            const feeRate = Object.entries(PLATFORM_FEE_RATES).find(
              ([key]) => key.toLowerCase() === normalizedSubType
            )?.[1] || 0;
            const saleAmount = Math.round(parseFloat(item.price || event.total_price) * 100);
            const feeAmount = feeRate > 0 ? Math.round(saleAmount * feeRate) : 0;

            await Transaction.create({
              userId: product.userId,
              productId: product._id,
              channel: "shopify",
              orderId: String(event.id),
              customerName:
                `${event.customer?.first_name || ""} ${event.customer?.last_name || ""}`.trim(),
              customerEmail: event.customer?.email || "",
              amount: saleAmount,
              currency: (event.currency || "DKK").toUpperCase(),
              paymentMethod: event.payment_gateway_names?.[0] || "SecondsToSee",
              status: "completed",
              shopifyOrderUrl: `https://${process.env.SHOPIFY_STORE_DOMAIN}/admin/orders/${event.id}`,
              shopifyOrderNumber: String(event.order_number || event.id),
              consignorName: product.consignorName || "",
              consignorEmail: product.consignorEmail || "",
              fulfillmentMethod:
                event.shipping_lines?.length > 0 ? "shipping" : "pickup",
              shippingAddress: event.shipping_address
                ? {
                    address1: event.shipping_address.address1,
                    address2: event.shipping_address.address2,
                    city: event.shipping_address.city,
                    province: event.shipping_address.province,
                    country: event.shipping_address.country,
                    zip: event.shipping_address.zip,
                  }
                : undefined,
              platformFeeRate: feeRate,
              platformFeeAmount: feeAmount,
            });
          }
        } catch (txErr) {
          console.error(
            `[Shopify Webhook] Failed to create transaction for product ${product._id}:`,
            txErr.message
          );
        }
      }
      break;
    }
    case "inventory_levels/set": {
      const inventoryItemGid = `gid://shopify/InventoryItem/${event.inventory_item_id}`;
      const newQuantity = event.available;

      const product = await Product.findOne({
        shopifyInventoryItemId: inventoryItemGid,
      });

      if (!product) {
        break;
      }

      if (newQuantity === 0 && !product.sold) {
        // Inventory set to 0 externally — mark as sold
        product.sold = true;
        product.soldVia = "shopify";
        await product.save();

        const owner = await User.findById(product.userId);
        if (owner && owner.soldNotifications !== false) {
          await Notification.create({
            userId: product.userId,
            productId: product._id,
            type: "sold",
            title: `"${product.title}" inventory set to 0`,
            message: "Inventory was manually adjusted in leStoresweb",
          });
        }
      } else if (newQuantity > 0 && product.sold) {
        // Inventory restored (return/correction) — unmark as sold
        product.sold = false;
        product.soldVia = undefined;
        await product.save();

        // Re-enable the product on Shopify (set to ACTIVE)
        if (product.shopifyProductId) {
          try {
            const axios = (await import("axios")).default;
            const shopifyClient = axios.create({
              baseURL: `https://${process.env.SHOPIFY_STORE_DOMAIN}/admin/api/2024-10/graphql.json`,
              headers: {
                "X-Shopify-Access-Token":
                  process.env.SHOPIFY_ADMIN_ACCESS_TOKEN,
                "Content-Type": "application/json",
              },
            });

            await shopifyClient.post("", {
              query: `mutation productUpdate($input: ProductInput!) {
                productUpdate(input: $input) {
                  product { id status }
                  userErrors { field message }
                }
              }`,
              variables: {
                input: {
                  id: product.shopifyProductId,
                  status: "ACTIVE",
                },
              },
            });
          } catch (reactivateErr) {
            console.error(
              `[Shopify Webhook] Failed to reactivate product: ${reactivateErr.message}`,
            );
          }
        }
      }

      break;
    }
    default:
      break;
  }

  return NextResponse.json({ received: true }, { status: 200 });
}
