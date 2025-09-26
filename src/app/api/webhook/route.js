import Stripe from "stripe";
import { NextResponse } from "next/server";
import { productPurchased } from "@/mails/ProductPurchased";
import { transferSuccess } from "@/mails/TransferSuccess";
import { transferFailed } from "@/mails/TransferFailed";
import { consignorUpdate } from "@/mails/ConsignorUpdate";
import { transferCreated } from "@/mails/TransferCreated";

// Initialize Stripe with your secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  httpClient: Stripe.createFetchHttpClient(),
}); 

// The secret you received when setting up the webhook endpoint in the Stripe dashboard
const endpointSecret =
  "whsec_yuBUhVTxS5d7OFGKlAVf9isRMbeSB9qo";

// Middleware to handle raw body for webhook verification
export const config = {
  api: {
    bodyParser: false, 
  },
};

// Handle POST requests (webhook events)
export async function POST(req, res) {
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
    case "charge.updated":
      const charges = event.data.object;
      // balance_transaction should be available here
      try {
        const paymentIntent = await stripe.paymentIntents.retrieve(
          charges.payment_intent
        );
        const metaData = paymentIntent.metadata;

        const balanceTransaction = await stripe.balanceTransactions.retrieve(
          charges.balance_transaction
        );

        const netAmount = balanceTransaction.net;
     
        if (
          metaData.consignorEmail == "" &&
          metaData.consignorAccountId == ""
        ) {
          try {
            await stripe.transfers.create({
              amount: netAmount,
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
              netAmount / 100,
              "eur",
              `Failed Payment`
            );
          }
        } else {
          const storeOwnerPercentage = metaData.storeOwnerPercentage;
          const storeOwnerAmount =
            (Math.floor(netAmount / 100) * storeOwnerPercentage) / 100;
          const consignorAmount =
            Math.floor(netAmount / 100) - storeOwnerAmount;
          try {
            await stripe.transfers.create({
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
              `Failed Payment`
            );
          }

          try {
            await stripe.transfers.create({
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
              `Failed Payment`
            );
          }
        }
      } catch (error) {
        console.error("Error processing charge:", error);
      }
      break;

    case "transfer.created":
      const transferCreate = event.data.object;
      // console.log("Transfer Created Event:", transferCreat);
      try {
        await transferCreated(
          transferCreate.metadata.name,
          transferCreate.metadata.email,
          transferCreate.amount / 100,
          transferCreate.currency,
          transferCreate.id
        );
      } catch (error) {
        console.error(
          "❌ Failed to send transferCreated email:",
          error.message
        );
      }
      // Handle transfer creation (e.g., record the transfer in your database)
      break;
    case "transfer.failed":
      const transferFail = event.data.object;
      try {
        await transferFailed(
          transferFail.metadata.name,
          transferFail.metadata.email,
          transferFail.amount / 100,
          transferFail.currency,
          transferFail.id
        );
      } catch (error) {
        console.error("❌ Failed to send transferFailed email:", error.message);
      }
      break;
    case "transfer.paid":
      break;
    // You can handle other event types here if needed
    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  return NextResponse.json({ message: "Event received" }, { status: 200 });
}

