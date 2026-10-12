# PROJECT.md -- What Fashbiz / leStores AI Does

## Product

**leStores AI** (brand: **Ree**, domains: re-e.dk, lestores-ai.com) is a SaaS platform for secondhand and vintage fashion stores, primarily in Denmark. It automates the hardest part of resale: turning a photographed garment into a complete, sale-ready listing.

## Core flow

1. Store owner photographs a product (front, side, back, detail).
2. GPT-4o-mini analyzes the images and generates: title, brand, category, size, color, condition, description, Shopify tags.
3. Owner reviews/edits the AI output.
4. Product is created with a barcode and synced to the store's Shopify site.
5. When sold, Stripe Connect splits payment between store and consignor.

## User roles

| Role | What they do |
|------|-------------|
| **store** | Owns a secondhand shop. Adds products, manages inventory, connects Shopify/Stripe, views sales/transactions. |
| **consignor** | Brings items to a store for consignment. Views their products, gets QR code, receives split payments. |
| **brand** | Brand partner (Ree Collect). Has a brand store view and profile. |
| **admin** | Platform operator. Manages all stores/users/products, views stats, handles support tickets, manages platform fees. |
| **developer** | Internal role with admin-level access plus Shopify store management. |

## Feature inventory

### Guest / Try mode
- `/try/add-product`: demo the AI analysis without signing up.
- Guest products transfer to a real account on registration.

### Store dashboard (`/dashboard/`)
- **Add Product**: multi-step wizard (upload images -> AI analysis -> review/edit -> create with barcode -> Shopify sync).
- **Inventory** (`/dashboard/store`): list, search, filter all products.
- **Items Sold**: sales history.
- **Review Queue**: products where AI confidence < 0.6, flagged for manual review.
- **Barcode Scanner**: camera-based scanner; scanning marks a product as sold (scan-to-delist).
- **QR Code**: for consignor identification.
- **Stripe Connect**: onboarding and payment setup.
- **Subscription Plan**: choose/manage Stripe subscription tiers.
- **Transaction History**: payment records.
- **Profile**: store branding (logo, colors, social links), address with geolocation.
- **DKK Points**: optional loyalty points system per store.
- **Invite a Store**: referral program (referrer gets 1 month free when referred store subscribes).
- **Notifications**: in-app bell with sold/order/system/reservation notifications.
- **Bug Report Chat**: chatbot widget for reporting issues to admins.

### Connections (sidebar)
- **Webstore**: Shopify store connection.
- **Instagram**: post products to Instagram via Meta API (single or carousel).
- **Vinted**: placeholder/future integration.

### Consignor dashboard
- View "my products" assigned across stores.
- Browse stores (`/dashboard/storelist`).
- QR code display.

### Brand dashboard
- Ree Collect store view.
- Profile management.

### Admin panel (`/admin/`)
- **Dashboard**: platform-wide stats.
- **Stores & Users**: list, search, filter, delete, view details, CSV download. Hard delete cascades to all related collections with a full backup snapshot (`DeletedAccountBackup`) before deletion.
- **Products**: view all, review flags, sync missing Shopify products.
- **Reports**: platform analytics.
- **Platform Fees**: fee management (4% on sales).
- **Support**: ticket management with chat.
- **Settings**: site-wide config.
- **Live Activity**: active sessions.
- **Developer**: Shopify store management.
- **Add-on Purchases**: track per-product add-on purchases.

### Public API (`/api/public/`)
- Serves a separate **Discover** frontend app (different domain).
- Protected by API key (`x-api-key`) with CORS for the Discover origin.
- Endpoints: products, stores, reservations, saves, events, auth exchange (SSO).

### Discover app integration
- Product reservation flow: RESERVED -> CONFIRMED -> COLLECTED (or EXPIRED/CANCELLED).
- Saved/liked products.
- KPI event tracking (store direction clicks, reservations, saves).
- SSO bridge via one-time codes with 2-minute TTL.

### Shopify integration
- Full product lifecycle sync (create/update/delete/archive).
- Inventory management, metafields, theme branding.
- Webhooks: order fulfillment triggers in-app sold notifications and consignor emails.

### Subscription & payments
- Stripe subscriptions with multiple tiers.
- Add-on purchases: webstore (4800 DKK), plugin (3200 DKK), Instagram (10 DKK/product), complete_adds (10 DKK/product).
- Platform fee: 4% on sales.
- Stripe webhooks handle the full subscription lifecycle.

### Email notifications
- Welcome, forgot password, subscription events, product purchased, consignor updates, transfer success/failure.

### Cron jobs
- Daily subscription status check (01:00 UTC).
- Daily upload reminder notifications (08:00 UTC).

### SEO
- Structured JSON-LD: Organization, WebSite, Product, Breadcrumb.
- Per-page metadata with OG/Twitter cards.

## Business rules

- **Demo mode**: new accounts start in demo mode with a 200-product limit. Subscribing or connecting Stripe switches to live mode.
- **Unclaimed stores**: stores added via admin or CSV import get a `@ree-unclaimed.internal` email. When the real owner registers, their account is matched and claimed in place.
- **Lazy reservation expiry**: reservations are not expired by background jobs; every read path checks and expires stale records on access.
- **AI confidence threshold**: products with AI analysis confidence < 0.6 are sent to the review queue instead of auto-approved.
- **Referral reward**: when a referred store subscribes, the referrer gets 1 month free.
- **Currency**: all prices are in DKK (Danish Krone).
- **Vector search**: product similarity uses MongoDB Atlas Vector Search with OpenAI `text-embedding-3-small` (256 dimensions) to refine AI results against previously approved products.
