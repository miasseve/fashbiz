/**
 * Maps fashbiz `/api/public/*` payloads (see fashbiz
 * `lib/publicProductSerializer.js` and `lib/publicStoreSerializer.js`) onto the
 * stable mobile shapes. Only whitelisted fields are copied, so nothing
 * upstream adds later (or already sends, like `businessNumber`) can leak.
 */
export const isObject = (v) => typeof v === "object" && v !== null && !Array.isArray(v);
export function str(v) {
    if (typeof v !== "string")
        return null;
    const t = v.trim();
    return t.length ? t : null;
}
export function num(v) {
    if (typeof v === "number" && Number.isFinite(v))
        return v;
    if (typeof v === "string" && v.trim() !== "" && Number.isFinite(Number(v)))
        return Number(v);
    return null;
}
/** Only absolute https media is passed through; anything else is dropped. */
export function httpsUrl(v) {
    const s = str(v);
    if (!s)
        return null;
    try {
        return new URL(s).protocol === "https:" ? s : null;
    }
    catch {
        return null;
    }
}
export function isoDate(v) {
    const s = str(v);
    if (!s)
        return null;
    const t = Date.parse(s);
    return Number.isNaN(t) ? null : new Date(t).toISOString();
}
/** Statuses the consumer catalogue may ever show. PENDING/PROCESSING never leave the BFF. */
const PUBLIC_STATUSES = new Set(["LIVE", "RESERVED", "SOLD"]);
export function normalizeProduct(raw) {
    if (!isObject(raw))
        return null;
    const id = str(raw.ree_product_id) ?? str(raw.id);
    const title = str(raw.title);
    const status = str(raw.status);
    if (!id || !title || !status || !PUBLIC_STATUSES.has(status))
        return null;
    if (raw.needs_review === true)
        return null;
    const images = Array.isArray(raw.images) ? raw.images.map(httpsUrl).filter((u) => !!u) : [];
    const lead = httpsUrl(raw.image);
    if (lead && !images.includes(lead))
        images.unshift(lead);
    const confidence = num(raw.ai_confidence);
    return {
        id,
        storeId: str(raw.store_id) ?? str(raw.storeId),
        status,
        title,
        description: str(raw.description),
        brand: str(raw.brand),
        category: str(raw.category),
        price: num(raw.priceSuggestion) ?? num(raw.price),
        currency: "DKK",
        images,
        size: str(raw.size),
        condition: str(raw.condition),
        material: str(raw.material),
        colour: str(raw.colour),
        aiConfidence: confidence == null ? null : Math.min(1, Math.max(0, confidence)),
        createdAt: isoDate(raw.created_at),
    };
}
export function normalizeStore(raw) {
    if (!isObject(raw))
        return null;
    const id = str(raw.id);
    const name = str(raw.name);
    if (!id || !name)
        return null;
    const lat = num(raw.lat);
    const lng = num(raw.lng);
    const validCoords = lat != null && lng != null && Math.abs(lat) <= 90 && Math.abs(lng) <= 180 && !(lat === 0 && lng === 0);
    const count = num(raw.activeProductCount);
    return {
        id,
        name,
        address: str(raw.address),
        city: str(raw.city),
        state: str(raw.state),
        postalCode: str(raw.zipcode) ?? str(raw.postalCode),
        country: str(raw.country),
        lat: validCoords ? lat : null,
        lng: validCoords ? lng : null,
        verified: raw.verified === true,
        logo: httpsUrl(raw.logo),
        thumbnail: httpsUrl(raw.thumbnail),
        storefront: null,
        description: str(raw.description),
        phone: str(raw.phone),
        activeProductCount: count != null && count >= 0 ? Math.floor(count) : null,
    };
}
/** Extracts a list from `{ products: [...] }` / `{ stores: [...] }`. */
export function listFrom(body, key) {
    if (!isObject(body))
        return null;
    const list = body[key];
    return Array.isArray(list) ? list : null;
}
/** `{ product: {...} }` for product detail; store detail is the bare object. */
export function productFrom(body) {
    return isObject(body) && "product" in body ? body.product : null;
}
