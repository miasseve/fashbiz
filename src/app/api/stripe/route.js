import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function GET(req) {
  try {
    // const { account } = await req.json();
    const account = await stripe.accounts.create({
      type: 'standard',  // You can choose 'express' or 'custom' based on your needs
    });

    // Step 2: Create an account link for onboarding
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `http://localhost:3000/onboarding/refresh`,
      return_url: `http://localhost:3000/onboarding/success`,
      type: 'account_onboarding',
    });

    // Step 3: Send the URL for the user to complete onboarding
    return NextResponse.json({ url: accountLink.url });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}


