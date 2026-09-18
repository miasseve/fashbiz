# mobile-api

Compiled copy of `lestores-api-proxy/src` (the tested leStores mobile API),
mounted at `/api/mobile/*` by `src/app/api/mobile/[...path]/route.js`.
Additive only: no existing route, page or middleware is changed by it.
Do not edit these files by hand: change `lestores-api-proxy`, run
`npm run build` there, and copy `dist/src/*.js` (not `server.js`) back here.

Server environment (never in the mobile app):
- `REE_API_KEY` - already set for /api/public/*; reused here.
- `SESSION_SIGNING_SECRET` - new; at least 32 random bytes; signs app sessions.
- `DISCOVER_APP_EXTRA_ORIGINS` - `https://lestores-ai.com`, so the Ree login
  may redirect to `/api/mobile/v1/auth/callback/<state>` (exact origin).
- Optional `MOBILE_API_PUBLIC_ORIGIN` - defaults to `NEXTAUTH_URL`/`AUTH_URL`,
  else Vercel's `VERCEL_PROJECT_PRODUCTION_URL` (production) / `VERCEL_URL`
  (preview).
- Optional `MOBILE_API_UPSTREAM_URL` - where `/api/public/*` is read from;
  defaults to the production site.
- Optional `MOBILE_AUTH_APP_REDIRECT_URIS` (default `lestores://auth/callback`),
  `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` for storefront photos.
