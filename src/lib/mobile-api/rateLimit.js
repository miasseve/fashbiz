/**
 * Fixed-window, in-memory rate limit keyed by client IP. Deliberately small:
 * on serverless it is per instance, which still blunts a single noisy client
 * scraping the catalogue through us. Put a platform/WAF limit in front for
 * anything stronger.
 */
export function createRateLimiter(limitPerMinute, now = Date.now, windowMs = 60_000) {
    const windows = new Map();
    const WINDOW_MS = windowMs;
    return function allow(key) {
        const t = now();
        // Opportunistic cleanup so the map cannot grow without bound.
        if (windows.size > 10_000) {
            for (const [k, w] of windows)
                if (t - w.start >= WINDOW_MS)
                    windows.delete(k);
        }
        const w = windows.get(key);
        if (!w || t - w.start >= WINDOW_MS) {
            windows.set(key, { start: t, count: 1 });
            return { allowed: true, retryAfterSeconds: 0 };
        }
        w.count += 1;
        if (w.count > limitPerMinute) {
            return { allowed: false, retryAfterSeconds: Math.ceil((w.start + WINDOW_MS - t) / 1000) };
        }
        return { allowed: true, retryAfterSeconds: 0 };
    };
}
