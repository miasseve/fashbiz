import Product from "@/models/Product";
import dbConnect from "@/lib/db";
import { auth } from "@/auth";
import { soldProductsByIds } from "@/actions/productActions";

export async function GET(request) {
  await dbConnect();
  const url = new URL(request.url);
  const barcode = url.searchParams.get("barcode");
  if (!barcode) {
    return new Response(
      JSON.stringify({ error: "Barcode parameter is required" }),
      { status: 400 }
    );
  }
  try {
    const product = await Product.findOne({ barcode: barcode });
    if (!product) {
      return new Response(JSON.stringify({ error: "Product not found" }), {
        status: 404,
      });
    }
    return new Response(
      JSON.stringify({ productId: product?._id.toString() }),
      { status: 200 }
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
    });
  }
}

// Scan-to-delist — a store owner scans a sold item's barcode and it's
// marked sold + delisted everywhere (same logic a real Shopify sale
// triggers), instead of the scan just opening the product page for a
// manual toggle.
export async function POST(request) {
  const session = await auth();
  if (!session) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  await dbConnect();
  const { barcode } = await request.json();
  if (!barcode) {
    return new Response(JSON.stringify({ error: "Barcode is required" }), { status: 400 });
  }

  const product = await Product.findOne({ barcode });
  if (!product) {
    return new Response(JSON.stringify({ error: "Product not found" }), { status: 404 });
  }
  if (String(product.userId) !== session.user.id) {
    return new Response(JSON.stringify({ error: "This product belongs to a different store" }), { status: 403 });
  }
  if (product.sold) {
    return new Response(JSON.stringify({ error: "Already marked sold", title: product.title }), { status: 400 });
  }

  const result = await soldProductsByIds([product._id]);
  if (result.status && result.status !== 200) {
    return new Response(JSON.stringify({ error: result.message || "Failed to mark sold" }), { status: 500 });
  }

  return new Response(JSON.stringify({ ok: true, title: product.title, productId: String(product._id) }), { status: 200 });
}
