import { auth } from "@/auth";
import dbConnect from "@/lib/db";
import Transaction from "@/models/Transaction";
import User from "@/models/User";

export async function GET(req) {
  try {
    const session = await auth();
    if (
      !session ||
      (session.user.role !== "admin" && session.user.role !== "developer")
    ) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    await dbConnect();

    const { searchParams } = new URL(req.url);
    const storeId = searchParams.get("storeId");
    const paid = searchParams.get("paid"); // "true", "false", or null (all)

    // Base filter: only shopify transactions with a platform fee
    const filter = {
      channel: "shopify",
      platformFeeAmount: { $gt: 0 },
    };

    if (storeId) filter.userId = storeId;
    if (paid === "true") filter.platformFeePaid = true;
    if (paid === "false") filter.platformFeePaid = false;

    // Per-store fee summary
    const storeSummary = await Transaction.aggregate([
      { $match: filter },
      {
        $group: {
          _id: "$userId",
          totalSales: { $sum: "$amount" },
          totalFees: { $sum: "$platformFeeAmount" },
          paidFees: {
            $sum: {
              $cond: ["$platformFeePaid", "$platformFeeAmount", 0],
            },
          },
          unpaidFees: {
            $sum: {
              $cond: ["$platformFeePaid", 0, "$platformFeeAmount"],
            },
          },
          transactionCount: { $sum: 1 },
          lastTransaction: { $max: "$createdAt" },
        },
      },
      { $sort: { unpaidFees: -1 } },
    ]);

    // Populate store owner details
    const userIds = storeSummary.map((s) => s._id);
    const users = await User.find({ _id: { $in: userIds } })
      .select("firstname lastname email storename subscriptionType")
      .lean();

    const userMap = {};
    for (const u of users) {
      userMap[u._id.toString()] = u;
    }

    const stores = storeSummary.map((s) => {
      const user = userMap[s._id.toString()] || {};
      return {
        userId: s._id,
        storename: user.storename || `${user.firstname || ""} ${user.lastname || ""}`.trim(),
        email: user.email || "",
        subscriptionType: user.subscriptionType || "",
        totalSales: s.totalSales,
        totalFees: s.totalFees,
        paidFees: s.paidFees,
        unpaidFees: s.unpaidFees,
        transactionCount: s.transactionCount,
        lastTransaction: s.lastTransaction,
      };
    });

    // Overall totals
    const totals = stores.reduce(
      (acc, s) => ({
        totalSales: acc.totalSales + s.totalSales,
        totalFees: acc.totalFees + s.totalFees,
        paidFees: acc.paidFees + s.paidFees,
        unpaidFees: acc.unpaidFees + s.unpaidFees,
        transactionCount: acc.transactionCount + s.transactionCount,
      }),
      { totalSales: 0, totalFees: 0, paidFees: 0, unpaidFees: 0, transactionCount: 0 }
    );

    return new Response(
      JSON.stringify({ stores, totals }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Platform fees API error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

// Mark fees as paid for a store
export async function PATCH(req) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "admin") {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    await dbConnect();

    const { userId } = await req.json();
    if (!userId) {
      return new Response(
        JSON.stringify({ error: "userId is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const result = await Transaction.updateMany(
      {
        userId,
        channel: "shopify",
        platformFeeAmount: { $gt: 0 },
        platformFeePaid: false,
      },
      { $set: { platformFeePaid: true } }
    );

    return new Response(
      JSON.stringify({ success: true, updated: result.modifiedCount }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Platform fees PATCH error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
