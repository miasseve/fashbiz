import Stripe from "stripe";
import dbConnect from "@/lib/db";
import { decrypt } from "@/actions/encryption";
import RefferralDetails from "@/models/Referral";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(req) {
  try {
    await dbConnect();
    const body = await req.json();
    const { priceId, userId, referral } = body;
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

    // Create a Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId, // must be a valid Stripe Price ID
          quantity: 1,
        },
      ],
      success_url: `${baseUrl}/subscription-plan?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/cancel`,
      client_reference_id: userId,
      metadata: {
        userId,
      },
    });

    return Response.json({ url: session.url });
  } catch (error) {
    console.error("Stripe error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
