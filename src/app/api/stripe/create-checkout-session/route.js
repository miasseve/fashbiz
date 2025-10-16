import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(req) {
  try {
    const body = await req.json();
    const { priceId, userId } = body;

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
      success_url: `http://localhost:3000/dashboard/subscription-plan?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `http://localhost:3000/cancel`,
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
