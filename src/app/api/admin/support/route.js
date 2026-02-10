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
    const type = searchParams.get("type");
    const filter = searchParams.get("filter");

    let query = {};

    // Type filter with backward compatibility for existing docs without type field
    if (type === "public") {
      query.$or = [{ type: "public" }, { type: { $exists: false } }];
    } else if (type === "dashboard") {
      query.type = "dashboard";
    }

    // Status filter
    if (filter === "unread") {
      query.isRead = { $ne: true };
    } else if (filter === "resolved") {
      query.status = "resolved";
    }

    const tickets = await ContactSupport.find(query)
      .sort({ createdAt: -1 })
      .lean();

    // Unread count across all tickets
    const unreadCount = await ContactSupport.countDocuments({
      isRead: { $ne: true },
    });

    return new Response(JSON.stringify({ tickets, unreadCount }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Admin support error:", error);
    return new Response(
      JSON.stringify({ error: "Something went wrong" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

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
    const { ticketId, status, isRead, adminReply } = await req.json();

    if (!ticketId) {
      return new Response(
        JSON.stringify({ error: "Ticket ID is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const updateData = {};
    if (status) updateData.status = status;
    if (typeof isRead === "boolean") updateData.isRead = isRead;
    if (adminReply !== undefined && adminReply !== "") {
      updateData.adminReply = adminReply;
      updateData.repliedAt = new Date();
      if (!status) updateData.status = "in_progress";
    }

    const ticket = await ContactSupport.findByIdAndUpdate(
      ticketId,
      updateData,
      { new: true }
    ).lean();

    if (!ticket) {
      return new Response(
        JSON.stringify({ error: "Ticket not found" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify({ ticket }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Admin support update error:", error);
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
    const { ticketId } = await req.json();

    if (!ticketId) {
      return new Response(
        JSON.stringify({ error: "Ticket ID is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const ticket = await ContactSupport.findByIdAndDelete(ticketId);

    if (!ticket) {
      return new Response(
        JSON.stringify({ error: "Ticket not found" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify({ message: "Ticket deleted" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Admin support delete error:", error);
    return new Response(
      JSON.stringify({ error: "Something went wrong" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
