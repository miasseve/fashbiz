// ============= API Route: app/api/stripe/plans/route.js =============
import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
 
export async function GET() {
  try {
    const products = await stripe.products.list({
      active: true,
      limit: 100,
    });
 
    const prices = await stripe.prices.list({
      active: true,
      limit: 100,
    });
   
    const subscriptionPlans = prices.data
      .filter(price => price.type === 'recurring')
      .map(price => {
        const product = products.data.find(p => p.id === price.product);
        return {
          id: price.id,
          nickname: price.nickname || product?.name || "Unnamed Plan",
          unit_amount: price.unit_amount,
          currency: price.currency,
          recurring: price.recurring,
          product: {
            id: product?.id,
            name: product?.name,
            description: product?.description,
          }
        };
      })
      .sort((a, b) => a.unit_amount - b.unit_amount); // Sort by price
   
    return NextResponse.json(subscriptionPlans);
  } catch (err) {
    console.error("Stripe Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}