import { auth } from "@/auth";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import ContactSupport from "@/models/ContactSupport";

export async function GET() {
  try {
    const session = await auth();
    if (!session || session.user.role !== "admin") {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    await dbConnect();

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(todayStart);
    weekStart.setDate(weekStart.getDate() - 7);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

    // Recent activity: last 10 signups + last 10 support messages, merged & sorted
    // Note: Use $toDate on _id as fallback for users created before timestamps were enabled
    const [recentSignups, recentSupport, activeStoresToday, activeStoresWeek, newSignupsMonthResult, signupsByMonth] =
      await Promise.all([
        User.aggregate([
          { $match: { role: { $ne: "admin" } } },
          { $addFields: { joinedDate: { $ifNull: ["$createdAt", { $toDate: "$_id" }] } } },
          { $sort: { joinedDate: -1 } },
          { $limit: 10 },
          { $project: { firstname: 1, lastname: 1, email: 1, role: 1, joinedDate: 1 } },
        ]),
        ContactSupport.find()
          .sort({ createdAt: -1 })
          .limit(10)
          .select("name email message createdAt")
          .lean(),
        // Active stores today (stores that were created or updated today)
        User.countDocuments({
          role: "store",
          isActive: true,
          updatedAt: { $gte: todayStart },
        }),
        // Active stores this week
        User.countDocuments({
          role: "store",
          isActive: true,
          updatedAt: { $gte: weekStart },
        }),
        // New signups this month (using aggregation for ObjectId fallback)
        User.aggregate([
          { $match: { role: { $ne: "admin" } } },
          { $addFields: { joinedDate: { $ifNull: ["$createdAt", { $toDate: "$_id" }] } } },
          { $match: { joinedDate: { $gte: monthStart } } },
          { $count: "total" },
        ]),
        // Signups over last 6 months for chart (using ObjectId fallback)
        User.aggregate([
          { $match: { role: { $ne: "admin" } } },
          { $addFields: { joinedDate: { $ifNull: ["$createdAt", { $toDate: "$_id" }] } } },
          { $match: { joinedDate: { $gte: sixMonthsAgo } } },
          {
            $group: {
              _id: {
                year: { $year: "$joinedDate" },
                month: { $month: "$joinedDate" },
              },
              count: { $sum: 1 },
            },
          },
          { $sort: { "_id.year": 1, "_id.month": 1 } },
        ]),
      ]);

    const newSignupsMonth = newSignupsMonthResult.length > 0 ? newSignupsMonthResult[0].total : 0;

    // Build timeline: merge signups and support messages
    const timeline = [
      ...recentSignups.map((u) => ({
        type: "signup",
        name: `${u.firstname} ${u.lastname}`,
        email: u.email,
        role: u.role,
        date: u.joinedDate,
      })),
      ...recentSupport.map((s) => ({
        type: "support",
        name: s.name,
        email: s.email,
        message: s.message,
        date: s.createdAt,
      })),
    ]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 10);

    // Build last 6 months chart data (always show all 6, fill 0 for empty months)
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const signupMap = {};
    signupsByMonth.forEach((item) => {
      signupMap[`${item._id.year}-${item._id.month}`] = item.count;
    });

    const chartData = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
      chartData.push({
        month: `${monthNames[d.getMonth()]} ${d.getFullYear()}`,
        signups: signupMap[key] || 0,
      });
    }

    return new Response(
      JSON.stringify({
        timeline,
        quickStats: {
          activeStoresToday,
          activeStoresWeek,
          newSignupsMonth,
        },
        chartData,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Admin dashboard error:", error);
    return new Response(
      JSON.stringify({ error: "Something went wrong" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
