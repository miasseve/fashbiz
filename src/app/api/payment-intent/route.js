import Stripe from "stripe";
import { NextResponse } from "next/server";
import Account from "@/models/Account";
import dbConnect from "@/lib/db";
// Initialize Stripe with your secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(req) {
  try {
    const { payment_method, total ,userId } = await req.json();
    await dbConnect();

    const account = await Account.findOne({ userId:userId });
    if(!account){
      return NextResponse.json({ error: 'Account not exist' }, { status: 400 });
    }
    const paymentIntent = await stripe.paymentIntents.create({
      amount: total * 100,
      currency: "usd",
      description: "Description",
      payment_method: payment_method,
      transfer_data: {
        destination: account.accountId,
      }
    });

    return NextResponse.json({
      client_secret: paymentIntent.client_secret,
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
