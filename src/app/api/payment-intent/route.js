import Stripe from "stripe";
import { NextResponse } from "next/server";
import Account from "@/models/Account";
import dbConnect from "@/lib/db";
// Initialize Stripe with your secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

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
    // const balanceBeforePayment = await stripe.balance.retrieve();
    // const balance = await stripe.balance.retrieve({
    //   stripeAccount: 'acct_1R1ihVPDSFqSFylA',
    // });
    // console.log("Balance before payment:", balanceBeforePayment,balance);

    await dbConnect();
    const {
      payment_method,
      total,
      userId,
      products,
      customerName,
      customerEmail,
    } = await req.json();

    const groupedProducts = products.reduce((acc, product) => {
      const { consignorAccount } = product;
      if (!acc[consignorAccount]) {
        acc[consignorAccount] = [];
      }
      acc[consignorAccount].push(product);
      return acc;
    }, {});

    const account = await Account.findOne({ userId: userId });
  
    if (!account) {
      return NextResponse.json({ error: "Account not exist" }, { status: 400 });
    }

    let storeOwnerPercentage = 0;
    let consignorPercentage = 0;
    
    if(account.percentage)
    {
      storeOwnerPercentage = account.percentage;
      consignorPercentage = 100-Number(account.percentage)-10;
    } 
    
    const customer = await stripe.customers.create({
      name: customerName,
      email: customerEmail,
      payment_method: payment_method, 
      invoice_settings: {
        default_payment_method: payment_method, 
      },
    });

    // const paymentIntents = [];

    const transferGroup = `ORDER_${Date.now()}`;
    // Step 4: Create the paymentIntent for the consignor group
    const paymentIntent = await stripe.paymentIntents.create({
      amount: total * 100,
      currency: "eur",
      payment_method: payment_method,
      customer: customer.id,
      confirm: true,
      automatic_payment_methods: {
        enabled: true,
        allow_redirects: "never",
      },
      transfer_group: transferGroup, // Unique order identifier
    });

    // Check if paymentIntent was successful
    if (paymentIntent.status !== "succeeded") {
      return NextResponse.json(
        { error: "Payment failed to confirm" },
        { status: 400 }
      );
    }

    for (let consignorAccount in groupedProducts) {
      const consignorProducts = groupedProducts[consignorAccount];

      // Step 3: Calculate the total for the consignor's products
      const consignorTotal = consignorProducts.reduce(
        (sum, product) => sum + product.price,
        0
      );

      const retrievedPaymentIntent = await stripe.paymentIntents.retrieve(
        paymentIntent.id
      );

      await stripe.transfers.create({
        amount: consignorTotal * 100 * consignorPercentage/100,
        currency: "eur",
        destination: consignorAccount,
        source_transaction: retrievedPaymentIntent.latest_charge,
        transfer_group: transferGroup,
      });

      await stripe.transfers.create({
        amount: consignorTotal * 100 * storeOwnerPercentage/100,
        currency: "eur",
        destination: account.accountId,
        source_transaction: retrievedPaymentIntent.latest_charge,
        transfer_group: transferGroup,
      });
    }

    return NextResponse.json(
      {
        success: true,
        paymentIntent: true, // Send the array of payment intents
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
