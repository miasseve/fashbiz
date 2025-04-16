import Stripe from "stripe";
import { NextResponse } from "next/server";
import { productPurchased } from "@/mails/ProductPurchased";
import { transferSuccess } from "@/mails/TransferSuccess";
import { transferFailed } from "@/mails/TransferFailed";
import { consignorUpdate } from "@/mails/ConsignorUpdate";
import { transferCreated } from "@/mails/TransferCreated";
// Initialize Stripe with your secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY); // Replace with your Stripe secret key

// The secret you received when setting up the webhook endpoint in the Stripe dashboard
const endpointSecret = "whsec_yuBUhVTxS5d7OFGKlAVf9isRMbeSB9qo";
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
      // const customerId = paymentIntent.customer;
      const metaData = paymentIntent.metadata;
      await new Promise((resolve) => setTimeout(resolve, 5000));

      const charge = await stripe.charges.retrieve(paymentIntent.latest_charge);

      const balanceTransaction = await stripe.balanceTransactions.retrieve(
        charge.balance_transaction
      );

      const netAmount = balanceTransaction.net;
      const storeOwnerPercentage = metaData.storeOwnerPercentage;
      const storeOwnerAmount =
        (Math.floor(netAmount / 100) * storeOwnerPercentage) / 100;
      const consignorAmount = Math.floor(netAmount / 100) - storeOwnerAmount;

      try {
        const storeOwnerTransfer = await stripe.transfers.create({
          amount: storeOwnerAmount * 100,
          currency: "eur",
          destination: metaData.storeOwnerAccountId,
          source_transaction: paymentIntent.latest_charge,
          transfer_group: `ORDER_${paymentIntent.id}`,
          metadata: {
            name: metaData.storeOwnerName,
            email: metaData.storeOwnerEmail,
          },
        });
      } catch (error) {
        await transferFailed(
          metaData.storeOwnerName,
          metaData.storeOwnerEmail,
          storeOwnerAmount,
          "eur",
          `FAILED Payment`
        );
        console.error("Transfer failed:", error.message);
      }

      try {
        const consignorTransfer = await stripe.transfers.create({
          amount: consignorAmount * 100,
          currency: "eur",
          destination: metaData.consignorAccountId,
          source_transaction: paymentIntent.latest_charge,
          transfer_group: `ORDER_${paymentIntent.id}`,
          metadata: {
            name: metaData.consignorName,
            email: metaData.consignorEmail,
          },
        });
      } catch (error) {
        await transferFailed(
          metaData.consignorName,
          metaData.consignorEmail,
          consignorAmount,
          "eur",
          `FAILED Payment`
        );
      }

      // return NextResponse.json({
      //   success: "PaymentIntent processed successfully",
      // });

      break;
    case "transfer.created":
      const transfer = event.data.object;
      await transferCreated(
        transfer.metadata.name,
        transfer.metadata.email,
        transfer.amount / 100,
        transfer.currency,
        transfer.id
      );
      // Handle transfer creation (e.g., record the transfer in your database)
      break;
    case "transfer.failed":
      await transferFailed(
        transfer.metadata.name,
        transfer.metadata.email,
        transfer.amount / 100,
        transfer.currency,
        transfer.id
      );
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
