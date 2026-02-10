import { auth } from "@/auth";
import dbConnect from "@/lib/db";
import User from "@/models/User";

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

    const users = await User.find({ role: { $ne: "admin" } })
      .select(
        "firstname lastname email role storename brandname isActive isProfileComplete phone country city businessNumber products createdAt"
      )
      .sort({ _id: -1 })
      .lean();

    // Add productCount from the products array length
    const usersWithCount = users.map((u) => ({
      ...u,
      productCount: u.products ? u.products.length : 0,
    }));

    return new Response(JSON.stringify({ users: usersWithCount }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Admin users error:", error);
    return new Response(
      JSON.stringify({ error: "Something went wrong" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
