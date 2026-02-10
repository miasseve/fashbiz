import dbConnect from "@/lib/db";
import ContactSupport from "@/models/ContactSupport";

export async function POST(req) {
  try {
    await dbConnect();
    const { name, email, message } = await req.json();

    if (!name || !email || !message) {
      return new Response(
        JSON.stringify({ status: 400, error: "All fields are required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    await ContactSupport.create({ name, email, message, type: "public" });

    return new Response(
      JSON.stringify({
        status: 200,
        message: "Your message has been submitted successfully",
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Contact support error:", error);
    return new Response(
      JSON.stringify({ status: 500, error: "Something went wrong" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
