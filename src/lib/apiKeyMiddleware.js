import { NextResponse } from "next/server";

// Service-to-service auth for the /api/public/* surface — Discover (or any
// other external caller) sends this key on every request instead of a user
// session, since there's no logged-in person on the other end.
export function requireApiKey(req) {
  const key = req.headers.get("x-api-key");
  if (!key || key !== process.env.REE_API_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}

// Browsers send an OPTIONS preflight before any cross-origin request that
// carries a custom header (x-api-key qualifies) — this responds to it
// without requiring the key, since the actual key check happens on the
// real request that follows. Every /api/public/* route re-exports this.
export function handlePreflight() {
  return new NextResponse(null, { status: 204 });
}
