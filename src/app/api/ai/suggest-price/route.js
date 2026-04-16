import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Product from "@/models/Product";
import User from "@/models/User";
import mongoose from "mongoose";

/**
 * POST /api/ai/suggest-price
 *
 * Suggests a price based on the store's own pricing history.
 * Only activates after 2 months of use OR 300+ products.
 *
 * Looks at the store's past products matching the same category, brand,
 * and condition to compute a suggested price range.
 */
export async function POST(req) {
  try {
    await dbConnect();

    const { storeId, category, subcategory, brand, condition_grade } =
      await req.json();

    if (!storeId) {
      return NextResponse.json(
        { eligible: false, reason: "No store ID provided" },
        { status: 200 }
      );
    }

    const storeObjectId = new mongoose.Types.ObjectId(storeId);

    // ─── Check eligibility: 2 months of use OR 300+ products ───
    const [user, productCount] = await Promise.all([
      User.findById(storeObjectId).select("createdAt").lean(),
      Product.countDocuments({ userId: storeObjectId, isDemo: false }),
    ]);

    if (!user) {
      return NextResponse.json(
        { eligible: false, reason: "Store not found" },
        { status: 200 }
      );
    }

    const twoMonthsAgo = new Date();
    twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);
    const accountOldEnough = user.createdAt <= twoMonthsAgo;
    const hasEnoughProducts = productCount >= 300;
    if (!accountOldEnough && !hasEnoughProducts) {
      return NextResponse.json({
        eligible: false,
        reason: "Store needs 2 months of use or 300+ products for price suggestions",
        currentProducts: productCount,
        accountAge: Math.floor(
          (Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24)
        ),
      });
    }

    // ─── Query price history from the store's own products ───
    // Build filter: match by store, then progressively by category/brand/condition
    const baseFilter = {
      userId: storeObjectId,
      isDemo: false,
      price: { $gt: 1 }, // Exclude $1 placeholder prices (points mode)
    };

    // Try to find exact matches first (same category + brand + condition)
    const filters = [
      // Most specific: same category + brand + condition
      {
        ...baseFilter,
        category,
        ...(brand && brand !== "Unbranded" ? { brand } : {}),
        ...(condition_grade ? { condition_grade } : {}),
      },
      // Medium: same category + brand
      {
        ...baseFilter,
        category,
        ...(brand && brand !== "Unbranded" ? { brand } : {}),
      },
      // Broad: same category only
      { ...baseFilter, category },
    ];

    let prices = [];
    let matchLevel = "";

    for (const filter of filters) {
      const products = await Product.find(filter)
        .select("price brand category condition_grade")
        .sort({ createdAt: -1 })
        .limit(50)
        .lean();

      if (products.length >= 3) {
        prices = products.map((p) => p.price);
        if (filter.condition_grade) {
          matchLevel = "exact";
        } else if (filter.brand) {
          matchLevel = "category+brand";
        } else {
          matchLevel = "category";
        }
        break;
      }
    }

    if (prices.length < 3) {
      return NextResponse.json({
        eligible: true,
        hasSuggestion: false,
        reason: "Not enough similar products in your store history yet for Price suggestions",
      });
    }

    // ─── Compute price statistics ───
    prices.sort((a, b) => a - b);
    const median = prices[Math.floor(prices.length / 2)];
    const avg = Math.round(prices.reduce((a, b) => a + b, 0) / prices.length);
    const min = prices[0];
    const max = prices[prices.length - 1];

    // Suggested price = median (more robust than average against outliers)
    const suggestedPrice = median;

    // Price range: 25th and 75th percentile
    const p25 = prices[Math.floor(prices.length * 0.25)];
    const p75 = prices[Math.floor(prices.length * 0.75)];

    return NextResponse.json({
      eligible: true,
      hasSuggestion: true,
      suggestedPrice,
      priceRange: { low: p25, high: p75 },
      stats: { median, avg, min, max, sampleSize: prices.length },
      matchLevel,
    });
  } catch (error) {
    console.error("Suggest-price error:", error);
    return NextResponse.json(
      { eligible: false, reason: error.message },
      { status: 500 }
    );
  }
}
