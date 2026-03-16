import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import { auth } from "@/auth";

export async function GET(req) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const userId = req.nextUrl.searchParams.get("userId");

    if (!userId) return NextResponse.json({ paymentMethods: [] });

    // Ensure the session user can only fetch their own payment methods
    if (session.user.id.toString() !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const user = await User.findById(userId);
    if (!user || !user.stripeCustomerId) {
      return NextResponse.json({ paymentMethods: [] });
    }

    const methods = await stripe.paymentMethods.list({
      customer: user.stripeCustomerId,
      type: "card",
    });

    return NextResponse.json({ paymentMethods: methods.data });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
