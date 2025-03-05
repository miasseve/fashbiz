"use server";
import Account from "@/models/Account";
import User from "@/models/User";
import Stripe from "stripe";
import dbConnect from "@/lib/db";
import { auth } from "@/auth";

// Function to store accountId in the database
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function getQRData() {
  try {
    const session = await auth();
    if (!session) {
      return { status: 400, error: "Invalid User" };
    }
    await dbConnect();
    const user = await User.findById(session.user.id);
    const account = await Account.findOne({ userId: session.user.id });
    const userData = {
      firstName: user.firstname,
      lastName: user.lastname,
      email: session.user.email,
      accountId: account?.accountId || "",
    };
    return {
      status: 200,
      qrData: userData || "",
    };
  } catch (error) {
    return {
      status: 400,
      error: error.message || "An error occurred while retrieving QR Data",
    };
  }
}
export async function getAccountId() {
  try {
    const session = await auth();
    if (!session) {
      return { status: 400, error: "Invalid User" };
    }
    await dbConnect();
    const account = await Account.findOne({ userId: session.user.id });

    return {
      status: 200,
      accountId: account?.accountId || "",
      isAccountComplete: account?.isAccountComplete || false,
    };
  } catch (error) {
    return {
      status: 400,
      error: error.message || "An error occurred while retrieving accountId",
    };
  }
}
export async function storeSuccessResult(accountId) {
  try {
    const session = await auth();
    if (!session) {
      return { status: 400, error: "Invalid User" };
    }
    if (!accountId) {
      return {
        status: 400,
        error: "Account ID is required.",
      };
    }

    // Retrieve the account from Stripe
    const account = await stripe.accounts.retrieve(accountId);
    if (!account) {
      return {
        status: 400,
        error: "Account not found.",
      };
    }
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
      existingAccount.isAccountComplete = isAccountComplete;
      await existingAccount.save();
      return {
        status: 200,
        message: "Account updated successfully",
      };
    } else {
      const newAccount = new Account({
        userId: session.user.id,
        accountId: accountId,
        isAccountComplete: isAccountComplete,
      });
      await newAccount.save();
      return {
        status: 200,
        message: "Account created successfully",
      };
    }
  } catch (error) {
    return {
      status: 500,
      error: "An error occurred while refreshing the onboarding process.",
    };
  }
}
