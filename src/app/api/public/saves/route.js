import dbConnect from "@/lib/db";
import SavedProduct from "@/models/SavedProduct";
import { requireApiKey, handlePreflight } from "@/lib/apiKeyMiddleware";

export async function OPTIONS() {
  return handlePreflight();
}

// Idempotent — tapping save twice just no-ops the second time rather than erroring.
export async function POST(req) {
  const unauthorized = requireApiKey(req);
  if (unauthorized) return unauthorized;

  try {
    const { userId, productId } = await req.json();
    if (!userId || !productId) {
      return Response.json({ error: "Missing userId or productId" }, { status: 400 });
    }

    await dbConnect();
    await SavedProduct.updateOne({ userId, productId }, { $setOnInsert: { userId, productId } }, { upsert: true });

    return Response.json({ ok: true });
  } catch (error) {
    console.error("Save product error:", error);
    return Response.json({ error: "Something went wrong" }, { status: 500 });
  }
}

export async function DELETE(req) {
  const unauthorized = requireApiKey(req);
  if (unauthorized) return unauthorized;

  try {
    const { userId, productId } = await req.json();
    if (!userId || !productId) {
      return Response.json({ error: "Missing userId or productId" }, { status: 400 });
    }

    await dbConnect();
    await SavedProduct.deleteOne({ userId, productId });

    return Response.json({ ok: true });
  } catch (error) {
    console.error("Unsave product error:", error);
    return Response.json({ error: "Something went wrong" }, { status: 500 });
  }
}

// Hydrates a signed-in user's saved list — e.g. on login, or a fresh device.
export async function GET(req) {
  const unauthorized = requireApiKey(req);
  if (unauthorized) return unauthorized;

  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    if (!userId) {
      return Response.json({ error: "Missing userId" }, { status: 400 });
    }

    await dbConnect();
    const saves = await SavedProduct.find({ userId }).sort({ createdAt: -1 });

    return Response.json({
      ok: true,
      saves: saves.map((s) => ({ productId: String(s.productId), savedAt: s.createdAt.getTime() })),
    });
  } catch (error) {
    console.error("List saves error:", error);
    return Response.json({ error: "Something went wrong" }, { status: 500 });
  }
}
