import axios from "axios";
import InstagramPostLog from "@/models/InstagramPostLogs";
import Product from "@/models/Product";

const GRAPH_URL = "https://graph.facebook.com/v19.0";
const PAGE_ID = process.env.META_PAGE_ID;
const ACCESS_TOKEN = process.env.META_IG_ACCESS_TOKEN;

/**
 * Post to Instagram directly (works on Vercel free plan)
 */
export async function postToInstagram({ products, images, caption, logId }) {
  try {
    const imageUrls = images
      .map((img) => (typeof img === "string" ? img : img.url))
      .slice(0, 10);

    console.log(`[Instagram] Starting post with ${imageUrls.length} images`);

    // Format caption with limit
    const formattedCaption = caption?.substring(0, 2200) || "";

    let result;
    if (imageUrls.length === 1) {
      result = await createSinglePost(imageUrls[0], formattedCaption);
    } else {
      result = await createCarouselPost(imageUrls, formattedCaption);
    }

    // Update log on success
    await InstagramPostLog.findByIdAndUpdate(logId, {
      status: "success",
      instagramPostId: result?.id,
      postedAt: new Date(),
    });

    console.log("[Instagram] Post successful:", result?.id);
    return result;
  } catch (error) {
    console.error("[Instagram] Post failed:", error.message);

    // Update log with error
    await InstagramPostLog.findByIdAndUpdate(logId, {
      status: "failed",
      errorLog: {
        message: error.message,
        meta: error.response?.data || null,
      },
    }).catch((e) => console.error("Failed to update log:", e));

    // Reset product flags
    await Product.updateMany(
      { _id: { $in: products.map((p) => p._id) } },
      { hasInstagramPost: false }
    ).catch((e) => console.error("Failed to update products:", e));

    throw error;
  }
}

async function createSinglePost(imageUrl, caption) {
  try {
    const pageResponse = await axios.get(`${GRAPH_URL}/${PAGE_ID}`, {
      params: { fields: "instagram_business_account", access_token: ACCESS_TOKEN },
      timeout: 30000,
    });

    const igAccountId = pageResponse.data.instagram_business_account.id;

    const mediaRes = await axios.post(`${GRAPH_URL}/${igAccountId}/media`, null, {
      params: { image_url: imageUrl, caption, access_token: ACCESS_TOKEN },
      timeout: 30000,
    });

    const creationId = mediaRes.data.id;
    await waitForMediaReady(igAccountId, creationId);

    const publishRes = await axios.post(`${GRAPH_URL}/${igAccountId}/media_publish`, null, {
      params: { creation_id: creationId, access_token: ACCESS_TOKEN },
      timeout: 30000,
    });

    return publishRes.data;
  } catch (error) {
    console.error("[Instagram] Single post error:", error.response?.data || error.message);
    throw new Error(error.response?.data?.error?.message || error.message);
  }
}

async function createCarouselPost(images, caption) {
  try {
    const pageResponse = await axios.get(`${GRAPH_URL}/${PAGE_ID}`, {
      params: { fields: "instagram_business_account", access_token: ACCESS_TOKEN },
      timeout: 30000,
    });

    const igAccountId = pageResponse.data.instagram_business_account.id;

    // Create child containers
    const children = [];
    for (const imageUrl of images) {
      const res = await axios.post(`${GRAPH_URL}/${igAccountId}/media`, null, {
        params: { image_url: imageUrl, is_carousel_item: true, access_token: ACCESS_TOKEN },
        timeout: 30000,
      });
      children.push(res.data.id);
    }

    // Wait for all carousel items
    for (const childId of children) {
      await waitForMediaReady(igAccountId, childId);
    }

    // Create carousel container
    const carouselRes = await axios.post(`${GRAPH_URL}/${igAccountId}/media`, null, {
      params: {
        media_type: "CAROUSEL",
        children: children.join(","),
        caption,
        access_token: ACCESS_TOKEN,
      },
      timeout: 30000,
    });

    const creationId = carouselRes.data.id;
    await waitForMediaReady(igAccountId, creationId);

    // Publish
    const publishRes = await axios.post(`${GRAPH_URL}/${igAccountId}/media_publish`, null, {
      params: { creation_id: creationId, access_token: ACCESS_TOKEN },
      timeout: 30000,
    });

    return publishRes.data;
  } catch (error) {
    console.error("[Instagram] Carousel error:", error.response?.data || error.message);
    throw new Error(error.response?.data?.error?.message || error.message);
  }
}

async function waitForMediaReady(igAccountId, creationId, maxAttempts = 60) {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const statusRes = await axios.get(`${GRAPH_URL}/${creationId}`, {
        params: { fields: "status_code", access_token: ACCESS_TOKEN },
        timeout: 15000,
      });

      const statusCode = statusRes.data.status_code;

      if (statusCode === "FINISHED") {
        console.log(`[Instagram] Media ready (attempt ${attempt})`);
        return true;
      } else if (statusCode === "ERROR") {
        throw new Error("Media processing failed");
      }

      // Progressive backoff
      const waitTime = Math.min(2000 + Math.floor(attempt / 2) * 1000, 5000);
      await new Promise((resolve) => setTimeout(resolve, waitTime));
    } catch (error) {
      if (error.message === "Media processing failed") throw error;

      const waitTime = Math.min(3000 + attempt * 500, 8000);
      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }
  }

  throw new Error("Media processing timeout");
}
