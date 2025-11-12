// ============= API Route: app/api/stripe/plans/route.js =============
import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import SubscriptionPlan from "@/models/SubscriptionPlanDetails";
import dbConnect from "@/lib/db";

const PLAN_CONFIG = {
  Starter: {
    productLimit: 60,
    maxUsers: 2,
    modules: [
      "✔ Upload up to 60 products per Month",
      "✔ AI automation",
      "✔ Consignor fee setup",
      "✔ Upto 2 Users access",
      "✔ Auto Split Payments Support",
    ],
  },
  Pro: {
    productLimit: 500,
    maxUsers: 3,
    modules: [
      "✔ All Starter features",
      "✔ Upload up to 500 products per Month",
      "✔ Upto 3 Users access",
      "✔ Faster automation",
    ],
  },
  Business: {
    productLimit: 1000,
    maxUsers: 10,
    modules: [
      "✔ All Business features",
      "✔ Upload up to 1000 products per Month",
      "✔ Upto 5-10 Users access",
      "✔ Multi-store Sync",
      "✔ Priority Support",
    ],
  },
};

export async function GET() {
  try {
    await dbConnect();

    const products = await stripe.products.list({
      active: true,
      limit: 100,
    });

    const prices = await stripe.prices.list({
      active: true,
      limit: 100,
    });

    const subscriptionPlans = [];

    for (const price of prices.data.filter((p) => p.type === "recurring")) {
      const product = products.data.find((p) => p.id === price.product);
      if (!product || !product.active || !price.active) continue;
      const nickname = price.nickname || product?.name || "Unnamed Plan";

      let planDoc = await SubscriptionPlan.findOne({
        subscriptionPlanId: price.id,
      });

      if (!planDoc) {
        const config = PLAN_CONFIG[nickname] || {
          productLimit: 60,
          maxUsers: 2,
          modules: ["✔ Basic access"],
        };

        planDoc = await SubscriptionPlan.create({
          subscriptionPlanId: price.id,
          plan_name: nickname,
          price: price.unit_amount / 100,
          currency: price.currency.toUpperCase(),
          productLimit: config.productLimit,
          maxUsers: config.maxUsers,
          modules: config.modules,
        });

        // console.log(`Created new plan: ${nickname}`);
      }

      subscriptionPlans.push({
        id: price.id,
        nickname: nickname,
        unit_amount: price.unit_amount,
        currency: price.currency,
        recurring: price.recurring,
        product: {
          id: product?.id,
          name: product?.name,
          description: product?.description,
        },
        features: planDoc.modules,
        productLimit: planDoc.productLimit,
        maxUsers: planDoc.maxUsers,
      });
    }

    subscriptionPlans.sort((a, b) => a.unit_amount - b.unit_amount);
    return NextResponse.json(subscriptionPlans);
  } catch (err) {
    console.error("Stripe Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
