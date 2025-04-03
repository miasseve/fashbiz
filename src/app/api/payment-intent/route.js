import Stripe from "stripe";
import { NextResponse } from "next/server";
import Account from "@/models/Account";
import dbConnect from "@/lib/db";
import ConsignorSelect from "@/app/dashboard/add-product/components/ConsignorSelect";
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
    await dbConnect();
    const {
      payment_method,
      total,
      userId,
      products,
      customerName,
      customerEmail,
    } = await req.json();

    // Validate required fields
    if (
      !payment_method ||
      !userId ||
      !products?.length ||
      !customerName ||
      !customerEmail
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const account = await Account.findOne({ userId: userId });

    if (!account) {
      return NextResponse.json({ error: "Account not exist" }, { status: 400 });
    }

    // Create Stripe customer
    let customer;
    try {
      customer = await stripe.customers.create({
        name: customerName,
        email: customerEmail,
        payment_method: payment_method,
        invoice_settings: { default_payment_method: payment_method },
      });
    } catch (error) {
      return NextResponse.json(
        { error: `Customer creation failed: ${error.message}` },
        { status: 500 }
      );
    }

    // Group products by consignor account
    const groupedProducts = products.reduce((acc, product) => {
      const { consignorAccount } = product;
      if (!consignorAccount) return acc; // Skip if no account
      acc[consignorAccount] = acc[consignorAccount] || [];
      acc[consignorAccount].push(product);
      return acc;
    }, {});

    const paymentResults = [];

    for (let consignorAccount in groupedProducts) {
      const consignorProducts = groupedProducts[consignorAccount];

      // Step 3: Calculate the total for the consignor's products
      const consignorTotal = consignorProducts.reduce(
        (sum, product) => sum + product.price,
        0
      );

      // const transferGroup = `ORDER_${Date.now()}`;
      let paymentIntent;
      try {
        paymentIntent = await stripe.paymentIntents.create({
          amount: consignorTotal * 100,
          currency: "eur",
          payment_method: payment_method,
          customer: customer.id,
          confirm: true,
          automatic_payment_methods: {
            enabled: true,
            allow_redirects: "never",
          },
        });
      } catch (error) {
        return NextResponse.json(
          { error: `Payment failed: ${error.message}` },
          { status: 500 }
        );
      }

      try {
        await new Promise((resolve) => setTimeout(resolve, 5000));

        const paymentIntentRetrieved = await stripe.paymentIntents.retrieve(
          paymentIntent.id
        );
        if (!paymentIntentRetrieved.latest_charge) {
          return NextResponse.json(
            { error: "Charge not found" },
            { status: 500 }
          );
        }

        const charge = await stripe.charges.retrieve(
          paymentIntentRetrieved.latest_charge
        );

        const balanceTransaction = await stripe.balanceTransactions.retrieve(
          charge.balance_transaction
        );

        const netAmount = balanceTransaction.net;
        const storeOwnerAmount =(Math.floor(netAmount / 100) * account.percentage) / 100;
        const consignorAmount = Math.floor(netAmount / 100) - storeOwnerAmount;

        const transfers = [
          stripe.transfers.create({
            amount: storeOwnerAmount * 100,
            currency: "eur",
            destination: account.accountId,
            source_transaction: paymentIntentRetrieved.latest_charge,
            transfer_group: `ORDER_${paymentIntent.id}`,
          }),
          stripe.transfers.create({
            amount: consignorAmount * 100,
            currency: "eur",
            destination: consignorAccount,
            source_transaction: paymentIntentRetrieved.latest_charge,
            transfer_group: `ORDER_${paymentIntent.id}`,
          }),
        ];
        await Promise.all(transfers);
        paymentResults.push({
          success: true,
          consignorAccount,
          paymentIntentId: paymentIntent.id,
          storeOwnerAmount: storeOwnerAmount.toFixed(2),
          consignorAmount: consignorAmount.toFixed(2), 
        });
      } catch (error) {
        return NextResponse.json(
          { error: `Transfer failed: ${error.message}` },
          { status: 500 }
        );
      }
    }
    return NextResponse.json(
      { success: true, payments: paymentResults },
      { status: 200 }
    );
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Server error. Please try again." },
      { status: 500 }
    );
  }
}

// export async function POST(req) {
//   try {
//     // const balanceBeforePayment = await stripe.balance.retrieve();
//     // const balance = await stripe.balance.retrieve({
//     //   stripeAccount: 'acct_1R1ihVPDSFqSFylA',
//     // });
//     // console.log("Balance before payment:", balanceBeforePayment,balance);

//     await dbConnect();
//     const {
//       payment_method,
//       total,
//       userId,
//       products,
//       customerName,
//       customerEmail,
//     } = await req.json();

//     const groupedProducts = products.reduce((acc, product) => {
//       const { consignorAccount } = product;
//       if (!acc[consignorAccount]) {
//         acc[consignorAccount] = [];
//       }
//       acc[consignorAccount].push(product);
//       return acc;
//     }, {});

//     const account = await Account.findOne({ userId: userId });

//     if (!account) {
//       return NextResponse.json({ error: "Account not exist" }, { status: 400 });
//     }

//     const customer = await stripe.customers.create({
//       name: customerName,
//       email: customerEmail,
//       payment_method: payment_method,
//       invoice_settings: {
//         default_payment_method: payment_method,
//       },
//     });

//     const paymentIntents = [];

//     const paymentIntent = await stripe.paymentIntents.create({
//       amount: total * 100, // Full charge amount in cents
//       currency: "eur",
//       payment_method: payment_method,
//       customer: customer.id,
//       confirm: true,
//       automatic_payment_methods: {
//         enabled: true,
//         allow_redirects: "never",
//       },
//     });

//     const paymentIntentRetrieved = await stripe.paymentIntents.retrieve(paymentIntent.id);
//     const chargeId = paymentIntentRetrieved.latest_charge;
//     await new Promise(resolve => setTimeout(resolve, 5000));

//     const charge = await stripe.charges.retrieve(chargeId);

//     // Retrieve the balance transaction to get the exact Stripe fees
//     const balanceTransaction = await stripe.balanceTransactions.retrieve(charge.balance_transaction);

//     await stripe.transfers.create({
//       amount: balanceTransaction.net, // Transfer only the net amount after Stripe fees
//       currency: "eur",
//       destination: account.accountId, // Connected Account ID
//       source_transaction: paymentIntentRetrieved.latest_charge,
//       transfer_group: `ORDER_${paymentIntent.id}`,
//     });
//     // for (let consignorAccount in groupedProducts) {

//     //   const consignorProducts = groupedProducts[consignorAccount];

//     //   // Step 3: Calculate the total for the consignor's products
//     //   const consignorTotal = consignorProducts.reduce(
//     //     (sum, product) => sum + product.price,
//     //     0
//     //   );

//     //   const transferGroup = `ORDER_${Date.now()}`;
//     // // Step 4: Create the paymentIntent for the consignor group
//     // const paymentIntent = await stripe.paymentIntents.create({
//     //   amount: consignorTotal * 100,
//     //   currency: "eur",
//     //   payment_method: payment_method,
//     //   customer: customer.id,
//     //   confirm: true,
//     //   automatic_payment_methods: {
//     //     enabled: true,
//     //     allow_redirects: "never",
//     //   },
//     //   transfer_group: transferGroup,
//     //   transfer_data: {
//     //     destination: connectedAccountId, // Replace with the actual Connected Account ID
//     //   },
//     // });

//     // // Check if paymentIntent was successful
//     // if (paymentIntent.status !== "succeeded") {
//     //   return NextResponse.json(
//     //     { error: "Payment failed to confirm" },
//     //     { status: 400 }
//     //   );
//     // }

//     // const retrievedPaymentIntent = await stripe.paymentIntents.retrieve(
//     //   paymentIntent.id
//     // );
//     // console.log(retrievedPaymentIntent,'retrievedPaymentIntent');

//     // const chargeId = retrievedPaymentIntent.latest_charge;
//     // await new Promise(resolve => setTimeout(resolve, 5000));
//     // // Retrieve the balance transaction
//     // const charge = await stripe.charges.retrieve(chargeId);
//     // console.log(charge,'charge')

//     // const balanceTransaction = await stripe.balanceTransactions.retrieve(charge.balance_transaction);

//     // let storeOwnerPercentage = 0;
//     // let consignorPercentage = 0;

//     // if(account.percentage)
//     // {
//     //   storeOwnerPercentage = account.percentage/100 * balanceTransaction.net/100;
//     //   consignorPercentage = balanceTransaction.net/100-storeOwnerPercentage;
//     // }

//     //   await stripe.transfers.create({
//     //     amount: balanceTransaction.net/100 * consignorPercentage/100,
//     //     currency: "eur",
//     //     destination: consignorAccount,
//     //     source_transaction: retrievedPaymentIntent.latest_charge,
//     //     transfer_group: transferGroup,
//     //   });

//     //   await stripe.transfers.create({
//     //     amount: balanceTransaction.net/100 * storeOwnerPercentage/100,
//     //     currency: "eur",
//     //     destination: account.accountId,
//     //     source_transaction: retrievedPaymentIntent.latest_charge,
//     //     transfer_group: transferGroup,
//     //   });
//     // }

//     return NextResponse.json(
//       {
//         success: true,
//         paymentIntent: true, // Send the array of payment intents
//       },
//       { status: 200 }
//     );
//   } catch (error) {
//     return NextResponse.json({ error: error.message }, { status: 400 });
//   }
// }
