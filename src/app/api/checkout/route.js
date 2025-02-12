import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(req) {
  try {
    const { amount } = await req.json();

    if (!amount) {
      return new Response(JSON.stringify({ error: "Amount is required" }), {
        status: 400,
      });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount * 100, // Stripe expects amount in cents
      currency: "usd",
      description: 'testing',
      shipping: {
        name: 'test',
        address: {
          line1: 'address 1',
          line2: 'address 2' || '',
          city: 'Mohali',
          state: 'Punjab',
          postal_code: '160001',
          country: 'IN',
        },
      }
    });

    return new Response(
      JSON.stringify({ clientSecret: paymentIntent.client_secret }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }
}
