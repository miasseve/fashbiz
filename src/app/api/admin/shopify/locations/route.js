import { auth } from "@/auth";
import { resolveStoreForUser } from "@/lib/shopifyStoreResolver";
import { getShopifyLocations } from "@/actions/shopifyAction";

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

async function requireAdmin() {
  const session = await auth();
  if (!session || (session.user.role !== "admin" && session.user.role !== "developer")) {
    return null;
  }
  return session;
}

/**
 * GET /api/admin/shopify/locations?userId=<store owner's id>
 *
 * Lists the locations (shops) on that owner's own connected Shopify, so the
 * one that should receive new stock can be set with
 * scripts/set-store-shopify-settings.js --default-location <gid>.
 *
 * Admin/developer only.
 */
export async function GET(request) {
  const session = await requireAdmin();
  if (!session) return json({ error: "Unauthorized" }, 401);

  try {
    const userId = new URL(request.url).searchParams.get("userId");
    if (!userId) return json({ error: "userId is required" }, 400);

    const resolved = await resolveStoreForUser(userId);
    if (resolved.source === "env") {
      return json({ error: "This user has no connected Shopify store" }, 404);
    }
    if (resolved.source === "oauth-unavailable") {
      return json(
        { error: `The connection to ${resolved.storeDomain} is not usable: ${resolved.reason}` },
        409
      );
    }

    const locations = await getShopifyLocations(resolved);
    return json({
      storeDomain: resolved.storeDomain,
      defaultLocationId: resolved.defaultLocationId,
      locations: locations.map((l) => ({ id: l.id, name: l.name, isActive: l.isActive })),
    });
  } catch (error) {
    console.error("[admin/shopify/locations] GET error:", error.message);
    return json({ error: "Something went wrong" }, 500);
  }
}
