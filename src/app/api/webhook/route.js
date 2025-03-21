import Stripe from "stripe";
import { NextResponse } from "next/server";
import { paymentSuccess } from "@/mails/PaymentSuccess";
import { transferSuccess } from "@/mails/TransferSuccess";
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
  const sig = req.headers.get("stripe-signature");
  let event;

  try {
    const body = await req.text();
    event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
  } catch (err) {
    return NextResponse.json(
      { error: `Webhook Error: ${err.message}` },
      { status: 400 }
    );
  }

  // Handle the event
  switch (event.type) {
    case "payment_intent.succeeded":
      const paymentIntent = event.data.object;
      const customerId = paymentIntent.customer; 

      // Retrieve customer details from Stripe
      try {
        const customer = await stripe.customers.retrieve(customerId);
        const customerName = customer.name; // Customer's name
        const customerEmail = customer.email; // Customer's email

        // Send email to the customer
        // await paymentSuccess("tester@yopmail.com", "testerr");

        // Respond to the webhook
        return NextResponse.json({
          success: "PaymentIntent processed successfully",
        });
      } catch (err) {
        console.error("Error retrieving customer:", err);
        // return NextResponse.json({ error: 'Failed to retrieve customer details' }, { status: 500 });
      }
      break;
    case "transfer.created":
      const transfer = event.data.object;
      console.log(transfer, "transfer");
      // Handle transfer creation (e.g., record the transfer in your database)
      break;
    case "transfer.failed":
      const failedTransfer = event.data.object;
      console.log(`Transfer failed: ${failedTransfer.id}`);
      // Handle failed transfer (e.g., notify the user or retry the transfer)
      break;
    case "transfer.paid":
      const paidTransfer = event.data.object;
      const transferAmount = paidTransfer.amount / 100;
      const transferDestination = paidTransfer.destination;
      const transferCurrency = paidTransfer.currency;
      // await transferSuccess(
      //   "testingg@yopmail.com",
      //   transferAmount,
      //   transferCurrency,
      //   paidTransfer
      // );
      // console.log(`Transfer paid: ${paidTransfer.id}`);
      // Handle paid transfer (e.g., update status in your system)
      break;
    // You can handle other event types here if needed
    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  return NextResponse.json({ message: "Event received" }, { status: 200 });
}
