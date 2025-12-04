import Product from "@/models/Product";
import dbConnect from "@/lib/db";

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
