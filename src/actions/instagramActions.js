import axios from "axios";
import InstagramPostLog from "@/models/InstagramPostLogs";
import Product from "@/models/Product";

const GRAPH_URL = "https://graph.facebook.com/v19.0";
const PAGE_ID = process.env.META_PAGE_ID; // Use Page ID, not IG Business ID
const IG_ACCOUNT_ID = process.env.META_IG_BUSINESS_ID; // Keep for reference
const ACCESS_TOKEN = process.env.META_IG_ACCESS_TOKEN;

// Validation
if (!PAGE_ID) {
  throw new Error("META_PAGE_ID is not set in environment variables");
}
if (!ACCESS_TOKEN) {
  throw new Error("META_IG_ACCESS_TOKEN is not set in environment variables");
}

/**
 * Entry function
 */
export async function postToInstagram({ products, images, caption, logId }) {
  try {
    const imageUrls = images
      .map((img) => (typeof img === "string" ? img : img.url))
      .slice(0, 10); // Limit to 10
    const isCarousel = imageUrls.length > 1;
    const timeoutDuration = isCarousel ? 180000 : 120000;

    const timeout = new Promise((_, rej) =>
      setTimeout(
        () => rej(new Error(`Timeout after ${timeoutDuration / 1000}s`)),
        timeoutDuration,
      ),
    );

    const postPromise =
      imageUrls.length === 1
        ? createSinglePost(imageUrls[0], caption?.substring(0, 2200))
        : createCarouselPost(imageUrls, caption?.substring(0, 2200));

    const result = await Promise.race([postPromise, timeout]);
    await InstagramPostLog.findByIdAndUpdate(logId, {
      status: "success",
      instagramPostId: result?.id,
      postedAt: new Date(),
    });
    return result;
  } catch (error) {
    // Log to error tracking service
    await InstagramPostLog.findByIdAndUpdate(logId, {
      status: "failed",
      errorLog: {
        message: error.message,
        meta: error.response?.data || null,
      },
    });
    await Product.updateMany(
      { _id: { $in: products.map((p) => p._id) } },
      { hasInstagramPost: false },
    );
    console.error("Instagram post failed:", {
      error: error.message,
      images: images.length,
    });
    throw error;
  }
}

async function createSinglePost(imageUrl, caption) {
  try {
    // Step 1: Get Instagram Account ID from Page
    const pageResponse = await axios.get(`${GRAPH_URL}/${PAGE_ID}`, {
      params: {
        fields: "instagram_business_account",
        access_token: ACCESS_TOKEN,
      },
    });

    const igAccountId = pageResponse.data.instagram_business_account.id;
    console.log("Using Instagram Account ID:", igAccountId);

    // Step 2: Create media container
    const mediaRes = await axios.post(
      `${GRAPH_URL}/${igAccountId}/media`,
      null,
      {
        params: {
          image_url: imageUrl,
          caption,
          access_token: ACCESS_TOKEN,
        },
      },
    );

    // console.log("Media container created:", mediaRes.data);
    const creationId = mediaRes.data.id;

    // Step 3: Wait for media to be ready (poll status)
    await waitForMediaReady(igAccountId, creationId);

    // Step 4: Publish
    const publishRes = await axios.post(
      `${GRAPH_URL}/${igAccountId}/media_publish`,
      null,
      {
        params: {
          creation_id: creationId,
          access_token: ACCESS_TOKEN,
        },
      },
    );

    console.log("Post published successfully:");
  } catch (error) {
    console.error(
      "Instagram API Error:",
      error.response?.data || error.message,
    );
    throw new Error(error.response?.data?.error?.message || error.message);
  }
}

async function createCarouselPost(images, caption) {
  try {
    // Step 1: Get Instagram Account ID from Page
    const pageResponse = await axios.get(`${GRAPH_URL}/${PAGE_ID}`, {
      params: {
        fields: "instagram_business_account",
        access_token: ACCESS_TOKEN,
      },
    });

    const igAccountId = pageResponse.data.instagram_business_account.id;

    // Step 2: Create child containers
    const children = [];

    for (const imageUrl of images) {
      const res = await axios.post(`${GRAPH_URL}/${igAccountId}/media`, null, {
        params: {
          image_url: imageUrl,
          is_carousel_item: true,
          access_token: ACCESS_TOKEN,
        },
      });
      children.push(res.data.id);
    }

    // Wait for all carousel items to be ready
    for (const childId of children) {
      await waitForMediaReady(igAccountId, childId);
    }

    // Step 3: Create carousel container
    const carouselRes = await axios.post(
      `${GRAPH_URL}/${igAccountId}/media`,
      null,
      {
        params: {
          media_type: "CAROUSEL",
          children: children.join(","),
          caption,
          access_token: ACCESS_TOKEN,
        },
      },
    );
    const creationId = carouselRes.data.id;

    // Wait for carousel to be ready
    await waitForMediaReady(igAccountId, creationId);

    // Step 4: Publish
    const publishRes = await axios.post(
      `${GRAPH_URL}/${igAccountId}/media_publish`,
      null,
      {
        params: {
          creation_id: creationId,
          access_token: ACCESS_TOKEN,
        },
      },
    );

    // console.log("Carousel published successfully:", publishRes.data);
    return publishRes.data;
  } catch (error) {
    console.error(
      "Instagram Carousel API Error:",
      error.response?.data || error.message,
    );
    throw new Error(error.response?.data?.error?.message || error.message);
  }
}

/**
 * Poll the media status until it's ready to publish
 */
async function waitForMediaReady(igAccountId, creationId, maxAttempts = 30) {
  //   console.log(`Waiting for media ${creationId} to be ready...`);

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const statusRes = await axios.get(`${GRAPH_URL}/${creationId}`, {
        params: {
          fields: "status_code",
          access_token: ACCESS_TOKEN,
        },
      });

      const statusCode = statusRes.data.status_code;
      //   console.log(`Attempt ${attempt}: Status code = ${statusCode}`);

      if (statusCode === "FINISHED") {
        // console.log("Media is ready!");
        return true;
      } else if (statusCode === "ERROR") {
        throw new Error("Media processing failed");
      }
      console.log(
        `attempt ${attempt}: Media not ready yet (status: ${statusCode}), waiting...`,
      );

      // Wait 2 seconds before next check
      await new Promise((resolve) => setTimeout(resolve, 2000));
    } catch (error) {
      // If we can't check status, wait and continue
      console.log(`Status check failed (attempt ${attempt}), waiting...`);
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }

  throw new Error("Media processing timeout - took too long to become ready");
}

// Helper function for delay
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
