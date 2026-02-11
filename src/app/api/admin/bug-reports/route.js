import { auth } from "@/auth";
import dbConnect from "@/lib/db";
import ContactSupport from "@/models/ContactSupport";

export async function GET(req) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "admin") {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    await dbConnect();

    const { searchParams } = new URL(req.url);
    const filter = searchParams.get("filter");

    let query = { type: "bug_report" };

    if (filter === "unread") {
      query.isRead = { $ne: true };
    } else if (filter === "new") {
      query.status = "new";
    } else if (filter === "in_progress") {
      query.status = "in_progress";
    } else if (filter === "resolved") {
      query.status = "resolved";
    }

    const reports = await ContactSupport.find(query)
      .sort({ updatedAt: -1 })
      .lean();

    const unreadCount = await ContactSupport.countDocuments({
      type: "bug_report",
      isRead: { $ne: true },
    });

    return new Response(JSON.stringify({ reports, unreadCount }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Admin bug reports error:", error);
    return new Response(
      JSON.stringify({ error: "Something went wrong" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

export async function DELETE(req) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "admin") {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    await dbConnect();
    const { reportId } = await req.json();

    if (!reportId) {
      return new Response(
        JSON.stringify({ error: "Report ID is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const report = await ContactSupport.findOneAndDelete({
      _id: reportId,
      type: "bug_report",
    });

    if (!report) {
      return new Response(
        JSON.stringify({ error: "Report not found" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify({ message: "Report deleted" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Admin bug report delete error:", error);
    return new Response(
      JSON.stringify({ error: "Something went wrong" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
