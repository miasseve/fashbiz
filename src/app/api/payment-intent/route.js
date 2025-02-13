import Stripe from "stripe";
import { NextResponse } from "next/server";
// Initialize Stripe with your secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(req) {
  try { 
    const paymentIntent = await stripe.paymentIntents.create({
      amount: 2000, 
      currency: "usd",
      description: "Description ",
  
      transfer_data: {
        destination: "acct_1QrQJABT70Yf1V6U", 
      },
      application_fee_amount: Math.round(2000 * 0.20)
    });
    console.log(paymentIntent,'paymentIntent');
   
    return NextResponse.json({
      client_secret: paymentIntent.client_secret,
    });
  } catch (error) {
    console.log(error.message);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
