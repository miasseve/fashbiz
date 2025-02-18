// pages/api/onboarding/refresh.js
import Stripe from "stripe";
import { NextResponse } from "next/server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
export async function GET(req) {
  try {
    const url = new URL(req.url);

    const accountId = url.searchParams.get("accountId");
    if (!accountId) {
      return NextResponse.json(
        { message: "Account ID is required." },
        { status: 400 }
      );
    }

    // Retrieve the account from Stripe
    const account = await stripe.accounts.retrieve(accountId);

    if (account.requirements && account.requirements.currently_due.length > 0) {
      const accountLink = await stripe.accountLinks.create({
        account: account.id,
        refresh_url:
          process.env.NODE_ENV === "development"
            ? `http://localhost:3000/api/onboarding/refresh?accountId=${account.id}`
            : `https://fash-roan.vercel.app/api/onboarding/refresh?accountId=${account.id}`,
        return_url:
          process.env.NODE_ENV === "development"
            ? `http://localhost:3000/api/onboarding/success?accountId=${account.id}`
            : `https://fash-roan.vercel.app/onboarding/success?accountId=${account.id}`,
        type: "account_onboarding",
      });

      return NextResponse.redirect(accountLink.url);
    }

    // If onboarding is complete, send a success response
    return NextResponse.json(
      { message: "Account onboarding is complete or not required." },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error during refresh:", error);
    return NextResponse.json(
      { message: "An error occurred while refreshing the onboarding process." },
      { status: 500 }
    );
  }
}
