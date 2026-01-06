// ============= @actions/dkk-point-rules.js =============

export const DKK_POINT_RULES = [
  // Maxi dresses / Jumpsuits / Sets
  {
    category: "MAXI_DRESS",
    brandType: "FAST_FASHION",
    fixedPoints: 350,
  },
  {
    category: "MAXI_DRESS",
    brandType: "LESS_FAST_FASHION",
    fixedPoints: 600,
  },

  {
    category: "JUMPSUIT",
    brandType: "FAST_FASHION",
    fixedPoints: 350,
  },
  {
    category: "JUMPSUIT",
    brandType: "LESS_FAST_FASHION",
    fixedPoints: 600,
  },

  {
    category: "SET",
    brandType: "FAST_FASHION",
    fixedPoints: 350,
  },
  {
    category: "SET",
    brandType: "LESS_FAST_FASHION",
    fixedPoints: 600,
  },

  // Jackets / Blazers
  {
    category: "JACKET",
    brandType: "FAST_FASHION",
    fixedPoints: 400,
  },
  {
    category: "JACKET",
    brandType: "LESS_FAST_FASHION",
    fixedPoints: 650,
  },
  {
    category: "BLAZER",
    brandType: "FAST_FASHION",
    fixedPoints: 400,
  },
  {
    category: "BLAZER",
    brandType: "LESS_FAST_FASHION",
    fixedPoints: 650,
  },

  // Coats
  {
    category: "COAT",
    brandType: "FAST_FASHION",
    fixedPoints: 800,
  },
  {
    category: "COAT",
    brandType: "LESS_FAST_FASHION",
    fixedPoints: 1400,
  },

  // Home knitted
  {
    category: "HOME_KNITTED",
    brandType: "ANY",
    fixedPoints: 1200,
  },

  // Shoes / Boots / Bags (range-based)
  {
    category: "SHOES",
    brandType: "ANY",
    minPoints: 100,
    maxPoints: 500,
    requiresQualityCheck: true,
  },
  {
    category: "BOOTS",
    brandType: "ANY",
    minPoints: 100,
    maxPoints: 500,
    requiresQualityCheck: true,
  },
  {
    category: "BAGS",
    brandType: "ANY",
    minPoints: 100,
    maxPoints: 500,
    requiresQualityCheck: true,
  },

  // Accessories (accepted, no points)
  {
    category: "ACCESSORIES",
    brandType: "ANY",
    fixedPoints: 0,
  },
];

import dbConnect from "@/lib/db";
import PointRule from "@/models/PointRule";
import User from "@/models/User";

export async function getDKKPointRules(storeUserId) {
  await dbConnect();

  const user = await User.findById(storeUserId).select("points_mode");
  if (!user || user.points_mode !== true) {
    return null;
  }

  // Seed rules safely (idempotent)
  for (const rule of DKK_POINT_RULES) {
    await PointRule.updateOne(
      {
        storeUserId,
        category: rule.category,
        brandType: rule.brandType
      },
      {
        $setOnInsert: {
          storeUserId,
          ...rule
        }
      },
      { upsert: true }
    );
  }
  const pointsData = await PointRule.find({ storeUserId, isActive: true });
  return pointsData;
}

