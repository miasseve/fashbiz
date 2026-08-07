import dbConnect from "@/lib/db";
import cloudinary from "@/lib/cloudinary";
import { requireApiKey, handlePreflight } from "@/lib/apiKeyMiddleware";
import { analyzeProductImages } from "@/lib/aiProductAnalysis";

export async function OPTIONS() {
  return handlePreflight();
}

// Runs a Discover capture through Ree's real product-recognition AI — the
// same pipeline the dashboard's "add product" flow already uses, not a
// separate/fake system. Uploads the photos once and returns both the
// hosted image info and the analysis, so the follow-up create-product call
// doesn't need to re-upload the same images again.
export async function POST(req) {
  const unauthorized = requireApiKey(req);
  if (unauthorized) return unauthorized;

  try {
    const body = await req.json();
    const rawImages = Array.isArray(body.images) ? body.images.slice(0, 4) : [];

    await dbConnect();

    const images = [];
    for (const dataUrl of rawImages) {
      if (typeof dataUrl !== "string" || !dataUrl.startsWith("data:")) continue;
      const uploaded = await cloudinary.v2.uploader.upload(dataUrl, {
        folder: "nm-demo",
        format: "webp",
      });
      images.push({ url: uploaded.secure_url, publicId: uploaded.public_id });
    }

    if (!images.length) {
      return Response.json({ error: "At least one valid image is required" }, { status: 400 });
    }

    const analysis = await analyzeProductImages(images.map((i) => i.url), undefined);

    return Response.json({ ok: true, images, analysis });
  } catch (error) {
    console.error("Public analyze-product error:", error);
    return Response.json({ error: "Something went wrong" }, { status: error.status || 500 });
  }
}
