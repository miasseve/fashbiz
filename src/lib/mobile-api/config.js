export const MIN_SESSION_SECRET_LENGTH = 32;
function intFrom(raw, fallback) {
    const n = Number(raw);
    return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback;
}
function listFrom(raw) {
    return (raw ?? "")
        .split(",")
        .map((o) => o.trim())
        .filter(Boolean);
}
/** An https origin with no path, or "" when the value is not one. Plain http is allowed outside production for local work. */
function originFrom(raw, production) {
    const value = (raw ?? "").trim();
    if (!value)
        return "";
    try {
        const url = new URL(value);
        if (url.protocol !== "https:" && (production || url.protocol !== "http:"))
            return "";
        return url.origin;
    }
    catch {
        return "";
    }
}
/**
 * Missing settings are not a crash: data routes answer 503
 * `upstream_not_configured` and auth routes 503 `auth_not_configured`, so a
 * misconfigured deploy is obvious without leaking which variable is absent.
 */
export function loadConfig(env = process.env) {
    const production = env.NODE_ENV === "production";
    const secret = (env.SESSION_SIGNING_SECRET ?? "").trim();
    const publicOrigin = originFrom(env.BFF_PUBLIC_ORIGIN, production);
    return {
        reeBaseUrl: (env.REE_API_BASE_URL ?? "").trim().replace(/\/+$/, ""),
        reeApiKey: (env.REE_API_KEY ?? "").trim(),
        allowedOrigins: listFrom(env.ALLOWED_ORIGINS),
        upstreamTimeoutMs: intFrom(env.UPSTREAM_TIMEOUT_MS, 8000),
        rateLimitPerMinute: intFrom(env.RATE_LIMIT_PER_MINUTE, 120),
        production,
        sessionSecret: secret.length >= MIN_SESSION_SECRET_LENGTH ? secret : "",
        sessionTtlSeconds: intFrom(env.SESSION_TTL_SECONDS, 7 * 24 * 60 * 60),
        publicOrigin,
        appRedirectUris: listFrom(env.AUTH_APP_REDIRECT_URIS).filter(
        // The callback route must never redirect to itself.
        (uri) => !(publicOrigin && uri.startsWith(`${publicOrigin}/v1/auth/callback`))),
        authRateLimitPerMinute: intFrom(env.AUTH_RATE_LIMIT_PER_MINUTE, 20),
        captureRateLimitPerHour: intFrom(env.CAPTURE_RATE_LIMIT_PER_HOUR, 20),
        captureTimeoutMs: intFrom(env.CAPTURE_TIMEOUT_MS, 55_000),
        captureMaxImageBytes: intFrom(env.CAPTURE_MAX_IMAGE_BYTES, 1_000_000),
        captureMaxBodyBytes: intFrom(env.CAPTURE_MAX_BODY_BYTES, 4_000_000),
        appleTeamId: /^[A-Z0-9]{10}$/.test((env.APPLE_TEAM_ID ?? "").trim()) ? (env.APPLE_TEAM_ID ?? "").trim() : "",
        iosBundleId: /^[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)+$/.test((env.IOS_BUNDLE_ID ?? "").trim())
            ? (env.IOS_BUNDLE_ID ?? "").trim()
            : "com.lestores.app",
        // https only, even locally: it carries a service-role key.
        supabaseUrl: /^https:\/\/[A-Za-z0-9.-]+$/.test((env.SUPABASE_URL ?? "").trim().replace(/\/+$/, ""))
            ? (env.SUPABASE_URL ?? "").trim().replace(/\/+$/, "")
            : "",
        supabaseServiceRoleKey: (env.SUPABASE_SERVICE_ROLE_KEY ?? "").trim(),
    };
}
