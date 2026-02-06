import { NextResponse } from "next/server";
import axios from "axios";
import dbConnect from "@/lib/db";
import InstagramPostLog from "@/models/InstagramPostLogs";
import Product from "@/models/Product";

const GRAPH_URL = "https://graph.facebook.com/v19.0";
const PAGE_ID = process.env.META_PAGE_ID;
const ACCESS_TOKEN = process.env.META_IG_ACCESS_TOKEN;

export async function POST(request) {
  try {
    await dbConnect();

    const { products, images, caption, logId } = await request.json();

    console.log(`[Instagram API] Starting post with ${images.length} images`);

    // Format caption with limit
    const formattedCaption = caption?.substring(0, 2200) || "";

    let result;
    if (images.length === 1) {
      result = await createSinglePost(images[0], formattedCaption);
    } else {
      result = await createCarouselPost(images, formattedCaption);
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

    const { logId, products } = await request.json().catch(() => ({}));

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

    // Reset product flags
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

async function createSinglePost(imageUrl, caption) {
  try {
    const pageResponse = await axios.get(`${GRAPH_URL}/${PAGE_ID}`, {
      params: { fields: "instagram_business_account", access_token: ACCESS_TOKEN },
      timeout: 60000,
    });

    const igAccountId = pageResponse.data.instagram_business_account.id;

    const mediaRes = await axios.post(`${GRAPH_URL}/${igAccountId}/media`, null, {
      params: { image_url: imageUrl, caption, access_token: ACCESS_TOKEN },
      timeout: 90000,
    });

    const creationId = mediaRes.data.id;
    await waitForMediaReady(igAccountId, creationId);

    const publishRes = await axios.post(`${GRAPH_URL}/${igAccountId}/media_publish`, null, {
      params: { creation_id: creationId, access_token: ACCESS_TOKEN },
      timeout: 60000,
    });

    return publishRes.data;
  } catch (error) {
    console.error("[Instagram API] Single post error:", error.response?.data || error.message);
    throw new Error(error.response?.data?.error?.message || error.message);
  }
}

async function createCarouselPost(images, caption) {
  try {
    const pageResponse = await axios.get(`${GRAPH_URL}/${PAGE_ID}`, {
      params: { fields: "instagram_business_account", access_token: ACCESS_TOKEN },
      timeout: 60000,
    });

    const igAccountId = pageResponse.data.instagram_business_account.id;

    // Create child containers
    const children = [];
    for (const imageUrl of images) {
      console.log(`[Instagram API] Creating carousel item ${children.length + 1}/${images.length}`);
      const res = await axios.post(`${GRAPH_URL}/${igAccountId}/media`, null, {
        params: { image_url: imageUrl, is_carousel_item: true, access_token: ACCESS_TOKEN },
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

    // Publish
    console.log("[Instagram API] Publishing carousel...");
    const publishRes = await axios.post(`${GRAPH_URL}/${igAccountId}/media_publish`, null, {
      params: { creation_id: creationId, access_token: ACCESS_TOKEN },
      timeout: 60000,
    });

    console.log("[Instagram API] Carousel published successfully");
    return publishRes.data;
  } catch (error) {
    console.error("[Instagram API] Carousel error:", error.response?.data || error.message);
    throw new Error(error.response?.data?.error?.message || error.message);
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
