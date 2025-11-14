// app/api/check-subscription/route.js
import Stripe from "stripe";
import { NextResponse } from "next/server";
import User from "@/models/User";
import Subscription from "@/models/Subscription";
import dbConnect from "@/lib/db";
import { archiveProduct, unarchiveProduct } from "@/actions/productActions";
import CronLog from "@/models/CronLogs";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  httpClient: Stripe.createFetchHttpClient(),
});

export async function GET(req) {
  try {
    await dbConnect();

    const subscriptions = await Subscription.find({});

    let updatedCount = 0;
    let deactivatedCount = 0;
    let activatedCount = 0;
    let errorCount = 0;
    let productsArchivedCount = 0;
    let productsUnarchivedCount = 0;

    for (const sub of subscriptions) {
      try {
        const user = await User.findById(sub.userId);
        if (!user) continue;

        // CHECK DB FIELD NAME: stripeSubscriptionId
        const stripeSub = await stripe.subscriptions.retrieve(
          sub.stripeSubscriptionId
        );

        const wasActive = user.isActive;

        const isActive = ["active", "trialing"].includes(stripeSub.status);
        const expired =
          new Date(stripeSub.current_period_end * 1000) < new Date();

        const newStatus = isActive && !expired;

        // Update user
        user.isActive = newStatus;
        user.subscriptionStart = new Date(
          stripeSub.current_period_start * 1000
        );
        user.subscriptionEnd = new Date(stripeSub.current_period_end * 1000);
        await user.save();

        // Update subscription record
        await Subscription.findByIdAndUpdate(sub._id, {
          status: stripeSub.status,
          startDate: new Date(stripeSub.current_period_start * 1000),
          endDate: new Date(stripeSub.current_period_end * 1000),
          cancelAtPeriodEnd: stripeSub.cancel_at_period_end,
        });

        updatedCount++;

        // INACTIVE → archive
        if (wasActive && !newStatus) {
          await archiveProduct(user._id);
          deactivatedCount++;
          productsArchivedCount++;
        }

        // ACTIVE → unarchive
        if (!wasActive && newStatus) {
          await unarchiveProduct(user._id);
          activatedCount++;
          productsUnarchivedCount++;
        }
      } catch (err) {
        errorCount++;
        console.error(`❌ Subscription ${sub._id} failed:`, err.message);
      }
    }

    const summary = {
      success: true,
      timestamp: new Date().toISOString(),
      stats: {
        totalChecked: subscriptions.length,
        updated: updatedCount,
        activated: activatedCount,
        deactivated: deactivatedCount,
        errors: errorCount,
        productsArchived: productsArchivedCount,
        productsUnarchived: productsUnarchivedCount,
      },
    };
    console.log("✅ Subscription check completed:", summary);
    // Log cron run
    await CronLog.create({
      totalChecked: subscriptions.length,
      updated: updatedCount,
      activated: activatedCount,
      deactivated: deactivatedCount,
      errors: errorCount,
      productsArchived: productsArchivedCount,
      productsUnarchived: productsUnarchivedCount,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        message: error.message,
      },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  return GET(req);
}
