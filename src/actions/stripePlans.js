// ============= actions/stripe-plans.js =============
import { stripe } from "@/lib/stripe";
import SubscriptionPlan from "@/models/SubscriptionPlanDetails";
import dbConnect from "@/lib/db";

const PLAN_CONFIG = {
  Starter: {
    productLimit: 300,
    maxUsers: 2,
    tagline: "Perfect for Repetitive",
    subtitle: "Ready barcode + Admin acess",
    modules: [
      "Upload up to 300 products per Month",
      "Up to 2 users access",
      "AI automation ",
      "Ready barcode",
      "Admin access",
      "Consignor profile and Commission setup",
      "Product linked to consignor",
      "Auto split payments Support",
    ],
    bgColor: "bg-purple-200",
  },
  Pro: {
    productLimit: 1000,
    maxUsers: 3,
    tagline: "Visibility + automated workflow",
    subtitle: "Starter +",
    modules: [
      "All Starter features",
      "Upload up to 1000 products per Month",
      "Up to 3 users access",
      "Instagram integration",
      "E-commerce integration",
    ],
    bgColor: "bg-gradient-to-br from-[#F2A187] via-[#ECCC91] to-[#F1D7F2]",
  },
  Business: {
    productLimit: 5000,
    maxUsers: 10,
    tagline: "Automate all",
    subtitle: "Pro +",
    modules: [
      "All Pro features",
      "Upload up to 5000 products per Month",
      "Up to 5-10 users access",
      "Instagram integration",
      "Priority Support",
    ],
    bgColor: "bg-[#ead6c4]",
  },
  Brand_Collect: {
    productLimit: null,
    maxUsers: null,
    modules: ["Ree Collect Program", "Ecommerce Integrations", "Resale Tag"],
    bgColor: "bg-[#ead6c4]"
  },
};

function normalizeKey(name) {
  return name.replace(/\s+/g, "_").trim();
}

export async function getSubscriptionPlans() {
  await dbConnect();

  const products = await stripe.products.list({ active: true, limit: 100 });
  const prices = await stripe.prices.list({ active: true, limit: 100 });

  const subscriptionPlans = [];

  for (const price of prices.data.filter((p) => p.type === "recurring")) {
    const product = products.data.find((p) => p.id === price.product);
    if (!product || !product.active || !price.active) continue;

    const nickname = price.nickname || product?.name || "Unnamed Plan";
    const key = normalizeKey(nickname);

    let planDoc = await SubscriptionPlan.findOne({
      subscriptionPlanId: price.id,
    });

    if (!planDoc) {
      const config = PLAN_CONFIG[key] || {
        productLimit: 60,
        maxUsers: 2,
        modules: [" Basic access"],
      };

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
      tagline: planDoc.tagline,
      subtitle: planDoc.subtitle,
      bgColor: planDoc.bgColor,
    });
  }

  subscriptionPlans.sort((a, b) => a.unit_amount - b.unit_amount);
  return subscriptionPlans;
}
