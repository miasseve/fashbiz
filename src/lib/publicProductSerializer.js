// Maps a real Product doc to the shape Discover's ReeProduct type expects
// (src/lib/ree.ts in the Discover repo). Kept in one place so the list and
// detail endpoints can never drift apart on field mapping.
export function serializePublicProduct(product, activeReservation) {
  let status = "LIVE";
  if (product.needsReview) status = "PENDING";
  else if (product.sold) status = "SOLD";
  else if (activeReservation) status = "RESERVED";

  const images = (product.images || []).map((i) => i.url).filter(Boolean);

  return {
    ree_product_id: String(product._id),
    store_id: product.userId ? String(product.userId._id || product.userId) : null,
    status,
    created_by: "ree",
    created_at: product.createdAt ? product.createdAt.toISOString() : new Date().toISOString(),
    updated_at: product.createdAt ? product.createdAt.toISOString() : new Date().toISOString(),
    ai_confidence: typeof product.aiConfidenceScore === "number" ? product.aiConfidenceScore : null,
    needs_review: !!product.needsReview,
    title: product.title,
    description: product.description,
    brand: product.brand,
    category: product.category,
    priceSuggestion: product.price,
    image: images[0] || "",
    images,
    material: product.fabric || undefined,
    colour: product.color?.name || undefined,
    size: Array.isArray(product.size) ? product.size.join(", ") : undefined,
    condition: product.condition_notes || product.condition_grade || undefined,
  };
}
