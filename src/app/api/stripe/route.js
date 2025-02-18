import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function GET(req) {
  try {
    // const { account } = await req.json();
    // const existingAccount = await stripe.accounts.list();

    //  const deleted = await stripe.accounts.del('acct_1QtjhXPDISO7MzkJ');
    //  await stripe.accounts.del('acct_1QtRJuPCoiaW3x5A');

    //     console.log(deleted, "existingAccount");
    const account = await stripe.accounts.create({
      type: 'standard',
    });
    
    // const account = await stripe.accounts.create({
    //   country: "DK",
    //   type: "express",
    //   business_type: "individual", // Specify business type
    //   capabilities: {
    //     card_payments: { requested: true },
    //     transfers: { requested: true },
    //   },
    // });
    // // // Step 2: Create an account link for onboarding
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${
        process.env.NODE_ENV == "development"
          ? `http://localhost:3000/api/onboarding/refresh?accountId=${account.id}`
          : `https://fash-roan.vercel.app/api/onboarding/refresh?accountId=${account.id}`
      }`,
      return_url: `${
        process.env.NODE_ENV == "development"
          ? `http://localhost:3000/dashboard/onboarding/success/${account.id}`
          : `https://fash-roan.vercel.app/dashboard/onboarding/success/${account.id}`
      }`,
      type: "account_onboarding",
    });

    // Step 3: Send the URL for the user to complete onboarding
    return NextResponse.json({ url: accountLink.url });
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
          ? `http://localhost:3000/api/onboarding/refresh?accountId=${accountId}`
          : `https://fash-roan.vercel.app/api/onboarding/refresh?accountId=${accountId}`
      }`,
      return_url: `${
        process.env.NODE_ENV == "development"
          ? `http://localhost:3000/dashboard/onboarding/success/${accountId}`
          : `https://fash-roan.vercel.app/dashboard/onboarding/success/${accountId}`
      }`,
      type: "account_onboarding",
    });

    // Step 3: Send the URL for the user to complete onboarding
    return NextResponse.json({ url: accountLink.url });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
