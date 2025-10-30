import { NextResponse } from "next/server";
import Stripe from "stripe";
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  httpClient: Stripe.createFetchHttpClient()
});

export async function GET(req) {
  try { 
    
    const account = await stripe.accounts.create({
      type: "express",
      business_type: "individual", 
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
    });
   
    // Step 2: Create an account link for onboarding
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${
        process.env.NODE_ENV == "development"
          ? `${process.env.NEXT_PUBLIC_FRONTEND_URL}/api/onboarding/refresh?accountId=${account.id}`
          : `${process.env.NEXT_PUBLIC_FRONTEND_LIVE_URL}/api/onboarding/refresh?accountId=${account.id}`
      }`,
      return_url: `${
        process.env.NODE_ENV == "development"
          ? `${process.env.NEXT_PUBLIC_FRONTEND_URL}/dashboard/onboarding/success/${account.id}`
          : `${process.env.NEXT_PUBLIC_FRONTEND_LIVE_URL}/dashboard/onboarding/success/${account.id}`
      }`,
      type: "account_onboarding",
    });

    // Step 3: Send the URL for the user to complete onboarding
    return NextResponse.json({ url: accountLink.url },{status:200});
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}



export async function POST(req) {
  try {
    const { accountId } = await req.json();
  
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${
        process.env.NODE_ENV == "development"
          ? `${process.env.NEXT_PUBLIC_FRONTEND_URL}/api/onboarding/refresh?accountId=${accountId}`
          : `${process.env.NEXT_PUBLIC_FRONTEND_LIVE_URL}/api/onboarding/refresh?accountId=${accountId}`
      }`,
      return_url: `${
        process.env.NODE_ENV == "development"
          ? `${process.env.NEXT_PUBLIC_FRONTEND_URL}/dashboard/onboarding/success/${accountId}`
          : `${process.env.NEXT_PUBLIC_FRONTEND_LIVE_URL}/dashboard/onboarding/success/${accountId}`
      }`,
      type: "account_onboarding",
    });

    // Step 3: Send the URL for the user to complete onboarding
    return NextResponse.json({ url: accountLink.url });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
