import Stripe from "stripe";
import { NextResponse } from "next/server";
import { productPurchased } from "@/mails/ProductPurchased";
import { transferSuccess } from "@/mails/TransferSuccess";
import { consignorUpdate } from "@/mails/ConsignorUpdate";
import { transferCreated } from "@/mails/TransferCreated";
// Initialize Stripe with your secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY); // Replace with your Stripe secret key

// The secret you received when setting up the webhook endpoint in the Stripe dashboard
const endpointSecret =
  "whsec_6df68ad07c5fc76857088ec698734ad7b9a5b92af228c6e019582a5239f60f4f";
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
    case "balance.available":
      console.log(
        "🔄 Funds are now available! Proceeding with second transfer..."
      );
      break;
    case "payment_intent.succeeded":
      const paymentIntent = event.data.object;
      const customerId = paymentIntent.customer;
      const metaData = paymentIntent.metadata;
      console.log(metaData, "userdata");
      // Retrieve customer details from Stripe
      try {
        const customer = await stripe.customers.retrieve(customerId);
        const customerName = customer.name;
        const customerEmail = customer.email;

        // Send email to the customer
        //await paymentSuccess(customerEmail, "testerr");
        // await productPurchased(
        //   "storeowner@yopmail.com",
        //   "store owner",
        //   metaData.consignorEmail,
        //   metaData.consignorName,
        //   JSON.parse(metaData.formattedProducts)
        // );
        // await consignorUpdate(
        //   "storeowner@yopmail.com",
        //   "consignor",
        //   "consignor@yopmail.com",
        //   metaData.consignorName,
        //   JSON.parse(metaData.formattedProducts)
        // );

        //await paymentSuccess(metaData.customerEmail, "testerr");

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
      // await transferCreated(
      //   "storeOwner",
      //   "storeowner@yopmail.com",
      //   transfer.amount / 100,
      //   transfer.currency,
      //   transfer.id
      // );
      // Handle transfer creation (e.g., record the transfer in your database)
      break;
    case "transfer.failed":
      const failedTransfer = event.data.object;
      console.log(`Transfer failed: ${failedTransfer.id}`);
      // Handle failed transfer (e.g., notify the user or retry the transfer)
      break;
    case "transfer.paid":
    
      break;
    // You can handle other event types here if needed
    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  return NextResponse.json({ message: "Event received" }, { status: 200 });
}
