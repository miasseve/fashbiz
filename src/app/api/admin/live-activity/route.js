import { auth } from "@/auth";
import dbConnect from "@/lib/db";
import ActiveUser from "@/models/Activeuser";

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

    const activeSessions = await ActiveUser.find()
      .populate("userId", "firstname lastname email role storename")
      .sort({ lastActiveAt: -1 })
      .lean();

    return new Response(JSON.stringify({ activeSessions }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Admin live activity error:", error);
    return new Response(
      JSON.stringify({ error: "Something went wrong" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
