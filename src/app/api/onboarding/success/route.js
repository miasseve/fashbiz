// pages/api/onboarding/refresh.js
import Stripe from "stripe";
import { NextResponse } from "next/server";
import Account from "@/models/Account";
import { auth } from "@/auth";
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
export async function GET(req) {
  try {
    const url = new URL(req.url);
    const session = await auth();
    const accountId = url.searchParams.get("accountId");

    if (!accountId) {
      return NextResponse.json(
        { message: "Account ID is required." },
        { status: 400 }
      );
    }

    // Retrieve the account from Stripe
    const account = await stripe.accounts.retrieve(accountId);
    const isChargesEnabled = account.charges_enabled;
    const isPayoutsEnabled = account.payouts_enabled;

    const missingRequirements =
      account.requirements && account.requirements.currently_due.length > 0;
    const eventuallyDueRequirements =
      account.requirements && account.requirements.eventually_due.length > 0;

    // Determine if the account is fully filled (i.e., complete and enabled)
    const isAccountComplete =
      isChargesEnabled &&
      isPayoutsEnabled &&
      !missingRequirements &&
      !eventuallyDueRequirements;
    // Check if the account document exists for the user
    const existingAccount = await Account.findOne({ userId: session.user.id });
     
    if (existingAccount) {
    
      existingAccount.accountId = accountId;
      existingAccount.isAccountComplete=isAccountComplete;
      existingAccount.percentage=existingAccount.percentage;
    
      await existingAccount.save(); 

      return NextResponse.json({message:'Account updated successfully'},{ status: 200 });
    } else {
      const newAccount = new Account({
        userId: session.user.id,
        accountId: accountId,
        isAccountComplete:isAccountComplete
      });
      await newAccount.save();
      return NextResponse.json({message:'Account created successfully'},{ status: 200 });
    }

  } catch (error) {
    return NextResponse.json(
      { message: "An error occurred while refreshing the onboarding process." },
      { status: 500 }
    );
  }
}
