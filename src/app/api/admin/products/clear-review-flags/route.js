import { auth } from "@/auth";
import dbConnect from "@/lib/db";
import Product from "@/models/Product";

/**
 * POST /api/admin/products/clear-review-flags
 *
 * One-time (and repeatable, if it ever recurs) cleanup: needsReview used to
 * hold back low-AI-confidence products until manually approved. That gate
 * was removed per client request (everything a store/shopper adds should
 * show up immediately) — this clears the backlog of products that were
 * already stuck in that state before the gate was removed, since flipping
 * the flag going forward doesn't retroactively un-hide existing ones.
 */
export async function POST() {
  const session = await auth();
  if (!session || (session.user.role !== "admin" && session.user.role !== "developer")) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await dbConnect();
    const result = await Product.updateMany(
      { needsReview: true },
      { $set: { needsReview: false } },
    );
    return Response.json({ ok: true, updatedCount: result.modifiedCount });
  } catch (error) {
    console.error("Admin clear-review-flags error:", error);
    return Response.json({ error: error.message || "Something went wrong" }, { status: 500 });
  }
}
