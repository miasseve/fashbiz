import { fail, failUpstream, hasUnknownKeys, jsonBody } from "./errors.js";
import { isObject, str } from "./normalize.js";
import { createRateLimiter } from "./rateLimit.js";
import { CODE_CHALLENGE_PATTERN, CODE_VERIFIER_PATTERN, pkceChallenge, } from "./session.js";
import { ID_PATTERN } from "./upstream.js";
/** fashbiz one-time codes are UUIDs today; accept any short URL-safe token. */
const SSO_CODE_PATTERN = /^[A-Za-z0-9._~-]{16,128}$/;
const CALLBACK_PATH = "/v1/auth/callback";
function clientIp(c) {
    return c.req.header("x-forwarded-for")?.split(",")[0]?.trim() || c.req.header("x-real-ip") || "unknown";
}
function noStore(c) {
    c.header("cache-control", "no-store");
    c.header("pragma", "no-cache");
}
function bearer(c) {
    const header = c.req.header("authorization") ?? "";
    const match = /^Bearer ([A-Za-z0-9._-]+)$/.exec(header.trim());
    return match?.[1] ?? null;
}
/**
 * The only way a member route learns who is calling. There is no userId
 * parameter anywhere in the mobile API: it is the verified token's subject.
 */
export function requireSession(sessions) {
    return async (c, next) => {
        noStore(c);
        if (!sessions.configured)
            return fail(c, 503, "auth_not_configured");
        const token = bearer(c);
        if (!token) {
            c.header("www-authenticate", 'Bearer realm="lestores"');
            return fail(c, 401, "unauthorized");
        }
        const check = await sessions.check(token);
        if (!check.ok) {
            const expired = check.reason === "expired";
            c.header("www-authenticate", `Bearer realm="lestores", error="invalid_token"`);
            return fail(c, 401, expired ? "session_expired" : "unauthorized");
        }
        c.set("session", check.session);
        await next();
    };
}
/** Whitelists fashbiz's exchange payload into a user, or null. */
export function userFromExchange(body) {
    if (!isObject(body))
        return null;
    const id = str(body.userId);
    const email = str(body.email);
    if (!id || !ID_PATTERN.test(id) || !email)
        return null;
    const name = [str(body.firstname), str(body.lastname)].filter(Boolean).join(" ");
    return { user: { id, name, email }, role: str(body.role) };
}
const escapeHtml = (s) => s.replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch] ?? ch);
function page(c, status, message) {
    noStore(c);
    c.header("content-security-policy", "default-src 'none'; style-src 'unsafe-inline'");
    return c.html(`<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">` +
        `<title>leStores</title><body style="font-family:system-ui;padding:32px;text-align:center">` +
        `<p>${escapeHtml(message)}</p></body>`, status);
}
export function registerAuthRoutes(app, config, sessions, upstream) {
    const allowAuth = createRateLimiter(config.authRateLimitPerMinute);
    const authLimit = async (c, next) => {
        const verdict = allowAuth(clientIp(c));
        if (!verdict.allowed) {
            c.header("retry-after", String(verdict.retryAfterSeconds));
            return fail(c, 429, "rate_limited");
        }
        await next();
    };
    const authConfigured = () => sessions.configured && !!config.publicOrigin && !!config.reeBaseUrl;
    /**
     * Starts a sign-in. The app generates a PKCE verifier, sends only its S256
     * challenge, and gets back the Ree login URL. The challenge and the chosen
     * app callback travel inside a signed, 10-minute state token embedded in
     * the callback *path* - fashbiz appends `?code=` to the redirect URI with
     * plain string concatenation, so a query string there would be corrupted.
     */
    app.post("/v1/auth/start", authLimit, async (c) => {
        noStore(c);
        if (!authConfigured())
            return fail(c, 503, "auth_not_configured");
        const body = await jsonBody(c);
        if (!body || hasUnknownKeys(body, ["codeChallenge", "codeChallengeMethod", "redirectUri"])) {
            return fail(c, 400, "invalid_request");
        }
        const { codeChallenge, codeChallengeMethod, redirectUri } = body;
        if (codeChallengeMethod !== "S256" ||
            typeof codeChallenge !== "string" ||
            !CODE_CHALLENGE_PATTERN.test(codeChallenge) ||
            typeof redirectUri !== "string" ||
            !config.appRedirectUris.includes(redirectUri)) {
            return fail(c, 400, "invalid_request");
        }
        const { state, expiresAt } = await sessions.issueState({ codeChallenge, appRedirectUri: redirectUri });
        const callbackUrl = `${config.publicOrigin}${CALLBACK_PATH}/${state}`;
        const authorizeUrl = `${config.reeBaseUrl}/discover-login?redirect_uri=${encodeURIComponent(callbackUrl)}`;
        return c.json({ authorizeUrl, callbackUrlPrefix: `${config.publicOrigin}${CALLBACK_PATH}/`, expiresAt });
    });
    /**
     * Where Ree sends the browser. On iOS/Android with a verified universal /
     * app link the OS hands this https URL straight to the app and this handler
     * never runs. When it does run, it validates the state and forwards the
     * code to the app callback chosen at start. It does NOT exchange the code:
     * that needs the PKCE verifier only the app holds.
     */
    app.get(`${CALLBACK_PATH}/:state`, async (c) => {
        const state = c.req.param("state");
        const code = c.req.query("code") ?? "";
        const checked = await sessions.checkState(state);
        if (!checked.ok || !SSO_CODE_PATTERN.test(code) || !config.appRedirectUris.includes(checked.state.appRedirectUri)) {
            return page(c, 400, "This sign-in link is invalid or has expired. Return to the leStores app and try again.");
        }
        const target = new URL(checked.state.appRedirectUri);
        target.searchParams.set("code", code);
        target.searchParams.set("state", state);
        noStore(c);
        return c.redirect(target.toString(), 302);
    });
    /**
     * Trades the one-time code for a BFF session. Requires the state minted at
     * start and the PKCE verifier behind its challenge, so a code lifted from a
     * browser history or a hijacked redirect is useless on its own.
     */
    app.post("/v1/auth/exchange", authLimit, async (c) => {
        noStore(c);
        if (!authConfigured())
            return fail(c, 503, "auth_not_configured");
        const body = await jsonBody(c);
        if (!body || hasUnknownKeys(body, ["code", "state", "codeVerifier"]))
            return fail(c, 400, "invalid_request");
        const { code, state, codeVerifier } = body;
        if (typeof code !== "string" ||
            !SSO_CODE_PATTERN.test(code) ||
            typeof state !== "string" ||
            typeof codeVerifier !== "string" ||
            !CODE_VERIFIER_PATTERN.test(codeVerifier)) {
            return fail(c, 400, "invalid_request");
        }
        const checked = await sessions.checkState(state);
        if (!checked.ok || pkceChallenge(codeVerifier) !== checked.state.codeChallenge) {
            return fail(c, 400, "invalid_grant");
        }
        const result = await upstream({ kind: "authExchange", code });
        if (!result.ok) {
            // fashbiz answers 400 for an unknown, used or expired code.
            return result.error === "bad_request" || result.error === "not_found"
                ? fail(c, 400, "invalid_grant")
                : failUpstream(c, result.error);
        }
        const identity = userFromExchange(result.body);
        if (!identity)
            return fail(c, 502, "upstream_error");
        // discover-login already refuses non-shopper accounts; checked again so a
        // store account can never hold a shopper session.
        if (identity.role !== "consignor")
            return fail(c, 403, "forbidden");
        const session = await sessions.issue(identity.user);
        return c.json({
            session: { token: session.token, tokenType: "Bearer", expiresAt: new Date(session.expiresAt).toISOString() },
            user: identity.user,
        });
    });
    app.get("/v1/me", requireSession(sessions), (c) => {
        const session = c.get("session");
        return c.json({ user: session.user, session: { expiresAt: new Date(session.expiresAt).toISOString() } });
    });
    /** Idempotent. Accepts an expired token so a stale app can always sign out. */
    app.post("/v1/auth/logout", async (c) => {
        noStore(c);
        if (!sessions.configured)
            return fail(c, 503, "auth_not_configured");
        const token = bearer(c);
        if (!token)
            return fail(c, 401, "unauthorized");
        const check = await sessions.check(token, { allowExpired: true });
        if (check.ok)
            await sessions.revoke(check.session);
        else if (check.reason === "invalid")
            return fail(c, 401, "unauthorized");
        return c.body(null, 204);
    });
}
