import Stripe from "stripe";
import { NextResponse } from "next/server";
import Account from "@/models/Account";
import dbConnect from "@/lib/db";

// Initialize Stripe with your secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  httpClient: Stripe.createFetchHttpClient(),
});

export async function GET(req) {
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: 10000,
      currency: "usd",
    });

    return NextResponse.json(
      {
        clientSecret: paymentIntent.client_secret,
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function POST(req) {
  try {
    await dbConnect();
    const { 
      payment_method, 
      userId, 
      userName, 
      userEmail, 
      customerName,
      customerEmail,
      groupedProducts,
      customerId 
    } = await req.json();

    // Validate required fields
    if (!payment_method || !userId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const account = await Account.findOne({ userId: userId });

    if (!account) {
      return NextResponse.json({ error: "Account not exist" }, { status: 400 });
    }

    const {
      products: consignorProducts,
      total: consignorTotal,
      consignorAccount,
    } = groupedProducts;

    const formattedProducts = consignorProducts.map(
      ({ title, brand, price }) => ({
        title,
        brand,
        price,
      })
    );

    let paymentIntent;
    let finalCustomerId = customerId;

    try {
      // If no customer ID provided, create or retrieve customer
      if (!finalCustomerId) {
        // Try to find existing customer by email
        const existingCustomers = await stripe.customers.list({
          email: customerEmail,
          limit: 1,
        });

        if (existingCustomers.data.length > 0) {
          finalCustomerId = existingCustomers.data[0].id;
        } else {
          // Create new customer
          const customer = await stripe.customers.create({
            email: customerEmail,
            name: customerName,
          });
          finalCustomerId = customer.id;
        }

        // Attach payment method to customer for reuse
        await stripe.paymentMethods.attach(payment_method, {
          customer: finalCustomerId,
        });
      }
      paymentIntent = await stripe.paymentIntents.create({
        amount: consignorTotal * 100,
        currency: "eur",
        customer: finalCustomerId,
        payment_method: payment_method,
        off_session: true,
        confirm: true,
        automatic_payment_methods: {
          enabled: true,
          allow_redirects: "never",
        },
        metadata: {
          storeOwnerEmail: userEmail,
          storeOwnerName: userName,
          storeOwnerAccountId: account.accountId,
          consignorAccountId: consignorAccount,
          storeOwnerPercentage: account.percentage,
          consignorName: consignorProducts[0]?.consignorName || "",
          consignorEmail: consignorProducts[0]?.consignorEmail || "",
          formattedProducts: JSON.stringify(formattedProducts),
        },
      });

      if (
        paymentIntent.status === "requires_action" &&
        paymentIntent.next_action.type === "use_stripe_sdk"
      ) {
        return NextResponse.json(
          {
            requires_action: true,
            client_secret: paymentIntent.client_secret,
            customer_id: finalCustomerId,
            payment_intent_id: paymentIntent.id,
          },
          { status: 200 }
        );
      }

      // Payment succeeded
      if (paymentIntent.status === "succeeded") {
        return NextResponse.json(
          {
            success: true,
            customer_id: finalCustomerId,
            payment_intent_id: paymentIntent.id,
          },
          { status: 200 }
        );
      }
      
      return NextResponse.json(
        {
          error: "Unexpected payment status",
          customer_id: finalCustomerId,
        },
        { status: 400 }
      );
      
    } catch (error) {
      if (error.code === 'resource_already_exists') {
        try {
          paymentIntent = await stripe.paymentIntents.create({
            amount: consignorTotal * 100,
            currency: "eur",
            customer: finalCustomerId,
            payment_method: payment_method,
            off_session: true,
            confirm: true,
            automatic_payment_methods: {
              enabled: true,
              allow_redirects: "never",
            },
            metadata: {
              storeOwnerEmail: userEmail,
              storeOwnerName: userName,
              storeOwnerAccountId: account.accountId,
              consignorAccountId: consignorAccount,
              storeOwnerPercentage: account.percentage,
              consignorName: consignorProducts[0]?.consignorName || "",
              consignorEmail: consignorProducts[0]?.consignorEmail || "",
              formattedProducts: JSON.stringify(formattedProducts),
            },
          });

          if (paymentIntent.status === "succeeded") {
            return NextResponse.json(
              {
                success: true,
                customer_id: finalCustomerId,
                payment_intent_id: paymentIntent.id,
              },
              { status: 200 }
            );
          }
        } catch (retryError) {
          return NextResponse.json(
            { error: `Payment failed: ${retryError.message}` },
            { status: 500 }
          );
        }
      }
      
      return NextResponse.json(
        { error: `Payment failed: ${error.message}` },
        { status: 500 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      { error: `Server error. ${error.message}` },
      { status: 500 }
    );
  }
}




