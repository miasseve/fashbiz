import Stripe from "stripe";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import dbConnect from "@/lib/db";
import { decrypt } from "@/actions/encryption";
import RefferralDetails from "@/models/Referral";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(req) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  try {
    await dbConnect();
    const body = await req.json();
    const { priceId, referral } = body;
    let referralCode = null;
    if (referral) {
      try {
        referralCode = await decrypt(referral);
      } catch (err) {
        console.warn("Referral decryption failed:", err.message);
      }
    }

    if (referralCode) {
      const referralDoc = await RefferralDetails.findOne({
        referredTouser_id: userId,
        referralCode,
      });

      if (referralDoc) {
        referralDoc.used = true;
        referralDoc.usedAt = new Date();
        await referralDoc.save();
      }
    }
    const baseUrl =
      process.env.NODE_ENV === "production"
        ? process.env.NEXT_PUBLIC_FRONTEND_LIVE_URL
        : process.env.NEXT_PUBLIC_FRONTEND_URL;

    const stripePrice = await stripe.prices.retrieve(priceId);
    const isOneTime = stripePrice.type === "one_time";

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: isOneTime ? "payment" : "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${baseUrl}/subscription-plan?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/cancel`,
      client_reference_id: userId,
      metadata: {
        userId,
        ...(isOneTime && { type: "plan_purchase", planPriceId: priceId }),
      },
    });

    return Response.json({ url: checkoutSession.url });
  } catch (error) {
    console.error("Stripe error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
