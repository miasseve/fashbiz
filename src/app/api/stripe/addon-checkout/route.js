import Stripe from "stripe";
import dbConnect from "@/lib/db";
import AddOnPurchase from "@/models/AddOnPurchase";
import User from "@/models/User";
import { ADD_ONS, calculateTotal } from "@/lib/addOnConfig";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(req) {
  try {
    await dbConnect();
    const { userId, addOns, paymentMethodId } = await req.json();

    if (!userId || !addOns || !Array.isArray(addOns) || addOns.length === 0) {
      return Response.json(
        { error: "userId and addOns array are required" },
        { status: 400 }
      );
    }

    if (!paymentMethodId) {
      return Response.json(
        { error: "paymentMethodId is required" },
        { status: 400 }
      );
    }

    // Validate all add-on keys
    const validKeys = Object.keys(ADD_ONS);
    const invalidKeys = addOns.filter((k) => !validKeys.includes(k));
    if (invalidKeys.length > 0) {
      return Response.json(
        { error: `Invalid add-on keys: ${invalidKeys.join(", ")}` },
        { status: 400 }
      );
    }

    // Must include complete_adds (base feature)
    if (!addOns.includes("complete_adds")) {
      return Response.json(
        { error: "complete_adds is required as the base add-on" },
        { status: 400 }
      );
    }

    // Check if user already paid for one-time add-ons (webstore, plugin)
    const ONE_TIME_ADDONS = ["webstore", "plugin"];
    const requestedOneTime = addOns.filter((k) => ONE_TIME_ADDONS.includes(k));
    if (requestedOneTime.length > 0) {
      const existingPurchases = await AddOnPurchase.find({
        userId,
        status: "paid",
        addOns: { $in: requestedOneTime },
      }).lean();
      const alreadyPaid = new Set();
      for (const p of existingPurchases) {
        for (const a of p.addOns) {
          if (ONE_TIME_ADDONS.includes(a)) alreadyPaid.add(a);
        }
      }
      const duplicates = requestedOneTime.filter((k) => alreadyPaid.has(k));
      if (duplicates.length > 0) {
        return Response.json(
          { error: `Already purchased: ${duplicates.join(", ")}. These are one-time payments.` },
          { status: 400 }
        );
      }
    }

    const totalDKK = calculateTotal(addOns);
    const totalOre = totalDKK * 100; // convert DKK to øre

    // Get or create Stripe customer and attach the payment method so it's saved
    const user = await User.findById(userId);
    let customerId = user?.stripeCustomerId;
    if (user && !customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: `${user.firstname} ${user.lastname}`,
        metadata: { userId: user._id.toString() },
      });
      customerId = customer.id;
      user.stripeCustomerId = customerId;
      await user.save();
    }
    if (customerId) {
      try {
        await stripe.paymentMethods.attach(paymentMethodId, { customer: customerId });
        await stripe.customers.update(customerId, {
          invoice_settings: { default_payment_method: paymentMethodId },
        });
      } catch (_) {
        // Already attached — safe to ignore
      }
    }

    // Create a pending purchase record
    const purchase = await AddOnPurchase.create({
      userId,
      addOns,
      totalAmount: totalOre,
      currency: "DKK",
      status: "pending",
    });

    // Create PaymentIntent (one-time payment)
    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalOre,
      currency: "dkk",
      customer: customerId || undefined,
      payment_method: paymentMethodId,
      confirm: true,
      automatic_payment_methods: {
        enabled: true,
        allow_redirects: "never",
      },
      metadata: {
        userId,
        purchaseId: purchase._id.toString(),
        addOns: JSON.stringify(addOns),
        type: "addon_purchase",
      },
      description: `Add-on purchase: ${addOns.join(", ")}`,
    });

    if (
      paymentIntent.status === "succeeded" ||
      paymentIntent.status === "requires_capture"
    ) {
      // Payment succeeded — update purchase record
      await AddOnPurchase.findByIdAndUpdate(purchase._id, {
        status: "paid",
        stripePaymentIntentId: paymentIntent.id,
        paidAt: new Date(),
      });

      return Response.json({
        success: true,
        purchaseId: purchase._id,
      });
    } else {
      // Payment failed or requires further action
      await AddOnPurchase.findByIdAndUpdate(purchase._id, {
        status: "failed",
      });

      return Response.json(
        { error: "Payment failed. Please try again." },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Add-on checkout error:", error);

    // Handle Stripe card errors specifically
    if (error.type === "StripeCardError") {
      return Response.json({ error: error.message }, { status: 400 });
    }

    return Response.json({ error: error.message }, { status: 500 });
  }
}
