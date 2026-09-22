/** Conflict reasons fashbiz may give, passed through as a closed set only. */
export const CONFLICT_REASONS = new Set(["sold", "already_reserved", "limit_store", "limit_global", "cooldown"]);
/** Ids are Mongo ObjectIds upstream; anything else never leaves the BFF. */
export const ID_PATTERN = /^[a-f0-9]{24}$/i;
export function upstreamRequest(route) {
    const q = encodeURIComponent;
    switch (route.kind) {
        case "products":
            return { method: "GET", path: `/api/public/products${route.storeId ? `?storeId=${q(route.storeId)}` : ""}` };
        case "product":
            return { method: "GET", path: `/api/public/products/${q(route.id)}` };
        case "stores":
            return { method: "GET", path: "/api/public/stores" };
        case "store":
            return { method: "GET", path: `/api/public/stores/${q(route.id)}` };
        case "authExchange":
            return { method: "POST", path: "/api/public/auth/exchange", body: { code: route.code } };
        case "savesList":
            return { method: "GET", path: `/api/public/saves?userId=${q(route.userId)}` };
        case "saveAdd":
            return { method: "POST", path: "/api/public/saves", body: { userId: route.userId, productId: route.productId } };
        case "saveRemove":
            return { method: "DELETE", path: "/api/public/saves", body: { userId: route.userId, productId: route.productId } };
        case "reservationActive":
            return { method: "GET", path: `/api/public/reservations?userId=${q(route.userId)}` };
        case "reservationCreate":
            // No storeId: fashbiz derives it from the product, so a client cannot
            // point the store-side notification at an arbitrary boutique.
            return {
                method: "POST",
                path: "/api/public/reservations",
                body: {
                    productId: route.productId,
                    userId: route.userId,
                    ...(route.durationHours === undefined ? {} : { durationHours: route.durationHours }),
                },
            };
        case "reservationCancel":
            return { method: "POST", path: `/api/public/reservations/${q(route.reservationId)}/cancel` };
        case "analyze":
            return { method: "POST", path: "/api/public/analyze-product", body: { images: route.images }, slow: true };
        case "productCreate":
            return { method: "POST", path: "/api/public/products", body: route.payload, slow: true };
    }
}
/** Path only, kept for the read routes' diagnostics and tests. */
export function upstreamPath(route) {
    return upstreamRequest(route).path;
}
/**
 * Operator diagnostics: which route failed and why (e.g. "unauthorized" means
 * the configured key is wrong). Never includes the key, headers, bodies or
 * user ids. Silent under the test runner.
 */
const defaultLog = (message) => {
    if (!process.env.VITEST)
        console.warn(message);
};
const EXPECTED_ERRORS = new Set(["not_found", "bad_request", "conflict"]);
export function createUpstream(config, fetcher = fetch, log = defaultLog) {
    const call = async (route) => {
        const result = await request(route);
        if (!result.ok && !EXPECTED_ERRORS.has(result.error)) {
            log(`[upstream] ${route.kind} failed: ${result.error}`);
        }
        return result;
    };
    async function request(route) {
        if (!config.reeBaseUrl || !config.reeApiKey) {
            return { ok: false, error: "not_configured" };
        }
        const req = upstreamRequest(route);
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), req.slow ? config.captureTimeoutMs : config.upstreamTimeoutMs);
        const headers = { "x-api-key": config.reeApiKey, accept: "application/json" };
        if (req.body !== undefined)
            headers["content-type"] = "application/json";
        try {
            const res = await fetcher(`${config.reeBaseUrl}${req.path}`, {
                method: req.method,
                headers,
                body: req.body === undefined ? undefined : JSON.stringify(req.body),
                signal: controller.signal,
                redirect: "error",
            });
            if (res.status === 401 || res.status === 403)
                return { ok: false, error: "unauthorized" };
            if (res.status === 404)
                return { ok: false, error: "not_found" };
            if (res.status === 400)
                return { ok: false, error: "bad_request" };
            if (res.status === 409) {
                // Only a known reason word is kept - never the upstream message.
                let reason;
                let cooldownUntil;
                try {
                    const body = (await res.json());
                    if (typeof body?.reason === "string" && CONFLICT_REASONS.has(body.reason))
                        reason = body.reason;
                    if (typeof body?.cooldownUntil === "number" && Number.isFinite(body.cooldownUntil))
                        cooldownUntil = body.cooldownUntil;
                }
                catch {
                    /* no body */
                }
                return {
                    ok: false,
                    error: "conflict",
                    ...(reason ? { reason } : {}),
                    ...(cooldownUntil === undefined ? {} : { cooldownUntil }),
                };
            }
            if (!res.ok)
                return { ok: false, error: "server_error" };
            try {
                return { ok: true, status: res.status, body: await res.json() };
            }
            catch {
                return { ok: false, error: "bad_response" };
            }
        }
        catch (err) {
            if (controller.signal.aborted)
                return { ok: false, error: "timeout" };
            void err;
            return { ok: false, error: "network" };
        }
        finally {
            clearTimeout(timer);
        }
    }
    return call;
}
