import { auth } from "@/auth";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import Product from "@/models/Product";
import ContactSupport from "@/models/ContactSupport";
import Subscription from "@/models/Subscription";

export async function GET() {
  try {
    const session = await auth();
    if (!session || session.user.role !== "admin" && session.user.role !== "developer") {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    await dbConnect();

    const [
      totalUsers,
      totalStores,
      totalProducts,
      totalSupportTickets,
      subscriptionsByStatus,
      subscriptionsByPlan,
    ] = await Promise.all([
      User.countDocuments({ role: { $ne: "admin" } }),
      User.countDocuments({ role: "store" }),
      Product.countDocuments(),
      ContactSupport.countDocuments(),
      // Group subscriptions by status
      Subscription.aggregate([
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
      // Group subscriptions by plan name
      Subscription.aggregate([
        { $group: { _id: "$planName", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
    ]);

    // Build status map
    const statusMap = {};
    subscriptionsByStatus.forEach((s) => {
      statusMap[s._id] = s.count;
    });

    // Build plan map
    const planBreakdown = subscriptionsByPlan.map((p) => ({
      plan: p._id,
      count: p.count,
    }));

    const totalSubscriptions = subscriptionsByStatus.reduce(
      (sum, s) => sum + s.count,
      0
    );

    return new Response(
      JSON.stringify({
        totalUsers,
        totalStores,
        totalProducts,
        totalSupportTickets,
        subscriptions: {
          total: totalSubscriptions,
          active: statusMap.active || 0,
          canceled: statusMap.canceled || 0,
          pastDue: statusMap.past_due || 0,
          trialing: statusMap.trialing || 0,
          incomplete: statusMap.incomplete || 0,
          byPlan: planBreakdown,
        },
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Admin stats error:", error);
    return new Response(
      JSON.stringify({ error: "Something went wrong" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
