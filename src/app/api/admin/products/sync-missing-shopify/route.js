import { auth } from "@/auth";
import dbConnect from "@/lib/db";
import Product from "@/models/Product";
import User from "@/models/User";
import { createShopifyProduct } from "@/actions/shopifyAction";

// Each Shopify create is several sequential API calls — give this more room
// than the Vercel default (10s).
export const maxDuration = 60;

// Small on purpose, same reasoning as geocode-pending: each Shopify create
// is several sequential API calls (product, variants, publish), so a
// handful per call keeps this comfortably inside serverless time limits.
// The admin page calls this repeatedly (passing back `afterId`) to work
// through however many are stuck.
const BATCH_SIZE = 4;

// Scoped tightly to exactly the gap this exists to fix — Discover captures
// made before the app-to-Shopify sync existed. NOT a general "anything
// missing a shopifyProductId" sweep: some products (e.g. Ree Collect
// donation items) are never meant to reach Shopify, and a Shopify call
// that failed for a dashboard-created product should be retried from its
// own flow, not swept up here.
function pendingQuery(afterId) {
  const filter = {
    consignorAccount: "discover-app",
    archived: { $ne: true },
    $or: [{ shopifyProductId: { $exists: false } }, { shopifyProductId: null }, { shopifyProductId: "" }],
  };
  if (afterId) filter._id = { $gt: afterId };
  return filter;
}

/**
 * POST /api/admin/products/sync-missing-shopify
 *
 * One-time catch-up for Discover captures saved before the app started
 * pushing to Shopify at capture time (see /api/public/products POST) — a
 * product like this exists fine in Ree/Discover but was never actually
 * created on the shared Shopify catalogue, so it can never show up on
 * lestoresweb.com no matter how long you wait.
 */
export async function POST(request) {
  const session = await auth();
  if (!session || (session.user.role !== "admin" && session.user.role !== "developer")) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const afterId = body.afterId || null;

    await dbConnect();

    const batch = await Product.find(pendingQuery(afterId)).sort({ _id: 1 }).limit(BATCH_SIZE);

    let synced = 0;
    let failed = 0;
    let lastId = afterId;

    for (const product of batch) {
      lastId = product._id;
      try {
        const store = await User.findById(product.userId).select("storename brandname");
        const shopifyResponse = await createShopifyProduct({
          title: product.title,
          sku: product.sku,
          brand: product.brand,
          description: product.description,
          price: product.price,
          images: product.images,
          color: product.color,
          size: product.size,
          fabric: product.fabric,
          subcategory: product.subcategory,
          barcodeValue: product.barcode,
          storeName: store?.storename || store?.brandname || "",
        });

        if (shopifyResponse.status === 200) {
          product.shopifyProductId = shopifyResponse.productId;
          product.shopifyVariantId = shopifyResponse.variantId;
          product.shopifyInventoryItemId = shopifyResponse.inventoryItemId;
          await product.save();
          synced++;
        } else {
          console.error("sync-missing-shopify failed for", product._id, shopifyResponse.error);
          failed++;
        }
      } catch (err) {
        console.error("sync-missing-shopify error for", product._id, err);
        failed++;
      }
    }

    const totalPending = await Product.countDocuments(pendingQuery(null));

    return Response.json({
      processed: batch.length,
      synced,
      failed,
      lastId,
      totalPending,
      done: batch.length < BATCH_SIZE,
    });
  } catch (error) {
    console.error("Admin sync-missing-shopify error:", error);
    return Response.json({ error: error.message || "Something went wrong" }, { status: 500 });
  }
}
