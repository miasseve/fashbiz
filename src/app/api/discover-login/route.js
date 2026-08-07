import dbConnect from "@/lib/db";
import User from "@/models/User";
import { signIn } from "@/auth";
import { validateDiscoverRedirect, issueSsoCode } from "@/lib/discoverRedirect";

// Real Ree credentials, entered on Ree's own domain (so the httpOnly session
// cookie works normally) — but instead of sending the browser to the Ree
// dashboard, it mints a one-time code and hands the browser back to Discover.
// Discover then exchanges that code server-to-server for the user's identity.
export async function POST(req) {
  try {
    const { email, password, redirectUri } = await req.json();

    const redirectCheck = validateDiscoverRedirect(redirectUri);
    if (!redirectCheck.ok) {
      return Response.json({ error: redirectCheck.error }, { status: redirectCheck.status });
    }

    await dbConnect();

    let result;
    try {
      result = await signIn("credentials", { email, password, redirect: false });
    } catch {
      // NextAuth throws for bad credentials rather than returning { error }
      // when called outside a plain form submit — normalize both to a 401.
      return Response.json({ error: "Invalid email or password" }, { status: 401 });
    }
    if (result?.error) {
      return Response.json({ error: "Invalid email or password" }, { status: 401 });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return Response.json({ error: "Invalid email or password" }, { status: 401 });
    }
    if (user.role !== "consignor") {
      return Response.json(
        { error: "This sign-in is for shopper accounts. Store and brand accounts should use the main Ree login." },
        { status: 403 }
      );
    }

    const code = await issueSsoCode(user._id);

    return Response.json({ ok: true, code });
  } catch (error) {
    console.error("Discover login error:", error);
    return Response.json({ error: "Something went wrong" }, { status: 500 });
  }
}
