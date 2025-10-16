// ============= lib/subscriptionService.js =============
import { stripe } from "@/lib/stripe";
import User from "@/models/User";
import Subscription from "@/models/Subscription";
import { emailService } from "@/mails/emailSubscription";
 
export const subscriptionService = {
  // Get or create Stripe customer
  async getOrCreateCustomer(user) {
    if (user.stripeCustomerId) {
      return user.stripeCustomerId;
    }
 
    const customer = await stripe.customers.create({
      email: user.email,
      name: `${user.firstname} ${user.lastname}`,
      metadata: { userId: user._id.toString() },
    });
 
    user.stripeCustomerId = customer.id;
    await user.save();
 
    return customer.id;
  },
 
  async createSubscription(userId, priceId, paymentMethodId) {
    const user = await User.findById(userId);
    if (!user) throw new Error("User not found");
 
    const customerId = await this.getOrCreateCustomer(user);
 
    // Attach payment method
    await stripe.paymentMethods.attach(paymentMethodId, { customer: customerId });
    await stripe.customers.update(customerId, {
      invoice_settings: { default_payment_method: paymentMethodId }
    });
 
    // Create subscription
    const stripeSubscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      // trial_period_days: 1,
      expand: ['latest_invoice.payment_intent'],
    });
 
    // Get plan details
    // const price = await stripe.prices.retrieve(priceId);
    // const product = await stripe.products.retrieve(price.product);
 
    // // Save to database immediately
    // const subscriptionData = {
    //   userId: user._id,
    //   stripeSubscriptionId: stripeSubscription.id,
    //   stripeCustomerId: customerId,
    //   planName: price.nickname || product.name || "Unknown Plan",
    //   planPriceId: priceId,
    //   status: stripeSubscription.status,
    //   startDate: new Date(stripeSubscription.start_date * 1000),
    //   endDate: new Date(stripeSubscription.current_period_end * 1000),
    //   // trialEnd: stripeSubscription.trial_end ? new Date(stripeSubscription.trial_end * 1000) : null, // Add this
    //   cancelAtPeriodEnd: false,
    // };
 
    // const subscription = await Subscription.findOneAndUpdate(
    //   { userId: user._id },
    //   subscriptionData,
    //   { upsert: true, new: true }
    // );

    // user.subscriptionType = price.nickname || product.name || "Unknown Plan";
    // user.subscriptionStart = new Date(stripeSubscription.start_date * 1000);
    // user.subscriptionEnd = new Date(stripeSubscription.current_period_end * 1000);
    // user.isActive = true; // optional: activate the user if required
    // user.stripeCustomerId = customerId;

    // await user.save();

    // Send activation email
    // await emailService.sendSubscriptionActivated(user, subscription);
    return true;
  },
 
  // Get user's subscription with optional Stripe sync
  async getUserSubscription(userId, syncWithStripe = false) {
    const subscription = await Subscription.findOne({ userId });
 
    if (!subscription) {
      return null;
    }
 
    // Optionally sync with Stripe to get latest status
    if (syncWithStripe && subscription.stripeSubscriptionId) {
      try {
        const stripeSubscription = await stripe.subscriptions.retrieve(
          subscription.stripeSubscriptionId
        );
 
        // Update local database with latest info
        subscription.status = stripeSubscription.status;
        subscription.cancelAtPeriodEnd =
          stripeSubscription.cancel_at_period_end;
        subscription.endDate = new Date(
          stripeSubscription.current_period_end * 1000
        );
        await subscription.save();
      } catch (error) {
        console.error("Error syncing with Stripe:", error);
      }
    }
 
    return subscription;
  },
 
  // Create checkout session
  async createCheckoutSession(userId, priceId) {
    const user = await User.findById(userId);
    if (!user) throw new Error("User not found");
 
    const customerId = await this.getOrCreateCustomer(user);
 
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      customer: customerId,
      subscription_data: {
        // trial_period_days: 1, // Add this line
      },
      success_url: `${process.env.NEXT_PUBLIC_FRONTEND_URL}/dashboard/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_FRONTEND_URL}/dashboard/subscription`,
      metadata: {
        userId: user._id.toString(),
        priceId,
      },
    });
 
    return session.url;
  },
 
  // Cancel subscription at period end
  async cancelSubscription(userId) {
    const subscription = await this.getUserSubscription(userId);
    if (!subscription) throw new Error("No active subscription found");
 
    // Cancel at period end in Stripe
    const stripeSubscription = await stripe.subscriptions.update(
      subscription.stripeSubscriptionId,
      { cancel_at_period_end: true }
    );
 
    // Update database
    subscription.cancelAtPeriodEnd = true;
    subscription.status = stripeSubscription.status;
    await subscription.save();
    // Send cancellation email
    const user = await User.findById(userId);
    if (user) {
      // Keep user active until subscription end
      user.isActive = false; // still active until period ends
      user.subscriptionEnd = subscription.endDate || user.subscriptionEnd; // actual end date
      await user.save();
    }

    // await emailService.sendSubscriptionCancelled(user, subscription);
    return subscription;
  },
 
  // Change/Upgrade subscription
  async changeSubscription(userId, newPriceId) {
    const subscription = await this.getUserSubscription(userId);
    if (!subscription) throw new Error("No active subscription found");
 
    const oldPlanName = subscription.planName; // Store old plan name
     console.log(userId, newPriceId, oldPlanName,'oldddddddddd');
    // Get the current subscription from Stripe
    const stripeSubscription = await stripe.subscriptions.retrieve(
      subscription.stripeSubscriptionId
    );
 
    // Update the subscription with new price
    const updatedSubscription = await stripe.subscriptions.update(
      subscription.stripeSubscriptionId,
      {
        proration_behavior: "always_invoice",
        cancel_at_period_end: false,
        items: [
          {
            id: stripeSubscription.items.data[0].id,
            price: newPriceId,
          },
        ],
      }
    );
 
    // Get plan name from Stripe
    const price = await stripe.prices.retrieve(newPriceId);
    const product = await stripe.products.retrieve(price.product);
 
    // Update database
    subscription.planName = price.nickname || product.name || "Unknown Plan";
    subscription.planPriceId = newPriceId;
    subscription.status = updatedSubscription.status;
    subscription.endDate = new Date(
      updatedSubscription.current_period_end * 1000
    );
    await subscription.save();
    // Send plan changed email
  const user = await User.findById(userId);
  await emailService.sendSubscriptionChanged(user, subscription, oldPlanName);
    return subscription;
  },
 
  // Sync subscription from Stripe to database
  async syncSubscription(stripeSubscription) {
    const user = await User.findOne({
      stripeCustomerId: stripeSubscription.customer,
    });
 
    if (!user) {
      console.error("No user found for customer:", stripeSubscription.customer);
      return null;
    }
 
    // Get plan details
    const priceId = stripeSubscription.items.data[0].price.id;
    const price = await stripe.prices.retrieve(priceId);
    const product = await stripe.products.retrieve(price.product);
 
    const subscriptionData = {
      userId: user._id,
      stripeSubscriptionId: stripeSubscription.id,
      stripeCustomerId: stripeSubscription.customer,
      planName: price.nickname || product.name || "Unknown Plan",
      planPriceId: priceId,
      status: stripeSubscription.status,
      startDate: new Date(stripeSubscription.start_date * 1000),
      endDate: new Date(stripeSubscription.current_period_end * 1000),
      // trialEnd: stripeSubscription.trial_end ? new Date(stripeSubscription.trial_end * 1000) : null, // Add this
      cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
    };
 
    const result = await Subscription.findOneAndUpdate(
      { userId: user._id },
      subscriptionData,
      { upsert: true, new: true }
    );
 
    return result;
  },
};