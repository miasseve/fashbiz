import { auth } from "@/auth";
import { resolveStoreForUser } from "@/lib/shopifyStoreResolver";

function json(body, status) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

/**
 * GET /api/developer/shopify-store-resolver?userId=<id>
 *
 * Test-only, developer/admin-only helper for verifying store routing before
 * any real caller uses it. Reports which store a given user resolves to and
 * how (OAuth vs the base-store env fallback) — never the access token.
 */
export async function GET(request) {
  try {
    const session = await auth();
    const role = session?.user?.role;

    if (!session || (role !== "admin" && role !== "developer")) {
      return json({ error: "Unauthorized" }, 401);
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return json({ error: "userId query param is required" }, 400);
    }

    const { source, storeDomain } = await resolveStoreForUser(userId);

    return json({ userId, source, storeDomain }, 200);
  } catch (error) {
    console.error("Shopify store resolver test route error:", error.message);
    return json({ error: "Something went wrong" }, 500);
  }
}
