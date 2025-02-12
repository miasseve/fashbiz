import Stripe from "stripe";
import { NextResponse } from "next/server";
// Initialize Stripe with your secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(req) {
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: 2000,
      currency: "usd",
    });
    console.log(paymentIntent,'paymentIntent');
    // Send the client_secret back to the frontend to complete the payment
    return NextResponse.json({
      client_secret: paymentIntent.client_secret,
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
