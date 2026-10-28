const CACHE_MS = 10 * 60 * 1000;
const STORE_ID = /^[A-Za-z0-9_-]{1,64}$/;
const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;
const DATE = /^\d{4}-\d{2}-\d{2}/;
function headersFor(key) {
    const headers = { apikey: key };
    if (!key.startsWith("sb_publishable_") && !key.startsWith("sb_secret_")) {
        headers.authorization = `Bearer ${key}`;
    }
    return headers;
}
/** A 7-day, Sunday-first week of valid `HH:MM` ranges, or null. */
export function normalizeWeek(raw) {
    if (!Array.isArray(raw) || raw.length !== 7)
        return null;
    const week = [];
    let any = false;
    for (const day of raw) {
        if (day === null) {
            week.push(null);
            continue;
        }
        if (typeof day !== "object")
            return null;
        const { open, close } = day;
        if (typeof open !== "string" || typeof close !== "string")
            return null;
        if (!HHMM.test(open) || !HHMM.test(close) || close <= open)
            return null;
        week.push({ open, close });
        any = true;
    }
    return any ? week : null;
}
function normalizeClosure(raw) {
    if (typeof raw !== "object" || raw === null)
        return null;
    const { from, until, reason } = raw;
    if (typeof from !== "string" || !DATE.test(from))
        return null;
    return {
        from: from.slice(0, 10),
        until: typeof until === "string" && DATE.test(until) ? until.slice(0, 10) : null,
        reason: typeof reason === "string" ? reason.slice(0, 200) : null,
    };
}
export function createStoreHoursSource(config, fetcher = fetch, now = Date.now) {
    const base = config.supabaseUrl;
    const key = config.supabaseServiceRoleKey;
    let cached = null;
    let inflight = null;
    async function load() {
        const res = await fetcher(`${base}/rest/v1/store_hours?select=store_id,hours,temporary_closure`, {
            headers: { ...headersFor(key), accept: "application/json" },
            redirect: "error",
            signal: AbortSignal.timeout(config.upstreamTimeoutMs),
        });
        if (!res.ok)
            throw new Error(`store_hours ${res.status}`);
        const rows = (await res.json());
        if (!Array.isArray(rows))
            throw new Error("store_hours shape");
        const out = {};
        for (const row of rows) {
            if (typeof row !== "object" || row === null)
                continue;
            const r = row;
            if (typeof r.store_id !== "string" || !STORE_ID.test(r.store_id))
                continue;
            const hours = normalizeWeek(r.hours);
            const temporaryClosure = normalizeClosure(r.temporary_closure);
            // Reference `fromRow`: no hours and no closure = fallback (no entry).
            if (!hours && !temporaryClosure)
                continue;
            out[r.store_id] = { hours, temporaryClosure };
        }
        return out;
    }
    return {
        async hours() {
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
    };
}
