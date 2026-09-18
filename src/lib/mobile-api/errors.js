const MESSAGES = {
    not_found: "Not found.",
    invalid_request: "Invalid request.",
    rate_limited: "Too many requests. Try again shortly.",
    method_not_allowed: "Method not allowed.",
    payload_too_large: "The request is too large.",
    unauthorized: "Sign in to continue.",
    session_expired: "Your session has expired. Sign in again.",
    forbidden: "This account cannot use the shopper app.",
    invalid_grant: "The sign-in link is invalid or has expired.",
    conflict: "That action conflicts with the current state.",
    auth_not_configured: "Sign-in is not configured.",
    upstream_not_configured: "The catalogue service is not configured.",
    upstream_timeout: "The catalogue service took too long to respond.",
    upstream_unavailable: "The catalogue service is unavailable.",
    upstream_error: "The catalogue service returned an unexpected response.",
};
export function fail(c, status, code, extra) {
    return c.json({ error: { code, message: MESSAGES[code], ...extra } }, status);
}
/**
 * Upstream failures are translated, never forwarded: a fashbiz 401 means *our*
 * key is wrong, which is a server problem, not the caller's, and must not be
 * echoed as an auth challenge. Upstream error bodies are never passed through.
 */
export function failUpstream(c, error) {
    switch (error) {
        case "not_found":
            return fail(c, 404, "not_found");
        case "bad_request":
            return fail(c, 400, "invalid_request");
        case "conflict":
            return fail(c, 409, "conflict");
        case "not_configured":
            return fail(c, 503, "upstream_not_configured");
        case "timeout":
            return fail(c, 504, "upstream_timeout");
        case "network":
        case "unauthorized":
            return fail(c, 502, "upstream_unavailable");
        case "bad_response":
        case "server_error":
            return fail(c, 502, "upstream_error");
    }
}
/** Reads a JSON object body, or null when it is absent, malformed or not an object. */
export async function jsonBody(c) {
    if (!(c.req.header("content-type") ?? "").toLowerCase().includes("application/json"))
        return null;
    try {
        const body = await c.req.json();
        return typeof body === "object" && body !== null && !Array.isArray(body) ? body : null;
    }
    catch {
        return null;
    }
}
/** True when the object has keys outside `allowed` - used to refuse, not ignore, a smuggled `userId`. */
export function hasUnknownKeys(body, allowed) {
    return Object.keys(body).some((k) => !allowed.includes(k));
}
