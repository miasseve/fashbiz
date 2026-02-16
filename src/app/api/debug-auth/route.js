import { NextResponse } from "next/server";
import { auth } from "@/auth";

// Temporary debug endpoint — remove after fixing auth issue
export async function GET(req) {
  const session = await auth();

  const cookieHeader = req.headers.get("cookie") || "";
  const hasSessionToken =
    cookieHeader.includes("authjs.session-token") ||
    cookieHeader.includes("__Secure-authjs.session-token");

  return NextResponse.json({
    hasSession: !!session,
    sessionUser: session?.user?.email || null,
    hasAuthSecret: !!process.env.AUTH_SECRET,
    authSecretLength: process.env.AUTH_SECRET?.length || 0,
    hasTrustHost: process.env.AUTH_TRUST_HOST || "not set",
    authUrl: process.env.AUTH_URL || "not set",
    nodeEnv: process.env.NODE_ENV,
    hasSessionCookie: hasSessionToken,
    cookieNames: cookieHeader
      .split(";")
      .map((c) => c.trim().split("=")[0])
      .filter(Boolean),
    requestUrl: req.url,
  });
}
