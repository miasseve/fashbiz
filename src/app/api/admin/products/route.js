import { auth } from "@/auth";
import dbConnect from "@/lib/db";
import Product from "@/models/Product";

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

    const products = await Product.find()
      .populate("userId", "firstname lastname storename email")
      .select("title brand category price sold archived createdAt images size")
      .sort({ createdAt: -1 })
      .lean();

    return new Response(JSON.stringify({ products }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Admin products error:", error);
    return new Response(
      JSON.stringify({ error: "Something went wrong" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
