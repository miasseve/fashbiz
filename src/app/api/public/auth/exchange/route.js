import dbConnect from "@/lib/db";
import User from "@/models/User";
import SsoCode from "@/models/SsoCode";
import { requireApiKey, handlePreflight } from "@/lib/apiKeyMiddleware";

export async function OPTIONS() {
  return handlePreflight();
}

// Discover calls this server-to-server right after a user completes the
// redirect login on re-e.dk, trading the one-time code for their identity.
export async function POST(req) {
  const unauthorized = requireApiKey(req);
  if (unauthorized) return unauthorized;

  try {
    const { code } = await req.json();
    if (!code) {
      return Response.json({ error: "Missing code" }, { status: 400 });
    }

    await dbConnect();

    const ssoCode = await SsoCode.findOne({ code, used: false, expiresAt: { $gt: new Date() } });
    if (!ssoCode) {
      return Response.json({ error: "Invalid or expired code" }, { status: 400 });
    }
    ssoCode.used = true;
    await ssoCode.save();

    const user = await User.findById(ssoCode.userId).select("firstname lastname email role");
    if (!user) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    return Response.json({
      ok: true,
      userId: String(user._id),
      firstname: user.firstname,
      lastname: user.lastname,
      email: user.email,
      role: user.role,
    });
  } catch (error) {
    console.error("Auth exchange error:", error);
    return Response.json({ error: "Something went wrong" }, { status: 500 });
  }
}
