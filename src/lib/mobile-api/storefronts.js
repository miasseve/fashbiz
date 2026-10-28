/** Signed links stay valid for a week, as in the reference. */
const SIGNED_URL_SECONDS = 7 * 24 * 60 * 60;
/** Re-sign well inside that window; also caps how stale a new photo can be. */
const CACHE_MS = 10 * 60 * 1000;
const BUCKET = "storefronts";
const STORE_ID = /^[A-Za-z0-9_-]{1,64}$/;
/** New Supabase keys are opaque (`sb_secret_…`) and must not be sent as a bearer JWT. */
function headersFor(key) {
    const headers = { apikey: key };
    if (!key.startsWith("sb_publishable_") && !key.startsWith("sb_secret_")) {
        headers.authorization = `Bearer ${key}`;
    }
    return headers;
}
export function createStorefrontSource(config, fetcher = fetch, now = Date.now) {
    const base = config.supabaseUrl;
    const key = config.supabaseServiceRoleKey;
    let cached = null;
    let inflight = null;
    async function load() {
        const signal = AbortSignal.timeout(config.upstreamTimeoutMs);
        const rows = await fetcher(`${base}/rest/v1/store_photos?select=store_id,storefront_path`, {
            headers: { ...headersFor(key), accept: "application/json" },
            redirect: "error",
            signal,
        });
        if (!rows.ok)
            throw new Error(`store_photos ${rows.status}`);
        const list = (await rows.json());
        if (!Array.isArray(list))
            throw new Error("store_photos shape");
        const byPath = new Map();
        for (const row of list) {
            if (typeof row !== "object" || row === null)
                continue;
            const storeId = row.store_id;
            const path = row.storefront_path;
            if (typeof storeId !== "string" || !STORE_ID.test(storeId))
                continue;
            if (typeof path !== "string" || !path || path.includes(".."))
                continue;
            byPath.set(path, storeId);
        }
        if (byPath.size === 0)
            return {};
        const signed = await fetcher(`${base}/storage/v1/object/sign/${BUCKET}`, {
            method: "POST",
            headers: { ...headersFor(key), "content-type": "application/json", accept: "application/json" },
            body: JSON.stringify({ expiresIn: SIGNED_URL_SECONDS, paths: [...byPath.keys()] }),
            redirect: "error",
            signal: AbortSignal.timeout(config.upstreamTimeoutMs),
        });
        if (!signed.ok)
            throw new Error(`storefront sign ${signed.status}`);
        const links = (await signed.json());
        if (!Array.isArray(links))
            throw new Error("storefront sign shape");
        const out = {};
        for (const link of links) {
            if (typeof link !== "object" || link === null)
                continue;
            const { path, signedURL, error } = link;
            if (error || typeof path !== "string" || typeof signedURL !== "string")
                continue;
            const storeId = byPath.get(path);
            if (!storeId)
                continue;
            // Storage answers a path relative to /storage/v1.
            const absolute = signedURL.startsWith("https://") ? signedURL : `${base}/storage/v1${signedURL}`;
            try {
                if (new URL(absolute).protocol === "https:")
                    out[storeId] = absolute;
            }
            catch {
                /* drop a malformed link rather than serve it */
            }
        }
        return out;
    }
    return {
        async photos() {
            if (!base || !key)
                return {};
            if (cached && now() - cached.at < CACHE_MS)
                return cached.value;
            inflight ??= load()
                .then((value) => {
                cached = { at: now(), value };
                return value;
            })
                .catch(() => cached?.value ?? {})
                .finally(() => {
                inflight = null;
            });
            return inflight;
        },
        async upload(storeId, imageBuffer, contentType) {
            if (!base || !key)
                throw new Error("supabase_not_configured");
            const path = `${storeId}/storefront`;
            const signal = AbortSignal.timeout(config.upstreamTimeoutMs);
            const uploadRes = await fetcher(`${base}/storage/v1/object/${BUCKET}/${path}`, {
                method: "POST",
                headers: { ...headersFor(key), "content-type": contentType, "x-upsert": "true" },
                body: imageBuffer,
                redirect: "error",
                signal,
            });
            if (!uploadRes.ok)
                throw new Error(`storefront upload ${uploadRes.status}`);
            const upsertRes = await fetcher(`${base}/rest/v1/store_photos`, {
                method: "POST",
                headers: {
                    ...headersFor(key),
                    "content-type": "application/json",
                    accept: "application/json",
                    prefer: "resolution=merge-duplicates",
                },
                body: JSON.stringify({ store_id: storeId, storefront_path: path }),
                redirect: "error",
                signal: AbortSignal.timeout(config.upstreamTimeoutMs),
            });
            if (!upsertRes.ok)
                throw new Error(`store_photos upsert ${upsertRes.status}`);
            cached = null;
            const signRes = await fetcher(`${base}/storage/v1/object/sign/${BUCKET}`, {
                method: "POST",
                headers: { ...headersFor(key), "content-type": "application/json", accept: "application/json" },
                body: JSON.stringify({ expiresIn: SIGNED_URL_SECONDS, paths: [path] }),
                redirect: "error",
                signal: AbortSignal.timeout(config.upstreamTimeoutMs),
            });
            if (!signRes.ok)
                throw new Error(`storefront sign ${signRes.status}`);
            const links = (await signRes.json());
            const link = Array.isArray(links) ? links[0] : null;
            const signedURL = typeof link?.signedURL === "string" ? link.signedURL : null;
            if (!signedURL)
                throw new Error("storefront sign empty");
            return signedURL.startsWith("https://") ? signedURL : `${base}/storage/v1${signedURL}`;
        },
    };
}
