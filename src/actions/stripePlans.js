// ============= actions/stripe-plans.js =============
import { stripe } from "@/lib/stripe";
import SubscriptionPlan from "@/models/SubscriptionPlanDetails";
import dbConnect from "@/lib/db";

// const PLAN_CONFIG = {
//   Starter: {
//     productLimit: 300,
//     maxUsers: 2,
//     tagline: "Perfect for Repetitive",
//     subtitle: "Ready barcode + Admin acess",
//     modules: [
//       "Upload up to 300 products per Month",
//       "Up to 2 users access",
//       "AI automation ",
//       "Ready barcode",
//       "Admin access",
//       "Consignor profile and Commission setup",
//       "Product linked to consignor",
//       "Auto split payments Support",
//     ],
//     bgColor: "bg-purple-200",
//   },
//   Pro: {
//     productLimit: 1000,
//     maxUsers: 3,
//     tagline: "Visibility + automated workflow",
//     subtitle: "Starter +",
//     modules: [
//       "All Starter features",
//       "Upload up to 1000 products per Month",
//       "Up to 3 users access",
//       "Instagram integration",
//       "E-commerce integration",
//     ],
//     bgColor: "bg-gradient-to-br from-[#F2A187] via-[#ECCC91] to-[#F1D7F2]",
//   },
//   Business: {
//     productLimit: 5000,
//     maxUsers: 10,
//     tagline: "Automate all",
//     subtitle: "Pro +",
//     modules: [
//       "All Pro features",
//       "Upload up to 5000 products per Month",
//       "Up to 5-10 users access",
//       "Instagram integration",
//       "Priority Support",
//     ],
//     bgColor: "bg-[#ead6c4]",
//   },
//   Brand_Collect: {
//     productLimit: null,
//     maxUsers: null,
//     modules: ["Ree Collect Program", "Ecommerce Integrations", "Resale Tag"],
//     bgColor: "bg-[#ead6c4]"
//   },
// };

const PLAN_CONFIG = {
  Add_Basic: {
    stripeProductName: "Ads Basic",
    productLimit: 300,
    maxUsers: 2,
    billing: "monthly",
    price: 390,
    currency: "DKK",
    tagline: "ADDS BARCODE INSTAGRAM",
    subtitle: "Core automation tools",
    modules: [
      "Instagram integration",
      "Complete Adds",
      "Barcode label with size and price",
      "Product linked to consignor",
      "Consignor portal",
      "Auto split payments",
      "Digital passport",
    ],
    bgColor: "bg-purple-200",
    type: "subscription",
  },

  Add_Pro: {
    stripeProductName: "Ads Pro",
    productLimit: 1000,
    maxUsers: 5,
    billing: "monthly",
    price: 1990,
    currency: "DKK",
    tagline: "Visibility + automated workflow",
    subtitle: "Add Basic +",
    modules: [
      "All Add Basic features",
      "Instagram integration",
    ],
    bgColor: "bg-gradient-to-br from-[#F2A187] via-[#ECCC91] to-[#F1D7F2]",
    type: "subscription",
  },

  Webstore_Basic: {
    stripeProductName: "Webstore Basic",
    productLimit: 300,
    maxUsers: 2,
    billing: "one-time",
    price: 4800,
    transactionFee: 0.04, // 4%
    currency: "DKK",
    tagline: "Launch your resell webstore",
    subtitle: "One-time setup + 4% per transaction",
    modules: [
      "Fully ready Live Webstore",
      "All Add Basic features + logo",
      "All ADS features",
      "Webstore synchronisation to all",
    ],
    bgColor: "bg-[#ead6c4]",
    type: "one-time",
  },

  Webstore_Pro: {
    stripeProductName: "Webstore Pro",
    productLimit: 1000,
    maxUsers: 5,
    billing: "one-time",
    price: 35000,
    transactionFee: 0.02, // 2%
    currency: "DKK",
    tagline: "Enterprise webstore solution",
    subtitle: "Custom quote + 2% per transaction",
    requiresQuote: true,
    modules: [
      "Shopify webstore synchronization",
      "Fully ready Live Webstore",
      "All Add Basic features + logo",
      "Webstore synchronisation to all",
    ],
    bgColor: "bg-gradient-to-br from-[#F2A187] via-[#ECCC91] to-[#F1D7F2]",
    type: "one-time",
  },

  "Plug-In_Basic": {
    stripeProductName: "Plug-In Basic",
    productLimit: 300,
    maxUsers: 2,
    billing: "one-time",
    price: 3200,
    currency: "DKK",
    tagline: "Connect your existing store",
    subtitle: "One-time setup fee",
    modules: [
      "Connect your existing webstore",
      "webstore synchronized to all ADS features",
      "Full product sync",
      "No monthly fees",
    ],
    bgColor: "bg-[#1F1F2E] text-white",
    type: "one-time",
  },

  "Plug-In_Pro": {
    stripeProductName: "Plug-In Pro",
    productLimit: 1000,
    maxUsers: 5,
    billing: "one-time",
    price: 6000,
    currency: "DKK",
    tagline: "Enterprise store connection",
    subtitle: "Custom quote",
    requiresQuote: true,
    modules: [
      "Shopify webstore synchronization",
      "All Plugin Basic features",
      "Custom sync configuration",
      "Dedicated onboarding",
    ],
    bgColor: "bg-[#1F1F2E] text-white",
    type: "one-time",
  },
};
function normalizeKey(name) {
  return name.replace(/\s+/g, "_").trim();
}

// Look up config by normalized key first, then by stripeProductName
function findConfig(nickname) {
  const key = normalizeKey(nickname);
  if (PLAN_CONFIG[key]) return PLAN_CONFIG[key];
  // Fallback: match by stripeProductName
  return Object.values(PLAN_CONFIG).find(
    (c) => c.stripeProductName?.toLowerCase() === nickname.toLowerCase()
  ) || null;
}

export async function getSubscriptionPlans() {
  await dbConnect();

  const products = await stripe.products.list({ active: true, limit: 100 });
  const prices = await stripe.prices.list({ active: true, limit: 100 });

  // Old plan names to exclude from display
  const EXCLUDED_PLANS = ["Starter", "Pro", "Business"];

  const subscriptionPlans = [];

  for (const price of prices.data.filter((p) => p.active)) {
    const product = products.data.find((p) => p.id === price.product);
    if (!product || !product.active) continue;

    const nickname = price.nickname || product?.name || "Unnamed Plan";

    // Skip old plans (Starter, Pro, Business)
    if (EXCLUDED_PLANS.includes(nickname) || EXCLUDED_PLANS.includes(product.name)) continue;

    // Try matching by normalized key, then by stripeProductName
    const config = findConfig(nickname) || findConfig(product.name);

    if (!config) continue; // Skip plans not in our config

    let planDoc = await SubscriptionPlan.findOne({
      subscriptionPlanId: price.id,
    });

    if (!planDoc) {
      planDoc = await SubscriptionPlan.create({
        subscriptionPlanId: price.id,
        plan_name: nickname,
        price: price.unit_amount / 100,
        currency: price.currency.toUpperCase(),
        productLimit: config.productLimit,
        maxUsers: config.maxUsers,
        modules: config.modules,
        tagline: config.tagline || "",
        subtitle: config.subtitle || "",
        bgColor: config.bgColor || "bg-white",
      });
    } else {
      // Always sync DB with latest config values
      planDoc.productLimit = config.productLimit;
      planDoc.maxUsers = config.maxUsers;
      planDoc.modules = config.modules;
      planDoc.tagline = config.tagline || "";
      planDoc.subtitle = config.subtitle || "";
      planDoc.bgColor = config.bgColor || "bg-white";
      await planDoc.save();
    }

    subscriptionPlans.push({
      id: price.id,
      nickname: nickname,
      unit_amount: price.unit_amount,
      currency: price.currency,
      recurring: price.recurring,
      priceType: price.type,
      product: {
        id: product?.id,
        name: product?.name,
        description: product?.description,
      },
      features: planDoc.modules,
      productLimit: planDoc.productLimit,
      maxUsers: planDoc.maxUsers,
      tagline: planDoc.tagline,
      subtitle: planDoc.subtitle,
      bgColor: planDoc.bgColor,
      transactionFee: config.transactionFee || null,
      requiresQuote: config.requiresQuote || false,
      planType: config.type || "subscription",
    });
  }

  subscriptionPlans.sort((a, b) => a.unit_amount - b.unit_amount);
  return subscriptionPlans;
}
