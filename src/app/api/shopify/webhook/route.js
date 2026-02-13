import { NextResponse } from "next/server";
import crypto from "crypto";
import dbConnect from "@/lib/db";
import Product from "@/models/Product";
import User from "@/models/User";
import Notification from "@/models/Notification";

const SHOPIFY_WEBHOOK_SECRET = process.env.SHOPIFY_API_SECRET;

function verifyShopifyWebhook(body, hmacHeader) {
  const generatedHmac = crypto
    .createHmac("sha256", SHOPIFY_WEBHOOK_SECRET)
    .update(body, "utf8")
    .digest("base64");
  return hmacHeader === generatedHmac;
}

export async function POST(req) {
  console.log("[Shopify Webhook] Received request");

  const body = await req.text();
  const hmacHeader = req.headers.get("x-shopify-hmac-sha256");

  if (!SHOPIFY_WEBHOOK_SECRET) {
    console.error("[Shopify Webhook] SHOPIFY_API_SECRET env var is not set");
    return NextResponse.json({ error: "Server config error" }, { status: 500 });
  }

  if (!verifyShopifyWebhook(body, hmacHeader)) {
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

  await dbConnect();

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
    default:
      console.log(`[Shopify Webhook] Unhandled topic: ${topic}`);
  }

  return NextResponse.json({ received: true }, { status: 200 });
}
