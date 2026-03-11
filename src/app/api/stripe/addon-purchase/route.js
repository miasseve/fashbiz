import dbConnect from "@/lib/db";
import AddOnPurchase from "@/models/AddOnPurchase";
import { auth } from "@/auth";

// GET - check if user has a valid (paid, unused) add-on purchase
export async function GET(req) {
  try {
    await dbConnect();
    const session = await auth();
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const purchaseId = searchParams.get("purchaseId");

    let query = { userId: session.user.id, status: "paid", productId: null };
    if (purchaseId) {
      query._id = purchaseId;
    }

    const purchase = await AddOnPurchase.findOne(query).sort({ paidAt: -1 });

    if (!purchase) {
      return Response.json({ hasPurchase: false });
    }

    return Response.json({
      hasPurchase: true,
      purchase: {
        id: purchase._id,
        addOns: purchase.addOns,
        totalAmount: purchase.totalAmount,
        paidAt: purchase.paidAt,
      },
    });
  } catch (error) {
    console.error("Error checking add-on purchase:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

// PATCH - link a product to an add-on purchase after product creation
export async function PATCH(req) {
  try {
    await dbConnect();
    const session = await auth();
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { purchaseId, productId } = await req.json();

    const purchase = await AddOnPurchase.findOneAndUpdate(
      { _id: purchaseId, userId: session.user.id, status: "paid", productId: null },
      { productId },
      { new: true }
    );

    if (!purchase) {
      return Response.json({ error: "Purchase not found or already used" }, { status: 404 });
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error("Error linking product to add-on:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
