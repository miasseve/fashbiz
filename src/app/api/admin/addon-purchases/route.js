import dbConnect from "@/lib/db";
import AddOnPurchase from "@/models/AddOnPurchase";
import { auth } from "@/auth";

export async function GET(req) {
  try {
    await dbConnect();
    const session = await auth();
    if (session?.user?.role !== "admin") {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status"); // "paid", "pending", "all"

    const query = {};
    if (status && status !== "all") {
      query.status = status;
    }

    const purchases = await AddOnPurchase.find(query)
      .populate("userId", "firstname lastname storename email")
      .populate("productId", "title sku barcode")
      .sort({ createdAt: -1 })
      .limit(200)
      .lean();

    // Calculate totals
    const allPaid = await AddOnPurchase.find({ status: "paid" }).lean();
    const totals = {
      totalPurchases: allPaid.length,
      totalRevenue: allPaid.reduce((sum, p) => sum + (p.totalAmount || 0), 0),
      pendingCount: await AddOnPurchase.countDocuments({ status: "pending" }),
      usedCount: await AddOnPurchase.countDocuments({ status: "paid", productId: { $ne: null } }),
      unusedCount: await AddOnPurchase.countDocuments({ status: "paid", productId: null }),
    };

    return Response.json({ purchases, totals });
  } catch (error) {
    console.error("Error fetching add-on purchases:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
