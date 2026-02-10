import { auth } from "@/auth";
import dbConnect from "@/lib/db";
import ContactSupport from "@/models/ContactSupport";

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

    if (!message) {
      return new Response(
        JSON.stringify({ error: "Message is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    await ContactSupport.create({
      name: session.user.name || `${session.user.firstname} ${session.user.lastname}`,
      email: session.user.email,
      subject: subject || "",
      message,
      type: "dashboard",
      userId: session.user.id,
      storename: session.user.storename || "",
    });

    return new Response(
      JSON.stringify({ message: "Support message sent successfully" }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Dashboard support error:", error);
    return new Response(
      JSON.stringify({ error: "Something went wrong" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

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
    const tickets = await ContactSupport.find({ userId: session.user.id })
      .sort({ createdAt: -1 })
      .lean();

    return new Response(JSON.stringify({ tickets }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Dashboard support fetch error:", error);
    return new Response(
      JSON.stringify({ error: "Something went wrong" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
