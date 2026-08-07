import dbConnect from "@/lib/db";
import User from "@/models/User";
import { registerUser } from "@/actions/authActions";
import { signIn } from "@/auth";
import { validateDiscoverRedirect, issueSsoCode } from "@/lib/discoverRedirect";

// Creates a real Ree account (role: consignor) for someone signing up from
// Discover for the first time, then hands back a one-time code the same way
// discover-login does — same redirect, same exchange, just preceded by
// account creation. Goes through the same registerUser action every other
// signup on Ree uses, so validation/rules never drift between the two.
export async function POST(req) {
  try {
    const { firstname, lastname, email, password, phone, redirectUri } = await req.json();

    const redirectCheck = validateDiscoverRedirect(redirectUri);
    if (!redirectCheck.ok) {
      return Response.json({ error: redirectCheck.error }, { status: redirectCheck.status });
    }

    await dbConnect();

    const normalizedEmail = String(email || "").toLowerCase();
    const result = await registerUser({
      firstname,
      lastname,
      email: normalizedEmail,
      password,
      phone,
      role: "consignor",
    });

    if (result.status !== 200) {
      return Response.json({ error: result.error || "Something went wrong" }, { status: result.status || 400 });
    }

    let signInResult;
    try {
      signInResult = await signIn("credentials", { email: normalizedEmail, password, redirect: false });
    } catch {
      signInResult = { error: true };
    }
    if (signInResult?.error) {
      return Response.json({ error: "Account created — please sign in.", accountCreated: true }, { status: 202 });
    }

    const user = await User.findOne({ email: normalizedEmail });
    const code = await issueSsoCode(user._id);

    return Response.json({ ok: true, code });
  } catch (error) {
    console.error("Discover signup error:", error);
    return Response.json({ error: "Something went wrong" }, { status: 500 });
  }
}
