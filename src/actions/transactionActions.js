"use server";
import { auth } from "@/auth";
import dbConnect from "@/lib/db";
import Transaction from "@/models/Transaction";
import Product from "@/models/Product";
import Account from "@/models/Account";
import Notification from "@/models/Notification";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function getTransactions() {
  try {
    const session = await auth();
    if (!session) {
      return { status: 401, error: "User is not authenticated" };
    }

    await dbConnect();

    const userId = session.user.id;
    const allTransactions = [];
    const seenKeys = new Set();

    // ─── Source 1: Transaction model (new records created by webhooks) ───
    const dbTransactions = await Transaction.find({ userId })
      .populate("productId", "title sku brand price images")
      .sort({ createdAt: -1 })
      .lean();

    for (const tx of dbTransactions) {
      const key = `${tx.channel}-${tx.orderId}-${tx.productId?._id || tx.productId}`;
      seenKeys.add(key);
      allTransactions.push({
        _id: tx._id.toString(),
        source: "db",
        channel: tx.channel,
        orderId: tx.orderId,
        shopifyOrderNumber: tx.shopifyOrderNumber || null,
        shopifyOrderUrl: tx.shopifyOrderUrl || null,
        productName: tx.productId?.title || "N/A",
        productSku: tx.productId?.sku || "",
        productBrand: tx.productId?.brand || "",
        customerName: tx.customerName || "",
        customerEmail: tx.customerEmail || "",
        amount: tx.amount,
        currency: tx.currency || "DKK",
        paymentMethod: tx.paymentMethod || "",
        status: tx.status || "completed",
        consignorName: tx.consignorName || "",
        consignorEmail: tx.consignorEmail || "",
        fulfillmentMethod: tx.fulfillmentMethod || null,
        shippingAddress: tx.shippingAddress || null,
        createdAt: tx.createdAt,
      });
    }

    // ─── Source 2: Stripe balance transactions (existing Ree payment history) ───
    try {
      const account = await Account.findOne({ userId });
      if (account?.accountId) {
        const stripeTransactions = await stripe.balanceTransactions.list(
          { limit: 100 },
          { stripeAccount: account.accountId }
        );

        for (const st of stripeTransactions.data) {
          const key = `stripe-${st.id}`;
          if (seenKeys.has(key)) continue;
          seenKeys.add(key);

          allTransactions.push({
            _id: st.id,
            source: "stripe",
            channel: "ree",
            orderId: st.id,
            shopifyOrderNumber: null,
            shopifyOrderUrl: null,
            productName: st.description || st.type,
            productSku: "",
            productBrand: "",
            customerName: "",
            customerEmail: "",
            amount: st.amount,
            currency: (st.currency || "dkk").toUpperCase(),
            paymentMethod: st.type === "payout" ? "Payout" : "Stripe",
            status: st.status === "available" ? "completed" : st.status === "pending" ? "pending" : st.status,
            consignorName: "",
            consignorEmail: "",
            fulfillmentMethod: "in-store",
            shippingAddress: null,
            createdAt: new Date(st.created * 1000).toISOString(),
            stripeType: st.type,
          });
        }
      }
    } catch (stripeErr) {
      console.error("[getTransactions] Stripe fetch failed:", stripeErr.message);
    }

    // ─── Source 3: Sold products + Notifications (existing Shopify data) ───
    try {
      const shopifyProducts = await Product.find({
        userId,
        sold: true,
        soldVia: "shopify",
      })
        .sort({ createdAt: -1 })
        .lean();

      if (shopifyProducts.length > 0) {
        const productIds = shopifyProducts.map((p) => p._id);
        const notifications = await Notification.find({
          productId: { $in: productIds },
          type: "sold",
        }).lean();

        const notifMap = {};
        for (const n of notifications) {
          notifMap[n.productId.toString()] = n;
        }

        for (const p of shopifyProducts) {
          const notif = notifMap[p._id.toString()];
          const orderId = notif?.orderDetails?.shopifyOrderId || p._id.toString();
          const key = `shopify-${orderId}-${p._id}`;
          if (seenKeys.has(key)) continue;
          seenKeys.add(key);

          allTransactions.push({
            _id: `shopify-${p._id}`,
            source: "product",
            channel: "shopify",
            orderId,
            shopifyOrderNumber: notif?.orderDetails?.shopifyOrderId || null,
            shopifyOrderUrl: notif?.orderDetails?.shopifyOrderUrl || null,
            productName: p.title,
            productSku: p.sku || "",
            productBrand: p.brand || "",
            customerName: notif?.orderDetails?.customerName || "",
            customerEmail: notif?.orderDetails?.customerEmail || "",
            amount: Math.round((p.price || 0) * 100),
            currency: notif?.orderDetails?.currency?.toUpperCase() || "DKK",
            paymentMethod: "Shopify",
            status: "completed",
            consignorName: p.consignorName || "",
            consignorEmail: p.consignorEmail || "",
            fulfillmentMethod: notif?.orderDetails?.fulfillmentMethod || null,
            shippingAddress: notif?.orderDetails?.shippingAddress || null,
            createdAt: notif?.createdAt || p.createdAt,
          });
        }
      }

      // Also include Ree-sold products that might not have Stripe records
      const reeProducts = await Product.find({
        userId,
        sold: true,
        soldVia: "ree",
      })
        .sort({ createdAt: -1 })
        .lean();

      for (const p of reeProducts) {
        const key = `ree-product-${p._id}`;
        // Check if we already have a Transaction model record or Stripe record for this product
        const alreadyExists = allTransactions.some(
          (t) =>
            t.productName === p.title &&
            t.channel === "ree" &&
            Math.abs(t.amount - Math.round((p.price || 0) * 100)) < 100
        );
        if (alreadyExists || seenKeys.has(key)) continue;
        seenKeys.add(key);

        allTransactions.push({
          _id: `ree-${p._id}`,
          source: "product",
          channel: "ree",
          orderId: p._id.toString(),
          shopifyOrderNumber: null,
          shopifyOrderUrl: null,
          productName: p.title,
          productSku: p.sku || "",
          productBrand: p.brand || "",
          customerName: "",
          customerEmail: "",
          amount: Math.round((p.price || 0) * 100),
          currency: "DKK",
          paymentMethod: "Stripe Card",
          status: "completed",
          consignorName: p.consignorName || "",
          consignorEmail: p.consignorEmail || "",
          fulfillmentMethod: "in-store",
          shippingAddress: null,
          createdAt: p.createdAt,
        });
      }
    } catch (productErr) {
      console.error("[getTransactions] Product fetch failed:", productErr.message);
    }

    // Sort all by date descending
    allTransactions.sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );

    return {
      status: 200,
      transactions: JSON.stringify(allTransactions),
    };
  } catch (error) {
    return {
      status: 500,
      error: error.message || "Failed to fetch transactions",
    };
  }
}
