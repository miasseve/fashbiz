import { auth } from "@/auth";
import dbConnect from "@/lib/db";
import Product from "@/models/Product";
import { deleteShopifyProduct } from "@/actions/shopifyAction";

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

/** GET /api/admin/products/:productId — full detail for the admin view page. */
export async function GET(request, { params }) {
  const session = await requireAdmin();
  if (!session) return json({ error: "Unauthorized" }, 401);

  try {
    const { productId } = await params;
    await dbConnect();

    const product = await Product.findById(productId)
      .populate("userId", "firstname lastname storename email phone")
      .lean();

    if (!product) return json({ error: "Product not found" }, 404);

    return json({ product });
  } catch (error) {
    console.error("Admin product detail error:", error);
    return json({ error: "Something went wrong" }, 500);
  }
}

/**
 * DELETE /api/admin/products/:productId
 * Admin-only removal — no ownership check (that's the store-facing delete's
 * job), also cleans up the Shopify listing if this product was synced there.
 */
export async function DELETE(request, { params }) {
  const session = await requireAdmin();
  if (!session) return json({ error: "Unauthorized" }, 401);

  try {
    const { productId } = await params;
    await dbConnect();

    const product = await Product.findById(productId);
    if (!product) return json({ error: "Product not found" }, 404);

    if (product.shopifyProductId) {
      try {
        await deleteShopifyProduct([product]);
      } catch (err) {
        // Don't block the DB deletion if Shopify is unreachable.
        console.error("Shopify cleanup during admin product delete failed:", err);
      }
    }

    await Product.deleteOne({ _id: productId });

    return json({ ok: true });
  } catch (error) {
    console.error("Admin product delete error:", error);
    return json({ error: "Something went wrong" }, 500);
  }
}
