import { createHash, createHmac, randomUUID } from "node:crypto";
import { sign, verify } from "hono/jwt";
/**
 * The BFF's own mobile credentials.
 *
 * fashbiz's `/api/public/auth/exchange` returns an identity and nothing else -
 * no session, no token, no expiry. So the BFF mints its own: an HS256 JWT
 * with issuer, audience, subject (the fashbiz user id), a unique `jti`, and an
 * expiry. Member routes derive the user id from this token and nowhere else.
 *
 * Two token kinds share one configured secret but never one key: each is
 * signed with an HMAC sub-key derived for its purpose, carries its own
 * audience and `typ`, and so cannot be replayed as the other.
 */
export const SESSION_ISSUER = "lestores-api-proxy";
export const SESSION_AUDIENCE = "lestores-mobile";
const STATE_AUDIENCE = "lestores-auth-state";
/** How long a started sign-in may take, browser round-trip included. */
export const STATE_TTL_SECONDS = 10 * 60;
export function createMemoryRevocationStore(now = Date.now) {
    const revoked = new Map();
    return {
        async revoke(jti, expiresAtSeconds) {
            const t = Math.floor(now() / 1000);
            for (const [k, exp] of revoked)
                if (exp <= t)
                    revoked.delete(k);
            revoked.set(jti, expiresAtSeconds);
        },
        async isRevoked(jti) {
            return revoked.has(jti);
        },
    };
}
/** RFC 7636 S256: BASE64URL(SHA256(verifier)). */
export function pkceChallenge(verifier) {
    return createHash("sha256").update(verifier).digest("base64url");
}
export const CODE_VERIFIER_PATTERN = /^[A-Za-z0-9\-._~]{43,128}$/;
export const CODE_CHALLENGE_PATTERN = /^[A-Za-z0-9_-]{43}$/;
function subKey(secret, purpose) {
    return createHmac("sha256", secret).update(`lestores-api-proxy:${purpose}`).digest("base64url");
}
export function createSessions(config, revocations = createMemoryRevocationStore(), now = Date.now) {
    const configured = config.sessionSecret.length > 0;
    const sessionKey = configured ? subKey(config.sessionSecret, "session") : "";
    const stateKey = configured ? subKey(config.sessionSecret, "auth-state") : "";
    const nowSeconds = () => Math.floor(now() / 1000);
    /**
     * Signature, algorithm, issuer and audience are checked by hono; time claims
     * are checked here against the injected clock so expiry is testable and
     * reported distinctly from tampering.
     */
    async function decode(token, key, aud) {
        if (!configured || typeof token !== "string" || token.length > 4096)
            return null;
        try {
            return await verify(token, key, { alg: "HS256", iss: SESSION_ISSUER, aud, exp: false, nbf: false, iat: false });
        }
        catch {
            return null;
        }
    }
    return {
        configured,
        async issue(user) {
            const iat = nowSeconds();
            const exp = iat + config.sessionTtlSeconds;
            const token = await sign({
                iss: SESSION_ISSUER,
                aud: SESSION_AUDIENCE,
                sub: user.id,
                typ: "session",
                jti: randomUUID(),
                iat,
                exp,
                name: user.name,
                email: user.email,
            }, sessionKey, "HS256");
            return { token, expiresAt: exp * 1000 };
        },
        /** `allowExpired` is only for logout, which must accept a stale token. */
        async check(token, { allowExpired = false } = {}) {
            const claims = await decode(token, sessionKey, SESSION_AUDIENCE);
            if (!claims || claims.typ !== "session")
                return { ok: false, reason: "invalid" };
            const { sub, jti, exp, name, email } = claims;
            if (typeof sub !== "string" || typeof jti !== "string" || typeof exp !== "number") {
                return { ok: false, reason: "invalid" };
            }
            if (!allowExpired && exp <= nowSeconds())
                return { ok: false, reason: "expired" };
            if (await revocations.isRevoked(jti))
                return { ok: false, reason: "revoked" };
            return {
                ok: true,
                session: {
                    user: { id: sub, name: typeof name === "string" ? name : "", email: typeof email === "string" ? email : "" },
                    jti,
                    expiresAt: exp * 1000,
                },
            };
        },
        async revoke(session) {
            await revocations.revoke(session.jti, Math.floor(session.expiresAt / 1000));
        },
        async issueState(state) {
            const iat = nowSeconds();
            const exp = iat + STATE_TTL_SECONDS;
            const token = await sign({
                iss: SESSION_ISSUER,
                aud: STATE_AUDIENCE,
                typ: "auth_state",
                jti: randomUUID(),
                iat,
                exp,
                cc: state.codeChallenge,
                ru: state.appRedirectUri,
            }, stateKey, "HS256");
            return { state: token, expiresAt: exp * 1000 };
        },
        async checkState(token) {
            const claims = await decode(token, stateKey, STATE_AUDIENCE);
            if (!claims || claims.typ !== "auth_state")
                return { ok: false, reason: "invalid" };
            if (typeof claims.cc !== "string" || typeof claims.ru !== "string" || typeof claims.exp !== "number") {
                return { ok: false, reason: "invalid" };
            }
            if (claims.exp <= nowSeconds())
                return { ok: false, reason: "expired" };
            return { ok: true, state: { codeChallenge: claims.cc, appRedirectUri: claims.ru } };
        },
    };
}
