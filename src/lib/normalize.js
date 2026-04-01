// Backend normalization and validation utilities for AI product responses

import {
  CATEGORIES,
  SUBCATEGORIES,
  ALL_SUBCATEGORIES,
  NORMALIZED_COLORS,
  NORMALIZED_FABRICS,
  CONDITION_GRADES,
  SIZE_ALIASES,
  KNOWN_BRANDS,
  SHOE_CATEGORIES,
  ACCESSORY_CATEGORIES,
} from "./taxonomy";

/**
 * Levenshtein distance between two strings (case-insensitive).
 * Used for fuzzy brand matching to catch typos like "Guccci" → "Gucci".
 */
function levenshtein(a, b) {
  a = a.toLowerCase();
  b = b.toLowerCase();
  const m = a.length;
  const n = b.length;
  const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

/**
 * Normalize a single size string to standard format, aware of product category.
 * - Shoes: expects numeric sizes (EU 38, US 10, UK 7, or bare numbers like 42)
 * - Accessories/Bags/Jewelry: defaults to "One Size" when ambiguous
 * - Clothing: standard S/M/L/XL or EU/IT numeric
 */
export function normalizeSize(raw, category = null) {
  if (!raw || typeof raw !== "string") return raw;
  const trimmed = raw.trim();
  const lower = trimmed.toLowerCase();

  const isShoe = SHOE_CATEGORIES.includes(category);
  const isAccessory = ACCESSORY_CATEGORIES.includes(category);

  // Accessories/Bags/Jewelry — default ambiguous sizes to "One Size"
  if (isAccessory) {
    if (SIZE_ALIASES[lower]) return SIZE_ALIASES[lower];
    // If it's a bare number or unclear, default to One Size
    if (/^\d+(\.\d+)?$/.test(trimmed)) return "One Size";
    if (/^[a-z]{1,4}$/.test(lower)) return trimmed.toUpperCase();
    return "One Size";
  }

  // Check direct alias match (S/M/L/XL etc.)
  if (SIZE_ALIASES[lower]) {
    // Don't map clothing aliases for shoes — "M" is not a shoe size
    if (isShoe && ["XS", "S", "M", "L", "XL", "XXL", "XXXL"].includes(SIZE_ALIASES[lower])) {
      return trimmed; // return as-is, let merchant correct
    }
    return SIZE_ALIASES[lower];
  }

  // EU prefix: "EU 38" or "eu38"
  const euMatch = lower.match(/^eu\s*(\d{2})$/);
  if (euMatch) {
    const num = parseInt(euMatch[1]);
    if (isShoe) return `EU ${num}`; // shoe EU size, no clothing mapping
    return `EU ${num}`;
  }

  // IT prefix: "IT 42" or "it42"
  const itMatch = lower.match(/^it\s*(\d{2})$/);
  if (itMatch) {
    return `IT ${itMatch[1]}`;
  }

  // US prefix
  const usMatch = lower.match(/^us\s*(\d+\.?\d*)$/);
  if (usMatch) return `US ${usMatch[1]}`;

  // UK prefix
  const ukMatch = lower.match(/^uk\s*(\d+\.?\d*)$/);
  if (ukMatch) return `UK ${ukMatch[1]}`;

  // Bare numeric sizes
  if (/^\d+(\.\d+)?$/.test(trimmed)) {
    const num = parseFloat(trimmed);
    if (isShoe) {
      // Shoe: bare number ≥ 35 is likely EU, otherwise keep as-is
      if (num >= 35 && num <= 48) return `EU ${Math.round(num)}`;
      return trimmed;
    }
    // Clothing: bare number could be EU/IT — keep as-is
    return trimmed;
  }

  // Uppercase single-word sizes
  if (/^[a-z]{1,4}$/.test(lower)) return trimmed.toUpperCase();

  return trimmed;
}

/**
 * Normalize a comma-separated size string or array (category-aware)
 */
export function normalizeSizes(input, category = null) {
  if (!input) return [];
  const parts = Array.isArray(input)
    ? input
    : input.split(",").map((s) => s.trim()).filter(Boolean);
  return parts.map((s) => normalizeSize(s, category));
}

/**
 * Validate and correct category against taxonomy
 * Returns the closest valid category or the original if no match
 */
export function normalizeCategory(raw) {
  if (!raw) return null;
  const lower = raw.toLowerCase().trim();
  const match = CATEGORIES.find((c) => c.toLowerCase() === lower);
  if (match) return match;

  // Fuzzy: check if the raw string is contained in any category
  const partial = CATEGORIES.find((c) =>
    c.toLowerCase().includes(lower) || lower.includes(c.toLowerCase())
  );
  return partial || raw;
}

/**
 * Validate subcategory against the official taxonomy for a given category
 */
export function normalizeSubcategory(raw, category) {
  if (!raw) return null;
  const lower = raw.toLowerCase().trim();

  // First check within the given category
  if (category && SUBCATEGORIES[category]) {
    const match = SUBCATEGORIES[category].find(
      (s) => s.toLowerCase() === lower
    );
    if (match) return match;

    // Partial match within category
    const partial = SUBCATEGORIES[category].find(
      (s) =>
        s.toLowerCase().includes(lower) || lower.includes(s.toLowerCase())
    );
    if (partial) return partial;
  }

  // Check across all subcategories
  const globalMatch = ALL_SUBCATEGORIES.find(
    (s) => s.toLowerCase() === lower
  );
  if (globalMatch) return globalMatch;

  const globalPartial = ALL_SUBCATEGORIES.find(
    (s) => s.toLowerCase().includes(lower) || lower.includes(s.toLowerCase())
  );
  return globalPartial || raw;
}

/**
 * Find the parent category for a given subcategory
 */
export function findCategoryForSubcategory(subcategory) {
  if (!subcategory) return null;
  const lower = subcategory.toLowerCase().trim();
  for (const [category, subs] of Object.entries(SUBCATEGORIES)) {
    if (subs.some((s) => s.toLowerCase() === lower)) {
      return category;
    }
  }
  return null;
}

/**
 * Normalize a color object { name, hex } or a plain string.
 * Preserves the hex code so the frontend swatch works correctly.
 * Returns { name, hex }.
 */
export function normalizeColor(raw) {
  if (!raw) return { name: "", hex: "" };

  // Already an object with name/hex (new format)
  if (typeof raw === "object" && raw.name !== undefined) {
    return {
      name: raw.name?.trim().toLowerCase() || "",
      hex: raw.hex?.trim() || "",
    };
  }

  // Plain string (old format fallback)
  return { name: String(raw).trim().toLowerCase(), hex: "" };
}

/**
 * Normalize colors input — handles both old string/array and new {name,hex} object.
 * Always returns { name, hex } so the form color swatch works.
 */
export function normalizeColors(colors) {
  if (!colors) return { name: "", hex: "" };

  // New format: single {name, hex} object
  if (typeof colors === "object" && !Array.isArray(colors)) {
    return normalizeColor(colors);
  }

  // Old format: array of strings — return the first one, no hex available
  if (Array.isArray(colors) && colors.length > 0) {
    const first = colors[0];
    return typeof first === "object"
      ? normalizeColor(first)
      : { name: String(first).trim().toLowerCase(), hex: "" };
  }

  return { name: "", hex: "" };
}

/**
 * Normalize fabric names against the allowed vocabulary
 */
export function normalizeFabric(raw) {
  if (!raw) return null;
  const lower = raw.toLowerCase().trim();
  const match = NORMALIZED_FABRICS.find((f) => f.toLowerCase() === lower);
  if (match) return match;

  // Partial match
  const partial = NORMALIZED_FABRICS.find(
    (f) =>
      f.toLowerCase().includes(lower) || lower.includes(f.toLowerCase())
  );
  return partial || raw;
}

/**
 * Normalize an array of fabrics
 */
export function normalizeFabrics(fabrics) {
  if (!fabrics) return [];
  const arr = Array.isArray(fabrics) ? fabrics : [fabrics];
  return [...new Set(arr.map(normalizeFabric).filter(Boolean))];
}

/**
 * Validate brand against the known brand list.
 * Uses exact match → substring match → Levenshtein fuzzy match.
 * Catches typos like "Guccci" → "Gucci", "Balmian" → "Balmain".
 * Returns { brand, isKnown }
 */
export function validateBrand(raw) {
  if (!raw) return { brand: "", isKnown: false };
  const trimmed = raw.trim();
  const lower = trimmed.toLowerCase();

  // 1. Exact match (case-insensitive)
  const exactMatch = KNOWN_BRANDS.find((b) => b.toLowerCase() === lower);
  if (exactMatch) return { brand: exactMatch, isKnown: true };

  // 2. Substring match — input contained in brand or vice versa
  const partial = KNOWN_BRANDS.find(
    (b) =>
      b.toLowerCase().includes(lower) || lower.includes(b.toLowerCase())
  );
  if (partial) return { brand: partial, isKnown: true };

  // 3. Levenshtein fuzzy match — catch typos within edit distance threshold
  //    Threshold: max 2 edits for short names (<=6 chars), max 3 for longer ones
  const maxDist = lower.length <= 6 ? 2 : 3;
  let bestMatch = null;
  let bestDist = Infinity;

  for (const known of KNOWN_BRANDS) {
    // Skip if length difference alone exceeds threshold
    if (Math.abs(known.length - trimmed.length) > maxDist) continue;
    const dist = levenshtein(trimmed, known);
    if (dist < bestDist) {
      bestDist = dist;
      bestMatch = known;
    }
  }

  if (bestMatch && bestDist <= maxDist) {
    return { brand: bestMatch, isKnown: true };
  }

  return { brand: trimmed, isKnown: false };
}

/**
 * Validate condition grade
 */
export function normalizeConditionGrade(raw) {
  if (!raw) return null;
  const upper = raw.toUpperCase().trim();
  if (CONDITION_GRADES.includes(upper)) return upper;
  return null;
}

/**
 * Calculate reward points based on store-specific logic
 * This is a deterministic rule applied AFTER the AI response
 */
export function calculateValueScore({ category, brand, price, conditionGrade }) {
  // Base points by category
  const categoryPoints = {
    Tops: 50,
    Bottoms: 60,
    Dresses: 80,
    Outerwear: 100,
    Knitwear: 70,
    Activewear: 40,
    Swimwear: 40,
    Accessories: 30,
    Shoes: 70,
    Bags: 90,
    Jewelry: 50,
    Kids: 30,
  };

  let points = categoryPoints[category] || 50;

  // Brand multiplier
  const { isKnown } = validateBrand(brand);
  if (isKnown) points = Math.round(points * 1.5);

  // Condition multiplier
  if (conditionGrade === "A") points = Math.round(points * 1.2);
  else if (conditionGrade === "C") points = Math.round(points * 0.8);

  // Price-based adjustment
  if (price && price > 500) points = Math.round(points * 1.3);
  else if (price && price > 200) points = Math.round(points * 1.1);

  return points;
}

/**
 * Full normalization pipeline — takes raw AI output and returns cleaned result
 */
export function normalizeProductResponse(raw) {
  const category = normalizeCategory(raw.category) ||
    findCategoryForSubcategory(raw.subcategory);
  const subcategory = normalizeSubcategory(raw.subcategory, category);
  const { brand } = validateBrand(raw.brand);
  const color = normalizeColors(raw.color); // { name, hex }
  const fabrics = normalizeFabrics(raw.fabric);
  const size = normalizeSizes(raw.size, category).join(", ");
  const conditionGrade = normalizeConditionGrade(raw.condition_grade);

  const rewardPoints = calculateValueScore({
    category,
    brand,
    price: raw.price,
    conditionGrade,
  });

  // Flag low confidence for manual review
  const needsReview = (raw.confidence_score || 0) < 0.6;

  return {
    title: raw.title?.trim() || "",
    brand,
    size,
    category: category || "",
    subcategory: subcategory || "",
    color,
    fabric: fabrics,
    description: raw.description?.trim() || "",
    condition_grade: conditionGrade,
    condition_notes: raw.condition_notes?.trim() || "",
    shopify_tags: Array.isArray(raw.shopify_tags)
      ? raw.shopify_tags.map((t) => t.toLowerCase().trim())
      : [],
    value_score: rewardPoints,
    confidence_score: raw.confidence_score || 0,
    needsReview,
  };
}
