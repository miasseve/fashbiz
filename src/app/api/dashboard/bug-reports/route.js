import { auth } from "@/auth";
import dbConnect from "@/lib/db";
import ContactSupport from "@/models/ContactSupport";

export async function GET() {
  try {
    const session = await auth();
    if (!session) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    await dbConnect();
    const reports = await ContactSupport.find({
      userId: session.user.id,
      type: "bug_report",
    })
      .sort({ updatedAt: -1 })
      .lean();

    return new Response(JSON.stringify({ reports }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Bug reports fetch error:", error);
    return new Response(
      JSON.stringify({ error: "Something went wrong" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

export async function POST(req) {
  try {
    const session = await auth();
    if (!session) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    await dbConnect();
    const { subject, message } = await req.json();

    if (!subject || !message) {
      return new Response(
        JSON.stringify({ error: "Subject and message are required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const report = await ContactSupport.create({
      name:
        session.user.name ||
        `${session.user.firstname || ""} ${session.user.lastname || ""}`.trim(),
      email: session.user.email,
      subject,
      message,
      type: "bug_report",
      userId: session.user.id,
      storename: session.user.storename || "",
      role: session.user.role || "",
      messages: [{ sender: "user", message }],
    });

    return new Response(JSON.stringify({ report }), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Bug report create error:", error);
    return new Response(
      JSON.stringify({ error: "Something went wrong" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
