import { bodyLimit } from "hono/body-limit";
import { requireSession } from "./authRoutes.js";
import { fail, failUpstream, hasUnknownKeys, jsonBody } from "./errors.js";
import { httpsUrl, isObject, normalizeProduct, normalizeStore, num, productFrom, str } from "./normalize.js";
import { createRateLimiter } from "./rateLimit.js";
import { ID_PATTERN } from "./upstream.js";
const RESERVATION_STATES = new Set(["RESERVED", "CONFIRMED", "COLLECTED", "EXPIRED", "CANCELLED"]);
export function normalizeSaves(body) {
    if (!isObject(body) || !Array.isArray(body.saves))
        return null;
    const saves = [];
    for (const raw of body.saves) {
        if (!isObject(raw))
            continue;
        const productId = str(raw.productId);
        const savedAt = num(raw.savedAt);
        if (!productId || !ID_PATTERN.test(productId))
            continue;
        saves.push({ productId, savedAt: new Date(savedAt ?? 0).toISOString() });
    }
    return saves;
}
export function normalizeReservation(raw) {
    if (!isObject(raw))
        return null;
    const id = str(raw.reservationId);
    const productId = str(raw.productId);
    const storeId = str(raw.storeId);
    const state = str(raw.state);
    const expiresAt = num(raw.expiresAt);
    if (!id || !ID_PATTERN.test(id) || !productId || !storeId || !state || !RESERVATION_STATES.has(state) || expiresAt == null) {
        return null;
    }
    const createdAt = num(raw.createdAt);
    return {
        id,
        productId,
        storeId,
        state,
        expiresAt: new Date(expiresAt).toISOString(),
        createdAt: createdAt == null ? null : new Date(createdAt).toISOString(),
    };
}
/**
 * Every open hold in a fashbiz reservations body. Newer fashbiz lists them all
 * (`reservations`); an older one only names the latest (`reservation`).
 * Returns null when the body is not a reservations answer at all.
 */
export function normalizeReservations(body) {
    if (!isObject(body))
        return null;
    const raws = Array.isArray(body.reservations) ? body.reservations : body.reservation == null ? [] : [body.reservation];
    const list = [];
    for (const raw of raws) {
        const reservation = normalizeReservation(raw);
        if (!reservation)
            return null;
        list.push(reservation);
    }
    return list.sort((a, b) => a.expiresAt.localeCompare(b.expiresAt));
}
/** Discover's two hold durations (reservation-rules.ts `DURATIONS`). */
const DURATIONS = new Set([2, 5]);
function hostedImages(raw) {
    if (!Array.isArray(raw))
        return [];
    return raw.flatMap((im) => {
        if (!isObject(im))
            return [];
        const url = httpsUrl(im.url);
        return url ? [{ url, publicId: str(im.publicId) ?? "" }] : [];
    });
}
export function normalizeAnalysis(body) {
    if (!isObject(body) || !isObject(body.analysis))
        return null;
    const a = body.analysis;
    const images = hostedImages(body.images);
    if (!images.length)
        return null;
    const grade = str(a.condition_grade);
    const colour = isObject(a.color) && str(a.color.name) ? { name: str(a.color.name), hex: str(a.color.hex) } : null;
    const confidence = num(a.confidence_score);
    return {
        images,
        analysis: {
            title: str(a.title),
            brand: str(a.brand),
            size: str(a.size),
            category: str(a.category),
            subcategory: str(a.subcategory),
            colour,
            materials: Array.isArray(a.fabric) ? a.fabric.map(str).filter((f) => !!f) : [],
            description: str(a.description),
            conditionGrade: grade === "A" || grade === "B" || grade === "C" ? grade : null,
            conditionNotes: str(a.condition_notes),
            confidence: confidence == null ? null : Math.min(1, Math.max(0, confidence)),
        },
    };
}
// ── Capture input validation ─────────────────────────────────────────────────
const DATA_URL = /^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/]+={0,2})$/;
export const MAX_ANALYZE_IMAGES = 4;
export const MAX_SUBMIT_IMAGES = 6;
/** Only photos the analysis step hosted may be attached to a product. */
const HOSTED_IMAGE_HOSTS = new Set(["res.cloudinary.com"]);
function decodedBytes(base64) {
    const padding = base64.endsWith("==") ? 2 : base64.endsWith("=") ? 1 : 0;
    return Math.floor((base64.length * 3) / 4) - padding;
}
export function checkAnalyzeImages(raw, maxImageBytes) {
    if (!Array.isArray(raw) || raw.length < 1 || raw.length > MAX_ANALYZE_IMAGES) {
        return { ok: false, status: 400, code: "invalid_request" };
    }
    for (const image of raw) {
        const match = typeof image === "string" ? DATA_URL.exec(image) : null;
        if (!match)
            return { ok: false, status: 400, code: "invalid_request" };
        if (decodedBytes(match[2]) > maxImageBytes)
            return { ok: false, status: 413, code: "payload_too_large" };
    }
    return { ok: true, value: raw };
}
const SUBMIT_KEYS = [
    "images",
    "title",
    "description",
    "brand",
    "category",
    "subcategory",
    "price",
    "material",
    "colour",
    "colorHex",
    "size",
    "condition",
    "conditionGrade",
    "aiConfidence",
    "storeId",
];
const TEXT_LIMITS = {
    title: 200,
    description: 4000,
    brand: 120,
    category: 120,
    subcategory: 120,
    material: 120,
    colour: 60,
    size: 40,
    condition: 500,
};
/** Builds the fashbiz create-product body from a whitelisted, bounded mobile body. */
export function checkSubmission(body) {
    const bad = { ok: false, status: 400, code: "invalid_request" };
    if (hasUnknownKeys(body, SUBMIT_KEYS))
        return bad;
    const images = Array.isArray(body.images) ? body.images : null;
    if (!images || images.length < 1 || images.length > MAX_SUBMIT_IMAGES)
        return bad;
    const hosted = [];
    for (const im of images) {
        if (!isObject(im) || hasUnknownKeys(im, ["url", "publicId"]))
            return bad;
        const url = httpsUrl(im.url);
        if (!url || !HOSTED_IMAGE_HOSTS.has(new URL(url).hostname))
            return bad;
        const publicId = im.publicId === undefined ? "" : im.publicId;
        if (typeof publicId !== "string" || publicId.length > 300)
            return bad;
        hosted.push({ url, publicId });
    }
    const payload = { images: hosted };
    for (const [key, limit] of Object.entries(TEXT_LIMITS)) {
        const value = body[key];
        if (value === undefined || value === null)
            continue;
        if (typeof value !== "string" || value.length > limit)
            return bad;
        payload[key === "colour" ? "colorName" : key] = value;
    }
    if (body.colorHex !== undefined && body.colorHex !== null) {
        if (typeof body.colorHex !== "string" || !/^#[0-9a-f]{3,8}$/i.test(body.colorHex))
            return bad;
        payload.colorHex = body.colorHex;
    }
    if (body.price !== undefined) {
        if (typeof body.price !== "number" || !Number.isFinite(body.price) || body.price < 0 || body.price > 1_000_000)
            return bad;
        payload.price = body.price;
    }
    if (body.aiConfidence !== undefined && body.aiConfidence !== null) {
        if (typeof body.aiConfidence !== "number" || !Number.isFinite(body.aiConfidence))
            return bad;
        payload.aiConfidence = body.aiConfidence;
    }
    if (body.conditionGrade !== undefined && body.conditionGrade !== null) {
        if (!["A", "B", "C"].includes(body.conditionGrade))
            return bad;
        payload.conditionGrade = body.conditionGrade;
    }
    let storeId = null;
    if (body.storeId !== undefined && body.storeId !== null) {
        if (typeof body.storeId !== "string" || !ID_PATTERN.test(body.storeId))
            return bad;
        storeId = body.storeId;
        payload.storeId = storeId;
    }
    return { ok: true, value: { payload, storeId } };
}
// ── Routes ───────────────────────────────────────────────────────────────────
export function registerMemberRoutes(app, config, sessions, upstream) {
    const auth = requireSession(sessions);
    const HOUR = 60 * 60 * 1000;
    const allowAnalyze = createRateLimiter(config.captureRateLimitPerHour, Date.now, HOUR);
    const allowSubmit = createRateLimiter(config.captureRateLimitPerHour, Date.now, HOUR);
    const perUser = (allow) => async (c, next) => {
        const verdict = allow(c.get("session").user.id);
        if (!verdict.allowed) {
            c.header("retry-after", String(verdict.retryAfterSeconds));
            return fail(c, 429, "rate_limited");
        }
        await next();
    };
    const captureBody = bodyLimit({
        maxSize: config.captureMaxBodyBytes,
        onError: (c) => fail(c, 413, "payload_too_large"),
    });
    const smallBody = bodyLimit({ maxSize: 4096, onError: (c) => fail(c, 413, "payload_too_large") });
    /** Product submission carries hosted URLs, never photos, so its cap is small. */
    const submitBody = bodyLimit({ maxSize: 64_000, onError: (c) => fail(c, 413, "payload_too_large") });
    const userId = (c) => c.get("session").user.id;
    // ── Saved Finds ──
    app.get("/v1/me/saves", auth, async (c) => {
        const result = await upstream({ kind: "savesList", userId: userId(c) });
        if (!result.ok)
            return failUpstream(c, result.error);
        const saves = normalizeSaves(result.body);
        if (!saves)
            return fail(c, 502, "upstream_error");
        return c.json({ saves });
    });
    /** Idempotent upstream. The body is `{ productId }` and nothing else - a `userId` is refused, not ignored. */
    app.post("/v1/me/saves", auth, smallBody, async (c) => {
        const body = await jsonBody(c);
        if (!body || hasUnknownKeys(body, ["productId"]))
            return fail(c, 400, "invalid_request");
        const productId = body.productId;
        if (typeof productId !== "string" || !ID_PATTERN.test(productId))
            return fail(c, 400, "invalid_request");
        const result = await upstream({ kind: "saveAdd", userId: userId(c), productId });
        if (!result.ok)
            return failUpstream(c, result.error);
        return c.json({ productId, saved: true });
    });
    app.delete("/v1/me/saves/:productId", auth, async (c) => {
        const productId = c.req.param("productId");
        if (!ID_PATTERN.test(productId))
            return fail(c, 400, "invalid_request");
        const result = await upstream({ kind: "saveRemove", userId: userId(c), productId });
        if (!result.ok)
            return failUpstream(c, result.error);
        return c.json({ productId, saved: false });
    });
    // ── Reserve ──
    app.get("/v1/me/reservation", auth, async (c) => {
        const result = await upstream({ kind: "reservationActive", userId: userId(c) });
        if (!result.ok)
            return failUpstream(c, result.error);
        if (!isObject(result.body))
            return fail(c, 502, "upstream_error");
        if (result.body.reservation == null)
            return c.json({ reservation: null });
        const reservation = normalizeReservation(result.body.reservation);
        if (!reservation)
            return fail(c, 502, "upstream_error");
        return c.json({ reservation });
    });
    /** Every open hold of the session user, soonest to end first. */
    app.get("/v1/me/reservations", auth, async (c) => {
        const result = await upstream({ kind: "reservationActive", userId: userId(c) });
        if (!result.ok)
            return failUpstream(c, result.error);
        const reservations = normalizeReservations(result.body);
        if (!reservations)
            return fail(c, 502, "upstream_error");
        return c.json({ reservations });
    });
    /**
     * Holds a find. The product must be visible in the shopper catalogue (LIVE,
     * at a verified store) before fashbiz is asked; fashbiz then enforces
     * sold/already-reserved atomically-enough on its side.
     */
    app.post("/v1/reservations", auth, smallBody, async (c) => {
        const body = await jsonBody(c);
        if (!body || hasUnknownKeys(body, ["productId", "durationHours"]))
            return fail(c, 400, "invalid_request");
        const productId = body.productId;
        if (typeof productId !== "string" || !ID_PATTERN.test(productId))
            return fail(c, 400, "invalid_request");
        // Optional: 2 or 5 hours. Omitted keeps fashbiz's default window. Never a
        // timestamp - the expiry is always the server's.
        const durationHours = body.durationHours;
        if (durationHours !== undefined && (typeof durationHours !== "number" || !DURATIONS.has(durationHours))) {
            return fail(c, 400, "invalid_request");
        }
        const productResult = await upstream({ kind: "product", id: productId });
        if (!productResult.ok)
            return failUpstream(c, productResult.error);
        const product = normalizeProduct(productFrom(productResult.body));
        if (!product || !product.storeId || !ID_PATTERN.test(product.storeId))
            return fail(c, 404, "not_found");
        const storeResult = await upstream({ kind: "store", id: product.storeId });
        if (!storeResult.ok)
            return failUpstream(c, storeResult.error);
        const store = normalizeStore(storeResult.body);
        if (!store || !store.verified)
            return fail(c, 404, "not_found");
        if (product.status !== "LIVE") {
            return fail(c, 409, "conflict", { reason: product.status === "SOLD" ? "sold" : "already_reserved" });
        }
        const result = await upstream({
            kind: "reservationCreate",
            userId: userId(c),
            productId,
            ...(durationHours === undefined ? {} : { durationHours: durationHours }),
        });
        if (!result.ok) {
            if (result.error !== "conflict")
                return failUpstream(c, result.error);
            // A limit or cooldown is the shopper's to act on; anything else is
            // simply "that find is not available".
            const reason = result.reason === "limit_store" || result.reason === "limit_global" || result.reason === "cooldown"
                ? result.reason
                : "unavailable";
            const extra = { reason };
            if (reason === "cooldown" && result.cooldownUntil !== undefined) {
                extra.cooldownUntil = new Date(result.cooldownUntil).toISOString();
            }
            return fail(c, 409, "conflict", extra);
        }
        const reservation = normalizeReservation(result.body);
        if (!reservation)
            return fail(c, 502, "upstream_error");
        return c.json({ reservation }, 201);
    });
    /**
     * fashbiz's cancel route checks nothing about who is asking. Ownership is
     * proven here first: the reservation must be the caller's own active hold,
     * as fashbiz reports it for the session's user id. Anything else is a 404,
     * so ids belonging to other shoppers cannot be probed.
     */
    app.post("/v1/reservations/:id/cancel", auth, async (c) => {
        const id = c.req.param("id");
        if (!ID_PATTERN.test(id))
            return fail(c, 404, "not_found");
        const active = await upstream({ kind: "reservationActive", userId: userId(c) });
        if (!active.ok)
            return failUpstream(c, active.error);
        const owned = (normalizeReservations(active.body) ?? []).find((r) => r.id === id);
        if (!owned || (owned.state !== "RESERVED" && owned.state !== "CONFIRMED"))
            return fail(c, 404, "not_found");
        const result = await upstream({ kind: "reservationCancel", reservationId: id });
        if (!result.ok)
            return failUpstream(c, result.error);
        const state = isObject(result.body) ? str(result.body.state) : null;
        return c.json({ reservation: { ...owned, state: state === "CANCELLED" ? "CANCELLED" : owned.state } });
    });
    // ── Capture ──
    /** Paid AI analysis: signed-in only, per-user hourly budget, bounded photos. */
    app.post("/v1/capture/analyze", auth, captureBody, perUser(allowAnalyze), async (c) => {
        const body = await jsonBody(c);
        if (!body || hasUnknownKeys(body, ["images"]))
            return fail(c, 400, "invalid_request");
        const images = checkAnalyzeImages(body.images, config.captureMaxImageBytes);
        if (!images.ok)
            return fail(c, images.status, images.code);
        const result = await upstream({ kind: "analyze", images: images.value });
        if (!result.ok)
            return failUpstream(c, result.error);
        const analysis = normalizeAnalysis(result.body);
        if (!analysis)
            return fail(c, 502, "upstream_error");
        return c.json(analysis);
    });
    app.post("/v1/capture/products", auth, submitBody, perUser(allowSubmit), async (c) => {
        const body = await jsonBody(c);
        if (!body)
            return fail(c, 400, "invalid_request");
        const checked = checkSubmission(body);
        if (!checked.ok)
            return fail(c, checked.status, checked.code);
        if (checked.value.storeId) {
            const store = await upstream({ kind: "store", id: checked.value.storeId });
            if (!store.ok)
                return store.error === "not_found" ? fail(c, 400, "invalid_request") : failUpstream(c, store.error);
            if (!normalizeStore(store.body)?.verified)
                return fail(c, 400, "invalid_request");
        }
        const result = await upstream({ kind: "productCreate", payload: checked.value.payload });
        if (!result.ok)
            return failUpstream(c, result.error);
        const created = result.body;
        const productId = isObject(created) ? str(created.productId) : null;
        if (!productId || !ID_PATTERN.test(productId))
            return fail(c, 502, "upstream_error");
        return c.json({
            product: {
                id: productId,
                status: str(created.status),
                images: hostedImages(created.images),
                createdAt: str(created.createdAt),
            },
        }, 201);
    });
    /** Collect is a boutique action. It is deliberately not exposed to shoppers. */
}
