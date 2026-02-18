import { NextResponse } from "next/server";
import crypto from "crypto";
import dbConnect from "@/lib/db";
import Product from "@/models/Product";
import User from "@/models/User";
import Notification from "@/models/Notification";
import ShopifyStore from "@/models/ShopifyStore";
import { decrypt } from "@/actions/encryption";
import {
  updateInventory,
  getShopifyLocations,
  disableShopifyProduct,
  getAllVariantInventoryIds,
} from "@/actions/shopifyAction";

function verifyShopifyWebhook(body, hmacHeader, secret) {
  const generatedHmac = crypto
    .createHmac("sha256", secret)
    .update(body, "utf8")
    .digest("base64");
  return hmacHeader === generatedHmac;
}

export async function POST(req) {
  console.log("[Shopify Webhook] Received request");

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
      console.log(`[Shopify Webhook] Using per-store secret for domain: ${shopDomain}`);
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
  console.log("[Shopify Webhook] Topic:", topic);

  let event;
  try {
    event = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  switch (topic) {
    case "orders/create": {
      const lineItems = event.line_items || [];
      console.log(`[Shopify Webhook] Order #${event.order_number || event.id} with ${lineItems.length} line item(s)`);

      for (const item of lineItems) {
        const shopifyGid = `gid://shopify/Product/${item.product_id}`;
        console.log(`[Shopify Webhook] Looking up product: ${shopifyGid}`);

        const product = await Product.findOne({ shopifyProductId: shopifyGid });

        if (!product) {
          console.log(`[Shopify Webhook] No product found in DB for ${shopifyGid}`);
          continue;
        }

        if (product.sold) {
          console.log(`[Shopify Webhook] Product ${product._id} already marked as sold`);
          continue;
        }

        product.sold = true;
        product.soldVia = "shopify";
        await product.save();
        console.log(`[Shopify Webhook] Marked product ${product._id} as sold via shopify`);

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
            console.log(
              `[Shopify Webhook] Inventory set to 0 and product disabled for ${product._id}`,
            );
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
          console.log(`[Shopify Webhook] Owner not found for userId: ${product.userId}`);
          continue;
        }

        if (owner.soldNotifications === false) {
          console.log(`[Shopify Webhook] Owner ${owner._id} has notifications disabled`);
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
        console.log(`[Shopify Webhook] Notification created: ${notification._id}`);
      }
      break;
    }
    case "inventory_levels/set": {
      const inventoryItemGid = `gid://shopify/InventoryItem/${event.inventory_item_id}`;
      const newQuantity = event.available;

      console.log(
        `[Shopify Webhook] Inventory level set: item=${inventoryItemGid}, qty=${newQuantity}`,
      );

      const product = await Product.findOne({
        shopifyInventoryItemId: inventoryItemGid,
      });

      if (!product) {
        console.log(
          `[Shopify Webhook] No product found for inventory item ${inventoryItemGid}`,
        );
        break;
      }

      if (newQuantity === 0 && !product.sold) {
        // Inventory set to 0 externally — mark as sold
        product.sold = true;
        product.soldVia = "shopify";
        await product.save();
        console.log(
          `[Shopify Webhook] Product ${product._id} marked as sold (inventory set to 0)`,
        );

        const owner = await User.findById(product.userId);
        if (owner && owner.soldNotifications !== false) {
          await Notification.create({
            userId: product.userId,
            productId: product._id,
            type: "sold",
            title: `"${product.title}" inventory set to 0`,
            message: "Inventory was manually adjusted in Shopify",
          });
        }
      } else if (newQuantity > 0 && product.sold) {
        // Inventory restored (return/correction) — unmark as sold
        product.sold = false;
        product.soldVia = undefined;
        await product.save();
        console.log(
          `[Shopify Webhook] Product ${product._id} unmarked as sold (inventory restored to ${newQuantity})`,
        );

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
            console.log(
              `[Shopify Webhook] Product ${product._id} reactivated on Shopify`,
            );
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
      console.log(`[Shopify Webhook] Unhandled topic: ${topic}`);
  }

  return NextResponse.json({ received: true }, { status: 200 });
}
