import Stripe from 'stripe';
import { NextResponse } from 'next/server'; 
// Initialize Stripe with your secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY); // Replace with your Stripe secret key

// The secret you received when setting up the webhook endpoint in the Stripe dashboard
const endpointSecret = process.env.STRIPE_ENDPOINT_SECRET;
// Middleware to handle raw body for webhook verification
export const config = {
  api: {
    bodyParser: false, // Disable Next.js body parser, Stripe requires raw body
  },
};

// Handle POST requests (webhook events)
export async function POST(req, res) {
  // const sig = req.headers['stripe-signature'];
  const sig = req.headers.get('stripe-signature');
  let event;

  try {
    const body = await req.text();
    event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
  } catch (err) {
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;


      break;

    // You can handle other event types here if needed
    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  return NextResponse.json({ message: 'Event received' }, { status: 200 });
}
