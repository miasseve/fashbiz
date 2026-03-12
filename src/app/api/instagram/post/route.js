import { NextResponse } from "next/server";
import axios from "axios";
import dbConnect from "@/lib/db";
import InstagramPostLog from "@/models/InstagramPostLogs";
import Product from "@/models/Product";

const GRAPH_URL = "https://graph.facebook.com/v19.0";
const PAGE_ID = process.env.META_PAGE_ID;
const ACCESS_TOKEN = process.env.META_IG_ACCESS_TOKEN;
const CATALOG_ID = process.env.META_CATALOG_ID;

export async function POST(request) {
  // Parse body once upfront so it's available in both success and error paths
  // (request.json() can only be called once — the stream is consumed)
  let body = {};
  try {
    body = await request.json();
  } catch (e) {
    return NextResponse.json({ status: 400, error: "Invalid request body" }, { status: 400 });
  }

  const { products, images, caption, logId, productInfos } = body;

  try {
    await dbConnect();

    console.log(`[Instagram API] Starting post with ${images.length} images`);

    // Mark as processing so new requests are blocked until this completes
    if (logId) {
      await InstagramPostLog.findByIdAndUpdate(logId, { status: "processing" });
    }

    // Format caption with limit
    const formattedCaption = caption?.substring(0, 2200) || "";

    // Get IG account ID once — used for posting and catalog lookups
    const pageResponse = await axios.get(`${GRAPH_URL}/${PAGE_ID}`, {
      params: { fields: "instagram_business_account", access_token: ACCESS_TOKEN },
      timeout: 60000,
    });
    const igAccountId = pageResponse.data.instagram_business_account.id;

    // Look up catalog product IDs via the IG account's own catalog search
    // (/{ig-user-id}/catalog_product_search uses the IG token correctly)
    let productTags = [];
    if (productInfos?.length && CATALOG_ID) {
      productTags = await Promise.all(
        productInfos.map((info) => getCatalogProductIdForInstagram(igAccountId, info.title))
      );
      console.log(`[Instagram API] Resolved catalog tags:`, productTags);
    }

    let result;
    if (images.length === 1) {
      result = await createSinglePost(igAccountId, images[0], formattedCaption, productTags[0] || null);
    } else {
      result = await createCarouselPost(igAccountId, images, formattedCaption, productTags);
    }

    // Update log on success
    await InstagramPostLog.findByIdAndUpdate(logId, {
      status: "success",
      instagramPostId: result?.id,
      postedAt: new Date(),
    });

    console.log("[Instagram API] Post successful:", result?.id);

    return NextResponse.json({
      status: 200,
      message: "Instagram post created successfully",
      data: result,
    });
  } catch (error) {
    console.error("[Instagram API] Post failed:", error.message);

    // Update log with error
    if (logId) {
      await InstagramPostLog.findByIdAndUpdate(logId, {
        status: "failed",
        errorLog: {
          message: error.message,
          meta: error.response?.data || null,
        },
      }).catch((e) => console.error("Failed to update log:", e));
    }

    // Reset product flags so products can be reposted
    if (products && Array.isArray(products)) {
      await Product.updateMany(
        { _id: { $in: products.map((p) => p._id || p) } },
        { hasInstagramPost: false }
      ).catch((e) => console.error("Failed to update products:", e));
    }

    return NextResponse.json(
      {
        status: 500,
        error: error.message || "Failed to create Instagram post",
      },
      { status: 500 }
    );
  }
}

/**
 * Search the Instagram catalog for a product by title.
 * Uses /{ig-user-id}/catalog_product_search which works with the IG access token.
 */
async function getCatalogProductIdForInstagram(igAccountId, productTitle) {
  try {
    if (!CATALOG_ID || !productTitle) return null;

    const res = await axios.get(`${GRAPH_URL}/${igAccountId}/catalog_product_search`, {
      params: {
        catalog_id: CATALOG_ID,
        q: productTitle,
        fields: "product_id,retailer_id,name",
        access_token: ACCESS_TOKEN,
      },
      timeout: 15000,
    });

    const product = res.data?.data?.[0];
    if (product) {
      console.log(`[Catalog] Found product_id ${product.product_id} for "${productTitle}"`);
      return { catalogProductId: product.product_id };
    }

    console.warn(`[Catalog] No match found for "${productTitle}"`);
    return null;
  } catch (error) {
    console.error(`[Catalog] Search error for "${productTitle}":`, error.response?.data || error.message);
    return null;
  }
}

async function createSinglePost(igAccountId, imageUrl, caption, productTag = null) {
  try {
    const mediaParams = { image_url: imageUrl, caption, access_token: ACCESS_TOKEN };

    // Add product tag if available (Instagram Shopping)
    if (productTag?.catalogProductId) {
      mediaParams.product_tags = JSON.stringify([
        { product_id: productTag.catalogProductId, x: 0.5, y: 0.8 },
      ]);
      console.log(`[Instagram API] Single post tagged with catalog product: ${productTag.catalogProductId}`);
    }

    const mediaRes = await axios.post(`${GRAPH_URL}/${igAccountId}/media`, null, {
      params: mediaParams,
      timeout: 90000,
    });

    const creationId = mediaRes.data.id;
    await waitForMediaReady(igAccountId, creationId);

    // Add a small delay before publishing to allow propagation
    await new Promise((resolve) => setTimeout(resolve, 3000));

    const publishRes = await publishWithRetry(igAccountId, creationId);
    return publishRes.data;
  } catch (error) {
    console.error("[Instagram API] Single post error:", error.response?.data || error.message);
    throw new Error(error.response?.data?.error?.message || error.message);
  }
}

async function createCarouselPost(igAccountId, images, caption, productTags = []) {
  try {
    // Create child containers — each slide gets its own product tag
    const children = [];
    for (let i = 0; i < images.length; i++) {
      const imageUrl = images[i];
      const tag = productTags[i];
      console.log(`[Instagram API] Creating carousel item ${i + 1}/${images.length}`);

      const childParams = {
        image_url: imageUrl,
        is_carousel_item: true,
        access_token: ACCESS_TOKEN,
      };

      // Tag this slide with its specific product from the catalog
      if (tag?.catalogProductId) {
        childParams.product_tags = JSON.stringify([
          { product_id: tag.catalogProductId, x: 0.5, y: 0.8 },
        ]);
        console.log(`[Instagram API] Slide ${i + 1} tagged with catalog product: ${tag.catalogProductId}`);
      }

      const res = await axios.post(`${GRAPH_URL}/${igAccountId}/media`, null, {
        params: childParams,
        timeout: 120000,
      });
      children.push(res.data.id);
    }

    console.log(`[Instagram API] All ${children.length} items created, waiting for processing...`);

    // Wait for all carousel items
    for (let i = 0; i < children.length; i++) {
      console.log(`[Instagram API] Waiting for item ${i + 1}/${children.length} to be ready...`);
      await waitForMediaReady(igAccountId, children[i]);
    }

    // Create carousel container
    console.log("[Instagram API] Creating carousel container...");
    const carouselRes = await axios.post(`${GRAPH_URL}/${igAccountId}/media`, null, {
      params: {
        media_type: "CAROUSEL",
        children: children.join(","),
        caption,
        access_token: ACCESS_TOKEN,
      },
      timeout: 60000,
    });

    const creationId = carouselRes.data.id;
    console.log("[Instagram API] Waiting for carousel to be ready...");
    await waitForMediaReady(igAccountId, creationId);

    // KEY FIX: Wait after FINISHED status before publishing
    // Instagram's API often reports FINISHED before the media is fully propagated
    console.log("[Instagram API] Carousel ready, waiting 5s for propagation...");
    await new Promise((resolve) => setTimeout(resolve, 5000));

    // Publish with retry logic
    console.log("[Instagram API] Publishing carousel...");
    const publishRes = await publishWithRetry(igAccountId, creationId);

    console.log("[Instagram API] Carousel published successfully");
    return publishRes.data;
  } catch (error) {
    console.error("[Instagram API] Carousel error:", error.response?.data || error.message);
    throw new Error(error.response?.data?.error?.message || error.message);
  }
}

/**
 * Publish with retry — handles the race condition where Instagram
 * reports FINISHED but the media isn't actually ready to publish yet.
 */
async function publishWithRetry(igAccountId, creationId, maxRetries = 5) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const publishRes = await axios.post(`${GRAPH_URL}/${igAccountId}/media_publish`, null, {
        params: { creation_id: creationId, access_token: ACCESS_TOKEN },
        timeout: 60000,
      });
      return publishRes;
    } catch (error) {
      const errorCode = error.response?.data?.error?.code;
      const errorSubcode = error.response?.data?.error?.error_subcode;

      // Only retry on "media not ready" errors (code 9007, subcode 2207027)
      const isMediaNotReady = errorCode === 9007 || errorSubcode === 2207027;

      if (isMediaNotReady && attempt < maxRetries) {
        const waitTime = attempt * 5000; // 5s, 10s, 15s, 20s...
        console.log(
          `[Instagram API] Media not ready for publish (attempt ${attempt}/${maxRetries}), retrying in ${waitTime / 1000}s...`
        );
        await new Promise((resolve) => setTimeout(resolve, waitTime));
      } else {
        throw error;
      }
    }
  }
}

async function waitForMediaReady(igAccountId, creationId, maxAttempts = 90) {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const statusRes = await axios.get(`${GRAPH_URL}/${creationId}`, {
        params: { fields: "status_code", access_token: ACCESS_TOKEN },
        timeout: 30000,
      });

      const statusCode = statusRes.data.status_code;
      console.log("[Instagram API] Status code:", statusCode);

      if (statusCode === "FINISHED") {
        console.log(`[Instagram API] Media ready after ${attempt} attempts`);
        return true;
      } else if (statusCode === "ERROR") {
        throw new Error("Media processing failed");
      }

      // Progressive backoff: start at 3s, increase gradually
      const waitTime = Math.min(3000 + Math.floor(attempt / 3) * 1000, 8000);

      if (attempt % 10 === 0) {
        console.log(`[Instagram API] Still waiting... (attempt ${attempt}/${maxAttempts}, status: ${statusCode})`);
      }

      await new Promise((resolve) => setTimeout(resolve, waitTime));
    } catch (error) {
      if (error.message === "Media processing failed") throw error;

      // If timeout or network error, wait longer before retry
      const waitTime = Math.min(5000 + attempt * 500, 10000);

      if (attempt % 10 === 0) {
        console.log(`[Instagram API] Status check error (attempt ${attempt}/${maxAttempts}), retrying...`);
      }

      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }
  }

  throw new Error(`Media processing timeout after ${maxAttempts} attempts`);
}