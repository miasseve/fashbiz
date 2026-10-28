import { Hono } from "hono";
import { handle } from "hono/vercel";

import { createApp } from "../../../../lib/mobile-api/app.js";
import { loadConfig } from "../../../../lib/mobile-api/config.js";

// The leStores mobile API: /api/mobile/v1/* for the installed Flutter app.
//
// It is the tested lestores-api-proxy app (src/lib/mobile-api, copied from
// its compiled output), served by this deployment instead of a separate one.
// The app never holds a secret: REE_API_KEY and SESSION_SIGNING_SECRET stay in
// this server's environment, and every member route takes the user id from
// the verified session token, never from the request.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const BASE_PATH = "/api/mobile";

const httpsOrigin = (host) => (host ? `https://${host}` : "");
const bare = (url) => (url || "").trim().replace(/\/+$/, "");

function buildConfig() {
  const env = process.env;
  // The production site (Vercel system variable: the production custom
  // domain, e.g. lestores-ai.com), and this deployment's own URL.
  const production = httpsOrigin(env.VERCEL_PROJECT_PRODUCTION_URL);
  const thisDeployment =
    env.VERCEL_ENV === "production" ? production : httpsOrigin(env.VERCEL_URL);
  // Where Ree sends the login back to: this deployment, unless set.
  const origin = bare(
    env.MOBILE_API_PUBLIC_ORIGIN || env.NEXTAUTH_URL || env.AUTH_URL || thisDeployment,
  );
  const config = loadConfig({
    ...env,
    // The catalogue is read from the production site's own /api/public/*
    // routes with its own key - nothing leaves the server. Production, not a
    // preview's own URL: previews sit behind Vercel deployment protection.
    REE_API_BASE_URL: bare(env.MOBILE_API_UPSTREAM_URL || production || origin),
    BFF_PUBLIC_ORIGIN: origin,
    AUTH_APP_REDIRECT_URIS: env.MOBILE_AUTH_APP_REDIRECT_URIS || "lestores://auth/callback",
  });
  // Ree redirects the login back to /api/mobile/v1/auth/callback/<state>.
  if (config.publicOrigin) config.publicOrigin = `${config.publicOrigin}${BASE_PATH}`;
  return config;
}

const app = new Hono().route(BASE_PATH, createApp(buildConfig()));
const handler = handle(app);

export const GET = handler;
export const HEAD = handler;
export const OPTIONS = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
