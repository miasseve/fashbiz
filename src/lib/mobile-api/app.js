import { Hono } from "hono";
import { cors } from "hono/cors";
import { registerAuthRoutes } from "./authRoutes.js";
import { fail, failUpstream } from "./errors.js";
import { registerMemberRoutes } from "./memberRoutes.js";
import { listFrom, normalizeProduct, normalizeStore, productFrom, } from "./normalize.js";
import { createRateLimiter } from "./rateLimit.js";
import { createMemoryRevocationStore, createSessions } from "./session.js";
import { createStorefrontSource } from "./storefronts.js";
import { createStoreHoursSource } from "./storeHours.js";
import { createUpstream, ID_PATTERN } from "./upstream.js";
/** The association document. Modern (iOS 13+) `appIDs` + `components` form; the app targets iOS 15. */
export function appleAppSiteAssociation(teamId, bundleId) {
    return {
        applinks: {
            details: [
                {
                    appIDs: [`${teamId}.${bundleId}`],
                    components: [{ "/": "/v1/auth/callback/*", comment: "Sign in with Ree callback" }],
                },
            ],
        },
    };
}
/** Catalogue visibility rule, matching the reference Discover feed and search (`status !== "SOLD"`). */
const FEED_STATUSES = new Set(["LIVE", "RESERVED"]);
/**
 * `?include=sold` also returns SOLD finds, for the flows where the reference
 * keeps them (its catalogue holds every non-archived find; SOLD ones back
 * Product Detail, Saved/Collected Finds, Store Detail and the "Collected"
 * notification, while For You, Search, recommendations and the map filter
 * them out client-side). Opt-in, so a client that does not ask - every build
 * released before this - keeps exactly the feed it had.
 */
const WITH_SOLD = new Set(["LIVE", "RESERVED", "SOLD"]);
function isLocalDevOrigin(origin) {
    try {
        const { hostname, protocol } = new URL(origin);
        return (protocol === "http:" || protocol === "https:") && (hostname === "localhost" || hostname === "127.0.0.1");
    }
    catch {
        return false;
    }
}
export function createApp(config, fetcher = fetch, options = {}) {
    const upstream = createUpstream(config, fetcher);
    const now = options.now ?? Date.now;
    const storefronts = options.storefronts ?? createStorefrontSource(config, fetcher, now);
    const storeHours = options.storeHours ?? createStoreHoursSource(config, fetcher, now);
    /**
     * Attaches the storefront photo and the reference's cached opening hours,
     * if any, to already-normalised stores. `hours` is Sunday-first, as the
     * reference's DayHours; null means "no confident real hours".
     */
    const withStorefronts = async (stores) => {
        const [photos, hours] = await Promise.all([storefronts.photos(), storeHours.hours()]);
        return stores.map((s) => ({
            ...s,
            storefront: photos[s.id] ?? null,
            hours: hours[s.id]?.hours ?? null,
            temporaryClosure: hours[s.id]?.temporaryClosure ?? null,
        }));
    };
    const sessions = createSessions(config, options.revocations ?? createMemoryRevocationStore(now), now);
    const allow = createRateLimiter(config.rateLimitPerMinute);
    const app = new Hono();
    app.onError((_err, c) => fail(c, 502, "upstream_error"));
    app.notFound((c) => fail(c, 404, "not_found"));
    app.use("*", async (c, next) => {
        await next();
        c.header("x-content-type-options", "nosniff");
        c.header("referrer-policy", "no-referrer");
    });
    app.use("/v1/*", cors({
        // Native apps send no Origin and are unaffected. Browsers get an explicit
        // allow-list; localhost is only accepted outside production.
        origin: (origin) => {
            if (!origin)
                return null;
            if (config.allowedOrigins.includes(origin))
                return origin;
            if (!config.production && isLocalDevOrigin(origin))
                return origin;
            return null;
        },
        allowMethods: ["GET", "POST", "DELETE", "OPTIONS"],
        allowHeaders: ["accept", "content-type", "authorization"],
        exposeHeaders: ["retry-after", "www-authenticate"],
        maxAge: 600,
    }));
    app.use("/v1/*", async (c, next) => {
        if (c.req.method === "OPTIONS")
            return next();
        const ip = c.req.header("x-forwarded-for")?.split(",")[0]?.trim() || c.req.header("x-real-ip") || "unknown";
        const verdict = allow(ip);
        if (!verdict.allowed) {
            c.header("retry-after", String(verdict.retryAfterSeconds));
            return fail(c, 429, "rate_limited");
        }
        await next();
    });
    app.get("/health", (c) => c.json({ ok: true }));
    /**
     * Apple app site association for universal links into the iOS app. Served
     * at the exact path Apple fetches (no `.json`, no redirect) as
     * `application/json`. Only the sign-in callback path is claimed, so every
     * other BFF URL keeps opening in the browser. 404 until APPLE_TEAM_ID is set -
     * a file naming a wrong or placeholder team would be cached by Apple's CDN.
     */
    const aasa = (c) => {
        if (!config.appleTeamId)
            return fail(c, 404, "not_found");
        c.header("cache-control", "public, max-age=3600");
        return c.json(appleAppSiteAssociation(config.appleTeamId, config.iosBundleId));
    };
    app.get("/.well-known/apple-app-site-association", aasa);
    app.get("/apple-app-site-association", aasa);
    /**
     * The consumer catalogue. fashbiz returns at most 200 products (newest first)
     * with no pagination, so this is the whole capped result — there is no
     * cursor, and `meta.paginated` says so.
     */
    app.get("/v1/products", async (c) => {
        const storeId = c.req.query("storeId");
        if (storeId !== undefined && !ID_PATTERN.test(storeId))
            return fail(c, 400, "invalid_request");
        const include = c.req.query("include");
        if (include !== undefined && include !== "sold")
            return fail(c, 400, "invalid_request");
        const visible = include === "sold" ? WITH_SOLD : FEED_STATUSES;
        const result = await upstream({ kind: "products", storeId });
        if (!result.ok)
            return failUpstream(c, result.error);
        const list = listFrom(result.body, "products");
        if (!list)
            return fail(c, 502, "upstream_error");
        const products = list
            .map(normalizeProduct)
            .filter((p) => !!p && visible.has(p.status));
        c.header("cache-control", "public, max-age=30, s-maxage=60");
        return c.json({ products, meta: { count: products.length, upstreamLimit: 200, paginated: false } });
    });
    /**
     * One find plus its boutique. SOLD finds stay reachable here (a shared link
     * should say "sold", not 404), but only when the owning store is verified —
     * fashbiz's detail route does not check that, its list route does.
     */
    app.get("/v1/products/:id", async (c) => {
        const id = c.req.param("id");
        if (!ID_PATTERN.test(id))
            return fail(c, 404, "not_found");
        const result = await upstream({ kind: "product", id });
        if (!result.ok)
            return failUpstream(c, result.error);
        const product = normalizeProduct(productFrom(result.body));
        if (!product || !product.storeId || !ID_PATTERN.test(product.storeId))
            return fail(c, 404, "not_found");
        const storeResult = await upstream({ kind: "store", id: product.storeId });
        if (!storeResult.ok)
            return failUpstream(c, storeResult.error);
        const store = normalizeStore(storeResult.body);
        if (!store || !store.verified)
            return fail(c, 404, "not_found");
        const [withPhoto] = await withStorefronts([store]);
        c.header("cache-control", "public, max-age=15, s-maxage=30");
        return c.json({ product, store: withPhoto });
    });
    /**
     * Verified boutiques only. Read-only: unlike the reference web app's
     * directory loader, this never geocodes and never PATCHes coordinates back.
     */
    app.get("/v1/stores", async (c) => {
        const result = await upstream({ kind: "stores" });
        if (!result.ok)
            return failUpstream(c, result.error);
        const list = listFrom(result.body, "stores");
        if (!list)
            return fail(c, 502, "upstream_error");
        const stores = await withStorefronts(list.map(normalizeStore).filter((s) => !!s && s.verified));
        c.header("cache-control", "public, max-age=60, s-maxage=300");
        return c.json({ stores, meta: { count: stores.length } });
    });
    app.get("/v1/stores/:id", async (c) => {
        const id = c.req.param("id");
        if (!ID_PATTERN.test(id))
            return fail(c, 404, "not_found");
        const result = await upstream({ kind: "store", id });
        if (!result.ok)
            return failUpstream(c, result.error);
        const store = normalizeStore(result.body);
        if (!store || !store.verified)
            return fail(c, 404, "not_found");
        const [withPhoto] = await withStorefronts([store]);
        c.header("cache-control", "public, max-age=60, s-maxage=300");
        return c.json({ store: withPhoto });
    });
    registerAuthRoutes(app, config, sessions, upstream);
    registerMemberRoutes(app, config, sessions, upstream);
    // Every known path answers any other method with 405, never 404.
    const KNOWN = [
        "/v1/products",
        "/v1/products/:id",
        "/v1/stores",
        "/v1/stores/:id",
        "/v1/auth/start",
        "/v1/auth/callback/:state",
        "/v1/auth/exchange",
        "/v1/auth/logout",
        "/v1/me",
        "/v1/me/saves",
        "/v1/me/saves/:productId",
        "/v1/me/reservation",
        "/v1/me/reservations",
        "/v1/reservations",
        "/v1/reservations/:id/cancel",
        "/v1/capture/analyze",
        "/v1/capture/products",
    ];
    for (const path of KNOWN)
        app.all(path, (c) => fail(c, 405, "method_not_allowed"));
    return app;
}
