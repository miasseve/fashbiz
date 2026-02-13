import Stripe from "stripe";
import { NextResponse } from "next/server";
import User from "@/models/User";
import Subscription from "@/models/Subscription";
import { productPurchased } from "@/mails/ProductPurchased";
import { transferSuccess } from "@/mails/TransferSuccess";
import { transferFailed } from "@/mails/TransferFailed";
import { consignorUpdate } from "@/mails/ConsignorUpdate";
import { transferCreated } from "@/mails/TransferCreated";
import RefferralDetails from "@/models/Referral";
import { user } from "@heroui/theme";
import { archiveProduct } from "@/actions/productActions";
import { unarchiveProduct } from "@/actions/productActions";
import {
  bulkCreateShopifyProducts,
  bulkRemoveShopifyProducts,
} from "@/actions/shopifyAction";

// Initialize Stripe with your secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  httpClient: Stripe.createFetchHttpClient(),
});

// The secret you received when setting up the webhook endpoint in the Stripe dashboard
const endpointSecret = "whsec_yuBUhVTxS5d7OFGKlAVf9isRMbeSB9qo";
// const endpointSecret = "whsec_817651dd8124d7d8557327bc20cda1f981e946abc7ad01c55a6b7d7294392b68";

// Middleware to handle raw body for webhook verification
// export const config = {
//   api: {
//     bodyParser: false,
//   },
// };

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
    case "customer.subscription.created": {
      const subscriptionObj = event.data.object;

      // Find user by stripeCustomerId
      const fullSubscription = await stripe.subscriptions.retrieve(
        subscriptionObj.id
      );
      const user = await User.findOne({
        stripeCustomerId: fullSubscription.customer,
      });
      if (!user) {
        console.warn(
          "User not found for subscription:",
          fullSubscription.customer
        );
        break;
      }

      // Get price & product info from Stripe
      const price = await stripe.prices.retrieve(
        fullSubscription.items.data[0].price.id
      );
      const product = await stripe.products.retrieve(price.product);

      // Upsert subscription in DB
      const subscriptionData = {
        userId: user._id,
        stripeSubscriptionId: fullSubscription.id,
        stripeCustomerId: fullSubscription.customer,
        planName: price.nickname || product.name || "Unknown Plan",
        planPriceId: price.id,
        status: fullSubscription.status,
        startDate: new Date(fullSubscription.start_date * 1000),
        endDate: new Date(fullSubscription.current_period_end * 1000),
        cancelAtPeriodEnd: fullSubscription.cancel_at_period_end || false,
      };

      await Subscription.findOneAndUpdate(
        { userId: user._id }, // match by user, not subscription ID
        subscriptionData,
        { upsert: true, new: true }
      );

      // Update user document
      user.subscriptionType = price.nickname || product.name || "Unknown Plan";
      user.subscriptionStart = new Date(fullSubscription.start_date * 1000);
      user.subscriptionEnd = new Date(
        fullSubscription.current_period_end * 1000
      );
      user.isActive = true;
      await user.save();

      break;
    }
    case "checkout.session.completed": {
      const session = event.data.object;
      const userId = session.metadata.userId;

      // Get subscription details
      const subscriptionId = session.subscription;
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);

      // Update user in MongoDB
      await dbConnect();
      await User.findByIdAndUpdate(userId, {
        subscriptionType: subscription.items.data[0].plan.nickname || "Pro",
        subscriptionStart: new Date(subscription.current_period_start * 1000),
        subscriptionEnd: new Date(subscription.current_period_end * 1000),
        stripeSubscriptionId: subscription.id,
      });

      const referral = await RefferralDetails.findOne({
        referredTouser_id: userId,
        used: true,
      });

      if (referral) {
        const referrer = await User.findById(referral.referredByuser_id);
        const stripeCustomerId = referrer.stripeCustomerId;
        const referrerSubscription = await stripe.subscriptions.list({
          customer: stripeCustomerId,
          status: "active",
          limit: 1,
        });

        if (referrerSubscription.data.length > 0) {
          const activeSub = referrerSubscription.data[0];

          // Calculate new end date (extend by 1 month)
          const currentEndDate = new Date(activeSub.current_period_end * 1000);
          const extendedEndDate = new Date(currentEndDate);
          extendedEndDate.setMonth(extendedEndDate.getMonth() + 1);

          // Convert extended date to UNIX timestamp (for Stripe)
          const extendedEndTimestamp = Math.floor(
            extendedEndDate.getTime() / 1000
          );

          // update Stripe subscription
          const updatedSub = await stripe.subscriptions.update(activeSub.id, {
            current_period_end: extendedEndTimestamp,
            proration_behavior: "always_invoice",
          });

          // Only update db if Stripe update succeeded
          if (updatedSub) {
            await User.findByIdAndUpdate(referrer._id, {
              subscriptionEnd: new Date(updatedSub.current_period_end * 1000),
            });
            await Subscription.findOneAndUpdate(
              { userId: referrer._id },
              {
                endDate: new Date(updatedSub.current_period_end * 1000),
              }
            );
          }
        }
        // console.log("reward given sucessfully");
      }
      break;
    }
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
    case "customer.subscription.updated": {
      const sub = event.data.object;

      // Fetch user
      const user = await User.findOne({ stripeSubscriptionId: sub.id });
      if (!user) break;

      const currentStart = new Date(sub.current_period_start * 1000);
      const currentEnd = new Date(sub.current_period_end * 1000);

      // Determine if subscription is actually active
      const isActiveStatus = ["active", "trialing"].includes(sub.status);
      const hasExpired = currentEnd < new Date(); // past end date
      const newStatus = isActiveStatus && !hasExpired;

      const wasActive = user.isActive;

      // Determine plan change for Shopify sync
      const shopifyPlans = ["Pro", "Business"];
      const oldSubType = user.subscriptionType;
      const price = await stripe.prices.retrieve(sub.items.data[0].price.id);
      const product = await stripe.products.retrieve(price.product);
      const newPlanName = price.nickname || product.name || "";

      const wasShopifyPlan = shopifyPlans.includes(oldSubType);
      const isShopifyPlan = shopifyPlans.includes(newPlanName);

      // Update User
      user.subscriptionStart = currentStart;
      user.subscriptionEnd = currentEnd;
      user.isActive = newStatus;
      if (newPlanName) {
        user.subscriptionType = newPlanName;
      }
      await user.save();

      // Update Subscription collection
      await Subscription.findOneAndUpdate(
        { stripeSubscriptionId: sub.id },
        {
          status: sub.status,
          startDate: currentStart,
          endDate: currentEnd,
          cancelAtPeriodEnd: sub.cancel_at_period_end,
          planName: newPlanName || undefined,
        }
      );

      // Product visibility logic
      if (wasActive && !newStatus) {
        // became inactive
        await archiveProduct(user._id);
      } else if (!wasActive && newStatus) {
        // became active
        await unarchiveProduct(user._id);
      }

      // Shopify sync: upgrade → bulk create, downgrade → bulk remove
      if (!wasShopifyPlan && isShopifyPlan && newStatus) {
        bulkCreateShopifyProducts(user._id).catch((err) =>
          console.error("Bulk Shopify create failed:", err.message),
        );
      } else if (wasShopifyPlan && !isShopifyPlan) {
        bulkRemoveShopifyProducts(user._id).catch((err) =>
          console.error("Bulk Shopify remove failed:", err.message),
        );
      }

      break;
    }

    case "customer.subscription.deleted": {
      const sub = event.data.object;

      const user = await User.findOne({ stripeSubscriptionId: sub.id });
      if (!user) break;

      const wasActive = user.isActive;
      const shopifyPlans = ["Pro", "Business"];
      const hadShopifyPlan = shopifyPlans.includes(user.subscriptionType);

      // User is no longer active
      user.isActive = false;
      await user.save();

      await Subscription.findOneAndUpdate(
        { stripeSubscriptionId: sub.id },
        {
          status: "canceled",
          endDate: new Date(sub.current_period_end * 1000),
          cancelAtPeriodEnd: true,
        }
      );

      // Only archive products if user was previously active
      if (wasActive) {
        await archiveProduct(user._id);
      }

      // Remove products from Shopify if user had a Shopify-enabled plan
      if (hadShopifyPlan) {
        bulkRemoveShopifyProducts(user._id).catch((err) =>
          console.error("Bulk Shopify remove on cancel failed:", err.message),
        );
      }

      break;
    }

    // You can handle other event types here if needed
    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  return NextResponse.json({ message: "Event received" }, { status: 200 });
}
