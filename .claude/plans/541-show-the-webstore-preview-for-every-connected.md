# Plan — #541 Show the webstore preview for every connected store

Spec: `.claude/specs/541-show-the-webstore-preview-for-every-connected.md` (Approved) · Feature · Small · **Medium risk**

## Context

On a store's dashboard product page, the right-column **Omnichannel Connections** panel always shows a "Webstore / Preview" row, but it is only a clickable link when *that one product* is already synced to Shopify (`shopifyProductUrl` present). For every un-synced product the row is a dead label, so a store can't jump to its live webstore.

Goal: make "Preview" a working link for **every connected store** — the product's own storefront page when synced (unchanged), otherwise the store's **webstore homepage** — never a dead end, never a broken/erroring link. Confirmed with the client (spec D1–D3; Q1 default accepted: base-store stores link to the shared storefront homepage).

## Changes (3 files)

### 1. `src/actions/productActions.js` — `getProductById`
After the existing `shopifyProductUrl` block, resolve the owning store's homepage for `product.userId` and add `webstoreHomeUrl` to the returned `data`:
- `resolveStoreForUser(product.userId)` → `{ source, storeDomain }` (already imported).
- Storefront domain: `source === "oauth" ? storeDomain : (process.env.SHOPIFY_STOREFRONT_DOMAIN || storeDomain)` (same pattern as productActions.js:363 / shopifyAction.js:1204).
- `buildStorefrontLink(\`https://${storefrontDomain}/\`, await getShopifyStorefrontPassword())` for the `/go` password-wall unlock (both already imported).
- Whole block in `try/catch` → `null` on any failure (never blocks the page).

### 2. `src/app/dashboard/product/[productId]/page.jsx`
Destructure `webstoreHomeUrl` from `response.data` and pass it to `<OmnichannelConnections … webstoreHomeUrl={webstoreHomeUrl} />`. Brand/collect branch unchanged.

### 3. `src/app/dashboard/product/[productId]/OmnichannelConnections.jsx`
Accept `webstoreHomeUrl`; `const webstoreLink = webstoreUrl || webstoreHomeUrl;`; use it in `linkable` and `href`. Icon, "Preview" label, green dot, external-link icon, `target="_blank"`, `rel="noopener noreferrer"`, and Vinted/Instagram rows unchanged. Top comment updated.

## Reused (no new utilities)
- `resolveStoreForUser` — `src/lib/shopifyStoreResolver.js`
- `buildStorefrontLink` + `getShopifyStorefrontPassword` — `src/lib/shopifySettings.js`
- Storefront-domain selection pattern — `SHOPIFY_STOREFRONT_DOMAIN || <domain>`

## Verification
No test framework. `npm run lint` / `npm run build` cannot run on this host (`.claude/rules/known-failures.md`) — rely on Vercel's build. Manual checks map to AC-01…AC-07 (see spec §6): synced product → product page; un-synced → homepage; password store → via `/go`; row look unchanged; new-tab + rel; no-URL → non-clickable; brand/collect → no panel.

## Out of scope
Admin connection-page fields (= shipped #538). Vinted/Instagram rows. Any sync/data changes.
