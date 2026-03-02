import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { bulkSyncMetafieldsToShopify } from "@/actions/shopifyAction";

// POST: Bulk sync points_value and store_label metafields to Shopify for all products
export async function POST(req) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const results = await bulkSyncMetafieldsToShopify();

    return NextResponse.json(
      {
        message: `Sync complete. Synced: ${results.synced}, Skipped: ${results.skipped}, Failed: ${results.failed}`,
        ...results,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Bulk sync error:", error);
    return NextResponse.json(
      { error: `Sync failed: ${error.message}` },
      { status: 500 }
    );
  }
}
