import { NextResponse } from "next/server";
import { auth } from "@/auth";
import dbConnect from "@/lib/db";
import Product from "@/models/Product";
import Notification from "@/models/Notification";

// DEV ONLY: Simulate Shopify webhooks to test locally
//
// Usage:
//   GET /api/test-webhook              — Simulate orders/create (marks product sold)
//   GET /api/test-webhook?type=inventory       — Simulate inventory_levels/set (qty=0, marks sold)
//   GET /api/test-webhook?type=inventory&qty=1 — Simulate inventory restore (qty>0, unmarks sold)
export async function GET(req) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not available in production" }, { status: 403 });
  }

  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Not logged in. Log into the dashboard first." }, { status: 401 });
  }

  await dbConnect();

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");
  const qty = parseInt(searchParams.get("qty") || "0", 10);

  // --- Simulate inventory_levels/set webhook ---
  if (type === "inventory") {
    if (qty > 0) {
      // Simulate inventory restore (return/correction)
      const product = await Product.findOne({
        userId: session.user.id,
        sold: true,
      });

      if (!product) {
        return NextResponse.json(
          { error: "No sold products found to restore." },
          { status: 404 },
        );
      }

      product.sold = false;
      product.soldVia = undefined;
      await product.save();

      return NextResponse.json({
        success: true,
        message: `Product inventory restored to ${qty} — unmarked as sold`,
        product: { id: product._id, title: product.title, sold: false },
      });
    }

    // Simulate inventory set to 0 (mark sold)
    const product = await Product.findOne({
      userId: session.user.id,
      sold: { $ne: true },
    });

    if (!product) {
      return NextResponse.json(
        { error: "No unsold products found for your account." },
        { status: 404 },
      );
    }

    product.sold = true;
    product.soldVia = "shopify";
    await product.save();

    const notification = await Notification.create({
      userId: session.user.id,
      productId: product._id,
      type: "sold",
      title: `"${product.title}" inventory set to 0`,
      message: "Test inventory adjustment simulation",
    });

    return NextResponse.json({
      success: true,
      message: "Product marked as sold via inventory_levels/set simulation",
      product: { id: product._id, title: product.title, soldVia: "shopify" },
      notification: { id: notification._id, title: notification.title },
    });
  }

  // --- Simulate orders/create webhook (existing behavior) ---
  let product = await Product.findOne({
    userId: session.user.id,
    sold: { $ne: true },
  });

  if (!product) {
    return NextResponse.json(
      { error: "No unsold products found for your account." },
      { status: 404 },
    );
  }

  product.sold = true;
  product.soldVia = "shopify";
  await product.save();

  const notification = await Notification.create({
    userId: session.user.id,
    productId: product._id,
    type: "sold",
    title: `"${product.title}" has been sold!`,
    message: "Test order from Local Testing",
    orderDetails: {
      shopifyOrderId: "TEST-" + Date.now(),
      shopifyOrderUrl: `https://${process.env.SHOPIFY_STORE_DOMAIN}/admin/orders/test`,
      customerName: "Test Customer",
      customerEmail: "test@example.com",
      shippingAddress: {
        address1: "123 Test Street",
        city: "Copenhagen",
        province: "Capital Region",
        country: "Denmark",
        zip: "1000",
      },
      fulfillmentMethod: "shipping",
      totalPrice: "100.00",
      currency: "DKK",
    },
  });

  return NextResponse.json({
    success: true,
    message: "Product marked as sold via Shopify + notification created",
    product: {
      id: product._id,
      title: product.title,
      soldVia: "shopify",
    },
    notification: {
      id: notification._id,
      title: notification.title,
    },
    loggedInAs: {
      id: session.user.id,
      email: session.user.email,
    },
  });
}
