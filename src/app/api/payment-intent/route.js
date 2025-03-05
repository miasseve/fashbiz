import Stripe from "stripe";
import { NextResponse } from "next/server";
import Account from "@/models/Account";
import dbConnect from "@/lib/db";
// Initialize Stripe with your secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(req) {
  try {
    const { payment_method, total ,userId,product } = await req.json();
    await dbConnect();
    const totall=total*100;
    const account = await Account.findOne({ userId:userId });
    if(!account){
      return NextResponse.json({ error: 'Account not exist' }, { status: 400 });
    }

    // const paymentIntent = await stripe.paymentIntents.create({
    //   amount: totall * 100,
    //   currency: "usd", 
    //   description: "Description",
    //   payment_method: payment_method,
    //   transfer_data: {
    //     destination: account.accountId,
    //   },
    //   application_fee_amount: Math.round(totall * 0.1 * 100), 
    // });

    // const paymentIntent = await stripe.paymentIntents.create({
    //   amount: totall * 100, // Total amount (in cents)
    //   currency: "usd",
    //   description: "Payment split between two consignors",
    //   payment_method: payment_method,
    //   transfer_group: "ORDER_12345", // Optional: a unique group identifier for tracking the payment and transfers
    //   application_fee_amount: Math.round(totall * 0.1 * 100), // Platform fee (10% of total)
    //   transfer_data: {
    //     destination: account.accountId, // First consignor account
    //     amount: consignor1Amount, // Amount to be transferred to the first consignor
    //   },
    // });
  
    // await stripe.transfers.create({
    //   amount: consignor2Amount, // Amount for the second consignor
    //   currency: "usd",
    //   destination: product.consignorAccount, // Second consignor account
    //   transfer_group: "ORDER_12345", // Same transfer group to link the transfers together
    // });
    // Step 1: Create a new Customer (if you don't have one yet)
    // const customer = await stripe.customers.create({
    //   email: 'test@gmail.com',
    // });

    // // Step 2: Attach the payment method to the customer
    // await stripe.paymentMethods.attach(payment_method, {
    //   customer: customer.id,
    // });

    // // Step 3: Set the payment method as default for the customer
    // await stripe.customers.update(customer.id, {
    //   invoice_settings: {
    //     default_payment_method: payment_method,
    //   },
    // });
    const paymentIntent = await stripe.paymentIntents.create({
      amount: 100 * 100, // 50% of the total amount (50 EUR)
      currency: "eur",
      payment_method: payment_method,
      confirm: true,
      transfer_data: {
        destination: account.accountId, // First connected account
        amount:100*100*0.5
      },
      // on_behalf_of:account.accountId,
      automatic_payment_methods: {
            enabled: true,
            allow_redirects: 'never',
          },
    });
    
    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({ error: "Payment failed to confirm" });
    }

    const transfer2 = await stripe.transfers.create({
      amount: 100*100*0.4, 
      currency: 'eur',
      destination: 'acct_1QuuY3POoiTja26l', // The second connected account
    });
    // The second payment intent that sends funds to the second connected account
  //   const secondPaymentIntent = await stripe.paymentIntents.create({
  //     amount: 100 * 100 * 0.4, // 50% of the total amount (50 EUR)
  //     currency: "eur",
  //     payment_method: payment_method,
  //     confirm: true,
  //     customer: customer.id,
  //     automatic_payment_methods: { enabled: true },
  //     transfer_data: {
  //       destination: product.consignorAccount, // Second connected account
  //     },
  //     automatic_payment_methods: {
  //           enabled: true,
  //           allow_redirects: 'never',
  //         },
  //  });

    // // Step 3: Transfer the remaining portion of the funds to the second connected account
    // const transfer2 = await stripe.transfers.create({
    //   amount: Math.floor(100 * 0.5 ), // 50% to the second connected account
    //   currency: "eur",
    //   destination: account.accountId,
    //   transfer_group: paymentIntent.id,
    // });

    // const paymentIntent = await stripe.paymentIntents.create({
    //   amount: 100*100 ,  
    //   currency: "eur",
    //   description: "Description",
    //   payment_method: payment_method,
    //   application_fee_amount: Math.round(100 * 0.1 * 100),
    //   transfer_data: {
    //         destination: account.accountId, // First consignor account
    //   },
    //   automatic_payment_methods: {
    //     enabled: true,
    //     allow_redirects: 'never',
    //   },
    // });
   
    // const confirmedPaymentIntent = await stripe.paymentIntents.confirm(paymentIntent.id, {
    //   payment_method: payment_method,
    // });
    // if (confirmedPaymentIntent.status === 'succeeded') {
     
    //const platformFee = Math.round(total * 0.1 * 100);  // 10% platform fee
    // const amountToTransfer1 = Math.round(100 * 0.4 * 100);  // 90% to the account (after the platform fee)
    // const amountToTransfer2 = Math.round(100 * 0.5 * 100);  // 90% to the account (after the platform fee)

   
    // await stripe.transfers.create({
    //   amount: amountToTransfer1,
    //   currency: "eur",
    //   destination: product.consignorAccount,  // The account to transfer the 90% to
    //   transfer_group: paymentIntent.id,  // Link the transfer to the same payment group
    // });
    // // Step 3: Create the transfer for the platform fee (10%)
    // await stripe.transfers.create({
    //   amount: amountToTransfer2,
    //   currency: "eur",
    //   destination: account.accountId,  // Your platform account ID
    //   transfer_group: paymentIntent.id,  // Link the transfer to the same payment group
    // });

     return NextResponse.json({
        paymentIntent: true,
     },{status:200});

  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
