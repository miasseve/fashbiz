import { auth } from "@/auth";
import dbConnect from "@/lib/db";
import Product from "@/models/Product";
import { deleteShopifyProduct } from "@/actions/shopifyAction";
import { CATEGORIES, ALL_SUBCATEGORIES } from "@/lib/taxonomy";

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
 * PATCH /api/admin/products/:productId
 * Admin-only edit — mainly for fixing bad data (e.g. a category that isn't
 * in the real taxonomy) without needing the store to log in and do it.
 */
export async function PATCH(request, { params }) {
  const session = await requireAdmin();
  if (!session) return json({ error: "Unauthorized" }, 401);

  try {
    const { productId } = await params;
    const body = await request.json();
    await dbConnect();

    const product = await Product.findById(productId);
    if (!product) return json({ error: "Product not found" }, 404);

    const update = {};

    if (body.title !== undefined) update.title = String(body.title).trim();
    if (body.brand !== undefined) update.brand = String(body.brand).trim();
    if (body.sku !== undefined) update.sku = String(body.sku).trim();
    if (body.fabric !== undefined) update.fabric = String(body.fabric).trim();
    if (body.description !== undefined) update.description = String(body.description).trim();
    if (body.condition_notes !== undefined) update.condition_notes = String(body.condition_notes).trim();

    if (body.category !== undefined) {
      if (!CATEGORIES.includes(body.category)) {
        return json({ error: `"${body.category}" is not a valid category` }, 400);
      }
      update.category = body.category;
    }

    if (body.subcategory !== undefined) {
      if (body.subcategory && !ALL_SUBCATEGORIES.includes(body.subcategory)) {
        return json({ error: `"${body.subcategory}" is not a valid sub category` }, 400);
      }
      update.subcategory = body.subcategory;
    }

    if (body.condition_grade !== undefined) {
      if (body.condition_grade && !["A", "B", "C"].includes(body.condition_grade)) {
        return json({ error: "Condition must be A, B or C" }, 400);
      }
      update.condition_grade = body.condition_grade || null;
    }

    if (body.price !== undefined) {
      const price = Number(body.price);
      if (!Number.isFinite(price) || price < 0) {
        return json({ error: "Price must be a valid number" }, 400);
      }
      update.price = price;
    }

    if (body.size !== undefined) {
      update.size = Array.isArray(body.size)
        ? body.size
        : String(body.size).split(",").map((s) => s.trim()).filter(Boolean);
    }

    if (body.colorName !== undefined) {
      update.color = { ...product.color, name: String(body.colorName).trim() || "No Color" };
    }

    await Product.updateOne({ _id: productId }, { $set: update });

    return json({ ok: true });
  } catch (error) {
    console.error("Admin product edit error:", error);
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
