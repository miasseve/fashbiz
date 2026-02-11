import { auth } from "@/auth";
import dbConnect from "@/lib/db";
import ContactSupport from "@/models/ContactSupport";

export async function PATCH(req, { params }) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "admin") {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    await dbConnect();
    const { id } = await params;
    const { message, status, markRead } = await req.json();

    const report = await ContactSupport.findOne({
      _id: id,
      type: "bug_report",
    });

    if (!report) {
      return new Response(JSON.stringify({ error: "Report not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (message) {
      report.messages.push({ sender: "admin", message });
      report.hasNewReply = true;
      if (!status && report.status === "new") {
        report.status = "in_progress";
      }
    }

    if (status) {
      report.status = status;
    }

    if (markRead) {
      report.isRead = true;
    }

    await report.save();

    return new Response(JSON.stringify({ report: report.toObject() }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Admin bug report update error:", error);
    return new Response(
      JSON.stringify({ error: "Something went wrong" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
