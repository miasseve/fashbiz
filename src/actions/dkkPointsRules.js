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
  // Tops / basics
  {
    category: "TOP",
    brandType: "FAST_FASHION",
    fixedPoints: 100,
  },
  {
    category: "TOP",
    brandType: "LESS_FAST_FASHION",
    fixedPoints: 150,
  },

  {
    category: "SHORTS",
    brandType: "FAST_FASHION",
    fixedPoints: 100,
  },
  {
    category: "SHORTS",
    brandType: "LESS_FAST_FASHION",
    fixedPoints: 150,
  },

  {
    category: "SPORTSWEAR",
    brandType: "FAST_FASHION",
    fixedPoints: 100,
  },
  {
    category: "SPORTSWEAR",
    brandType: "LESS_FAST_FASHION",
    fixedPoints: 150,
  },

  {
    category: "MATERNITY",
    brandType: "FAST_FASHION",
    fixedPoints: 100,
  },
  {
    category: "MATERNITY",
    brandType: "LESS_FAST_FASHION",
    fixedPoints: 150,
  },

  {
    category: "BODYSUIT",
    brandType: "FAST_FASHION",
    fixedPoints: 100,
  },
  {
    category: "BODYSUIT",
    brandType: "LESS_FAST_FASHION",
    fixedPoints: 150,
  },
  {
    category: "TROUSERS",
    brandType: "FAST_FASHION",
    fixedPoints: 200,
  },
  {
    category: "TROUSERS",
    brandType: "LESS_FAST_FASHION",
    fixedPoints: 350,
  },

  {
    category: "SKIRT",
    brandType: "FAST_FASHION",
    fixedPoints: 200,
  },
  {
    category: "SKIRT",
    brandType: "LESS_FAST_FASHION",
    fixedPoints: 350,
  },
  {
    category: "SHIRT",
    brandType: "FAST_FASHION",
    fixedPoints: 250,
  },
  {
    category: "SHIRT",
    brandType: "LESS_FAST_FASHION",
    fixedPoints: 450,
  },

  {
    category: "SWEATSHIRT",
    brandType: "FAST_FASHION",
    fixedPoints: 250,
  },
  {
    category: "SWEATSHIRT",
    brandType: "LESS_FAST_FASHION",
    fixedPoints: 450,
  },

  {
    category: "KNITWEAR",
    brandType: "FAST_FASHION",
    fixedPoints: 250,
  },
  {
    category: "KNITWEAR",
    brandType: "LESS_FAST_FASHION",
    fixedPoints: 450,
  },
  {
    category: "JEANS",
    brandType: "FAST_FASHION",
    fixedPoints: 300,
  },
  {
    category: "JEANS",
    brandType: "LESS_FAST_FASHION",
    fixedPoints: 500,
  },

  {
    category: "DRESS",
    brandType: "FAST_FASHION",
    fixedPoints: 300,
  },
  {
    category: "DRESS",
    brandType: "LESS_FAST_FASHION",
    fixedPoints: 500,
  },
  // {
  //   category: "OTHER",
  //   brandType: "ANY",
  //   fixedPoints: 0,
  // },
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

