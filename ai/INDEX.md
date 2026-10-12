# INDEX.md -- File Map

## Root config

| File | Purpose |
|------|---------|
| `package.json` | Dependencies, scripts (`dev`, `build`, `start`, `lint`), Node 22.x |
| `next.config.mjs` | Cloudinary images, Turbopack, CORS for Discover app, onnxruntime alias |
| `tailwind.config.js` | Active Tailwind config (CJS), HeroUI plugin, dark mode |
| `tailwind.config.mjs` | Duplicate ESM Tailwind config with custom float animation |
| `postcss.config.js` | tailwindcss + autoprefixer |
| `eslint.config.mjs` | ESLint 9 flat config, next/core-web-vitals, Babel parser |
| `jsconfig.json` | `@/*` -> `./src/*` path alias |
| `vercel.json` | API 60s timeout, 2 cron jobs |
| `DESIGN.md` | Design tokens for the pricing page |
| `.env.example` | All env vars with descriptions |

## `scripts/`

| File | Purpose |
|------|---------|
| `backfill-shopify-ids.js` | Backfill Shopify IDs on existing products |
| `make-favicon.mjs` | Generate favicon |
| `register-shopify-webhook.js` | Register Shopify webhooks |

## `src/` -- Application root

### Entry points

| File | Purpose |
|------|---------|
| `proxy.js` | Next.js middleware: auth guard, role-based route protection |
| `auth.js` | NextAuth config: JWT callbacks, session enrichment |
| `auth.config.js` | Credentials provider: email/password + bcrypt |
| `store.js` | Redux store: product + cart slices, redux-persist |

### `src/app/` -- Pages & routes

#### Root

| File | Purpose |
|------|---------|
| `layout.js` | Root layout: fonts (Montserrat, Playfair, Lato, etc.), Providers, ToastContainer, JSON-LD |
| `page.jsx` | Homepage: redirects to `/try/add-product` |
| `globals.css` | Global styles, Tailwind directives, custom classes |

#### `(auth)/` -- Authentication pages

| File | Purpose |
|------|---------|
| `login/page.jsx` | Login form |
| `register/page.jsx` | Registration form |
| `forgot-password/page.jsx` | Forgot password flow |
| `reset-password/page.jsx` | Password reset form |
| `discover-login/page.jsx` | SSO flow for Discover app |

#### `try/` -- Guest demo (no auth)

| File | Purpose |
|------|---------|
| `layout.jsx` | Locked sidebar, Sign Up CTA |
| `add-product/page.jsx` | AI product analysis demo entry |
| `add-product/TryMain.jsx` | Demo: image upload step |
| `add-product/TrySecondStep.jsx` | Demo: AI results review |
| `subscription-plan/page.jsx` | Plan preview for guests |

#### `dashboard/` -- Authenticated dashboard

| File | Purpose |
|------|---------|
| `layout.jsx` | Sidebar + header with logout, notification bell, chatbot |
| `sidebar.jsx` | Navigation, barcode scanner, connections, role-aware items |
| `add-product/page.jsx` | Product creation wizard |
| `store/page.jsx` | Inventory management |
| `product/[productId]/page.jsx` | Single product view/edit |
| `my-products/page.jsx` | Consignor's products |
| `items-sold/page.jsx` | Sales history |
| `review-queue/page.jsx` | AI-flagged low-confidence products |
| `profile/page.jsx` | Store branding, address, social links |
| `subscription/page.jsx` | Current subscription info |
| `subscription/success/page.jsx` | Post-subscription success page |
| `subscription-plan/page.jsx` | Choose/change plan |
| `stripe-connect/page.jsx` | Stripe Connect onboarding |
| `onboarding/success/page.jsx` | Stripe onboarding success |
| `onboarding/success/[accountId]/page.jsx` | Stripe onboarding success (specific account) |
| `payment-history/page.jsx` | Transaction history |
| `qr/page.jsx` | QR code display |
| `dkk-points/page.jsx` | Loyalty points rules |
| `ree-collect/page.jsx` | Brand store view |
| `invite-store/page.jsx` | Referral program |
| `storelist/page.jsx` | Consignor: browse stores |
| `notifications/page.jsx` | Notification list |

#### `admin/` -- Admin panel

| File | Purpose |
|------|---------|
| `layout.jsx` | Admin sidebar + header |
| `page.jsx` | Admin dashboard with stats |
| `stores-users/page.jsx` | Manage stores and users |
| `stores-users/deleted/page.jsx` | Deleted accounts |
| `store-details/[userId]/page.jsx` | Store detail view |
| `products/page.jsx` | All products view |
| `products/[productId]/page.jsx` | Admin product detail |
| `reports/page.jsx` | Platform analytics |
| `platform-fees/page.jsx` | Fee management |
| `support/page.jsx` | Support tickets |
| `settings/page.jsx` | Site-wide settings |
| `live-activity/page.jsx` | Active sessions |
| `developer/page.jsx` | Shopify store management |
| `addon-purchases/page.jsx` | Add-on purchase tracking |

#### `api/` -- API route handlers

| Route | Purpose |
|-------|---------|
| `auth/[...nextauth]/route.js` | NextAuth API route |
| `webhook/route.js` | Stripe webhook (subscription lifecycle, payments, transfers) |
| `shopify/webhook/route.js` | Shopify webhook (order fulfillment) |
| `check-subscription/route.js` | Cron: daily subscription check |
| `cron/daily-reminder/route.js` | Cron: daily upload reminders |
| `ai/analyze-product/route.js` | AI product analysis endpoint |
| `ai/approve-product/route.js` | Approve AI-analyzed product |
| `ai/review-queue/route.js` | Review queue operations |
| `ai/suggest-price/route.js` | AI price suggestion |
| `admin/` | ~25 admin API routes (dashboard, stores, users, products, support, stats, etc.) |
| `stripe/` | Stripe APIs (plans, subscription, addon-checkout, payment-methods, create-checkout-session) |
| `public/` | External API for Discover app (products, stores, reservations, saves, events, auth exchange) |
| `shopify/sync-metafields/` | Shopify metafield sync |

#### Other pages

| File | Purpose |
|------|---------|
| `cart/page.jsx` | Shopping cart |
| `checkout/page.jsx` | Checkout flow |
| `checkout/addon/page.jsx` | Add-on checkout |
| `product/[productId]/page.jsx` | Public product page |
| `contact-support/page.jsx` | Support contact form |
| `privacy-policy/page.jsx` | Privacy policy |
| `data-deletion/page.jsx` | Data deletion request |
| `thankyou/page.jsx` | Post-purchase thank you |
| `go/page.jsx` | Shopify password bypass redirect |

### `src/actions/` -- Server Actions

| File | Purpose |
|------|---------|
| `authActions.js` | Register, login, logout, profile CRUD, password reset, email |
| `productActions.js` | Create/update/delete product, Shopify sync, Instagram post |
| `shopifyAction.js` | Shopify CRUD (create/update/delete/archive products) |
| `shopifyThemeActions.js` | Apply store branding to Shopify theme |
| `shopifyWebhookActions.js` | Register Shopify webhooks |
| `accountAction.js` | Stripe Connect account management |
| `brandingActions.js` | Store branding (logo, colors, social links) |
| `cloudinaryActions.js` | Image upload/delete via Cloudinary |
| `dkkPointsRules.js` | DKK points CRUD |
| `encryption.js` | AES encryption for secrets |
| `getClientIp.js` | Client IP extraction |
| `notificationActions.js` | Notification operations |
| `siteSettingsActions.js` | Site settings management |
| `stripePlans.js` | Fetch Stripe plans |
| `transactionActions.js` | Transaction operations |
| `validations.js` | Yup schemas: register, login, profile, product, resetPassword |

### `src/components/` -- Shared components

| File | Purpose |
|------|---------|
| `Providers.jsx` | HeroUI + Redux + PersistGate provider wrapper |
| `ChatBot.jsx` | Bug report chat widget |
| `NotificationBell.jsx` | In-app notification dropdown |
| `LogoutButton.jsx` | Logout button |
| `BarcodeScannerModal.jsx` | Camera-based barcode scanning modal |
| `seo/JsonLd.jsx` | JSON-LD components (Organization, WebSite, Product, Breadcrumb) |
| `pricing/PricingSections.jsx` | Pricing page section layout |
| `pricing/PricingCard.jsx` | Individual pricing card |
| `pricing/PricingCardRight.jsx` | Right-side pricing card variant |
| `pricing/PricingStack.jsx` | Stacked pricing display |
| `pricing/pricingConstants.js` | Plan data definitions |
| `pricing/pricingStyles.js` | Legacy pricing styles |
| `pricing/pricingV2Styles.js` | Current pricing CSS (token-based, aligned with DESIGN.md) |

### `src/models/` -- Mongoose schemas

| Model | Purpose |
|-------|---------|
| `User.js` | Users with roles (admin/brand/consignor/store/developer), branding, geo, points_mode |
| `Product.js` | Products: SKU, title, brand, category, size, color, price, images, barcode, condition, AI fields |
| `Account.js` | Stripe Connect accounts, demo mode, demoProductLimit |
| `Subscription.js` | Stripe subscription tracking |
| `SubscriptionPlanDetails.js` | Plan metadata (productLimit, modules, tagline) |
| `UserSubscription.js` | Legacy subscription model (Basic/Pro/Business) |
| `AddOnPurchase.js` | Per-product add-on purchases |
| `ApprovedProduct.js` | AI-approved products with corrections and embeddings for vector search |
| `Cart.js` | Shopping cart |
| `Transaction.js` | Sales records with channel (shopify/ree), platform fees |
| `Reservation.js` | Product holds: RESERVED/CONFIRMED/COLLECTED/EXPIRED/CANCELLED |
| `SavedProduct.js` | Discover user likes/saves |
| `Notification.js` | Notifications: sold/order/system/reminder/reservation |
| `Referral.js` | User referral tracking |
| `StoreReferralCode.js` | Store referral codes |
| `ShopifyStore.js` | Multi-store Shopify connections (encrypted tokens) |
| `InstagramPostLogs.js` | Instagram post tracking |
| `Activeuser.js` | Active sessions with 24h TTL |
| `DeletedAccountBackup.js` | Full snapshot before admin hard-delete (restorable) |
| `SsoCode.js` | One-time SSO codes for Discover (2min TTL) |
| `KpiEvent.js` | Discover analytics events |
| `CronLogs.js` | Cron job execution logs |
| `FabricOption.js` | Admin-managed fabric vocabulary |
| `PointRule.js` | DKK points rules by category/brand type |
| `ContactSupport.js` | Support tickets with chat |
| `SiteSetting.js` | Key/value config store (encrypted) |
| `Session.js` | Auth sessions |

### `src/lib/` -- Service modules

| File | Purpose |
|------|---------|
| `db.js` | Mongoose connection singleton (cached globally) |
| `stripe.js` | Stripe client initialization |
| `cloudinary.js` | Cloudinary config |
| `aiProductAnalysis.js` | Core AI pipeline: GPT-4o-mini vision -> similarity refinement -> normalization |
| `embeddings.js` | OpenAI embeddings + MongoDB Atlas Vector Search |
| `normalize.js` | Product response normalization (sizes, categories, brands, colors, fabrics, condition) |
| `taxonomy.js` | Product taxonomy: 12 categories, subcategories, fabrics, colors, sizes, known brands |
| `subscriptionService.js` | Stripe subscription CRUD, referral reward logic |
| `addOnConfig.js` | Add-on pricing configuration |
| `shopifySettings.js` | Shopify storefront password management |
| `storeMatching.js` | Duplicate store detection, unclaimed email system |
| `apiKeyMiddleware.js` | API key auth for `/api/public/*` |
| `discoverRedirect.js` | SSO code minting, redirect validation |
| `reservationLib.js` | Reservation CRUD with lazy expiry |
| `publicProductSerializer.js` | Product -> Discover API shape |
| `publicStoreSerializer.js` | Store -> Discover API shape |
| `seo.js` | SEO defaults, metadata helpers, buildProductMetadata |
| `constants.js` | Image filter names |

### `src/features/` -- Redux slices

| File | Purpose |
|------|---------|
| `productSlice.js` | Upload images state, wizard step tracking, consignor selection |
| `cartSlice.js` | Cart items, total, add/remove/update operations |

### `src/mails/` -- Email templates

| File | Purpose |
|------|---------|
| `forgotPassword.js` | Password reset email |
| `emailSubscription.js` | Subscription activated/cancelled/changed |
| `ProductPurchased.js` | Product purchase notification |
| `ConsignorUpdate.js` | Consignor status updates |
| `TransferCreated.js` | Payment transfer created |
| `TransferSuccess.js` | Payment transfer succeeded |
| `TransferFailed.js` | Payment transfer failed |
