/**
 * Backfill Script: Fetch shopifyVariantId and shopifyInventoryItemId
 * for existing products that have a shopifyProductId but are missing these fields.
 *
 * Usage: node --env-file=.env scripts/backfill-shopify-ids.js
 *
 * Requires env vars: MONGODB_URI, SHOPIFY_STORE_DOMAIN, SHOPIFY_ADMIN_ACCESS_TOKEN
 */

const mongoose = require("mongoose");
const axios = require("axios");

const MONGODB_URI = process.env.MONGODB_URI;
const shopifyStoreDomain = process.env.SHOPIFY_STORE_DOMAIN;
const shopifyAccessToken = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN;

const shopify = axios.create({
  baseURL: `https://${shopifyStoreDomain}/admin/api/2024-10/graphql.json`,
  headers: {
    "X-Shopify-Access-Token": shopifyAccessToken,
    "Content-Type": "application/json",
  },
});

const productSchema = new mongoose.Schema({}, { strict: false });
const Product =
  mongoose.models.Product || mongoose.model("Product", productSchema);

const GET_VARIANTS = `
  query getProductVariants($id: ID!) {
    product(id: $id) {
      variants(first: 1) {
        edges {
          node {
            id
            inventoryItem {
              id
            }
          }
        }
      }
    }
  }
`;

async function backfill() {
  console.log("Connecting to MongoDB...");
  await mongoose.connect(MONGODB_URI);

  const products = await Product.find({
    shopifyProductId: { $exists: true, $ne: null },
    $or: [
      { shopifyVariantId: { $exists: false } },
      { shopifyVariantId: null },
      { shopifyInventoryItemId: { $exists: false } },
      { shopifyInventoryItemId: null },
    ],
  });

  console.log(`Found ${products.length} products to backfill.`);

  let updated = 0;
  let failed = 0;

  for (const product of products) {
    try {
      const res = await shopify.post("", {
        query: GET_VARIANTS,
        variables: { id: product.shopifyProductId },
      });

      const firstVariant = res.data?.data?.product?.variants?.edges?.[0]?.node;

      if (firstVariant) {
        await Product.findByIdAndUpdate(product._id, {
          shopifyVariantId: firstVariant.id,
          shopifyInventoryItemId: firstVariant.inventoryItem?.id || null,
        });
        updated++;
        console.log(`  Updated: ${product.title || product._id}`);
      } else {
        console.log(
          `  No variants found for: ${product.title || product._id} (${product.shopifyProductId})`,
        );
        failed++;
      }

      // Rate limit: ~2 requests/second
      await new Promise((resolve) => setTimeout(resolve, 500));
    } catch (err) {
      console.error(
        `  Error for ${product.title || product._id}: ${err.message}`,
      );
      failed++;
    }
  }

  console.log(`\nDone! Updated: ${updated}, Failed: ${failed}`);
  await mongoose.disconnect();
  process.exit(0);
}

backfill().catch((err) => {
  console.error("Backfill failed:", err);
  process.exit(1);
});
