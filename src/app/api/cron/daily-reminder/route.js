import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import Product from "@/models/Product";
import Notification from "@/models/Notification";

// Daily nudge for free-plan stores with active listings — since a free
// store isn't synced with Ree, there's no way to know what actually sold in
// their shop, so this is a generic reminder ("delist what sold, or upgrade
// to automate it"), not based on any detected sale. Only stores that
// currently have at least one live (not sold, not archived) product get
// one — an empty free store has nothing to remind them to delist.
export async function GET() {
  try {
    await dbConnect();

    const freeStores = await User.find({ role: "store", subscriptionType: "free" }).select("_id");
    const freeStoreIds = freeStores.map((s) => s._id);

    const storeIdsWithListings = await Product.distinct("userId", {
      userId: { $in: freeStoreIds },
      sold: false,
      archived: false,
    });

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    let sent = 0;
    let skipped = 0;

    for (const storeId of storeIdsWithListings) {
      // Idempotent — a cron re-run or overlapping trigger on the same day
      // shouldn't send a second reminder.
      const alreadySentToday = await Notification.findOne({
        userId: storeId,
        type: "reminder",
        createdAt: { $gte: startOfToday },
      });
      if (alreadySentToday) {
        skipped++;
        continue;
      }

      await Notification.create({
        userId: storeId,
        type: "reminder",
        title: "Sold something today?",
        message: "Remove any items you've sold in-store so they don't stay listed. Upgrade to a paid plan and Ree delists automatically for you — see Subscription in your dashboard.",
      });
      sent++;
    }

    return NextResponse.json({ success: true, sent, skipped, eligible: storeIdsWithListings.length });
  } catch (error) {
    console.error("Daily reminder cron error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST() {
  return GET();
}
