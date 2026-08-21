import { auth } from "@/auth";
import dbConnect from "@/lib/db";
import User from "@/models/User";

/**
 * POST /api/dashboard/product-limit-upsell-click
 *
 * Records that a store clicked "Explore Le Stores AI" on the one-time
 * 300-product popup (src/app/dashboard/add-product/page.jsx). "Shown" is
 * tracked server-side at render time; this is the other half — click-through,
 * for measuring conversion later.
 */
export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await dbConnect();
    await User.updateOne(
      { _id: session.user.id },
      { $set: { "productLimitUpsell.ctaClicked": true } },
    );
    return Response.json({ ok: true });
  } catch (error) {
    console.error("product-limit-upsell-click error:", error);
    return Response.json({ error: "Something went wrong" }, { status: 500 });
  }
}
