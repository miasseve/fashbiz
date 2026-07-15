# FASHBIZ / REE

Resale-commerce platform for secondhand & vintage stores (**re-e.dk**). Stores upload
products, our AI generates the listing details, and items are synced out to Shopify and
sold with automatic consignor split-payments.

Built with the Next.js App Router. Admins manage stores, users, products and payouts
from a dedicated `/admin` panel.

## Tech Stack

| Area | Tech |
|------|------|
| Framework | Next.js 16 (App Router, **Turbopack** build) · React 19 |
| Auth | NextAuth v5 (JWT sessions, credentials provider) · `src/proxy.js` middleware |
| Database | MongoDB + Mongoose |
| Payments | Stripe (subscriptions + Connect transfers/payouts) |
| Storefront sync | Shopify (product + collection sync) |
| Media | Cloudinary (image hosting) |
| AI | OpenAI (product analysis / listing generation) |
| Email | Nodemailer (SMTP) |
| UI | Tailwind CSS v3 · HeroUI · react-icons · react-toastify |
| Hosting | Vercel (auto-deploys from `master`) |

## Getting Started

Requires **Node 22.x** (pinned in `package.json` → `engines`).

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Scripts

| Script | Purpose |
|--------|---------|
| `npm run dev` | Dev server (Turbopack) |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run lint` | ESLint |

### Environment

Create a `.env.local` with (at minimum):

```
AUTH_SECRET=            # NextAuth JWT secret
MONGODB_URI=            # MongoDB connection string

# Stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

# Shopify
SHOPIFY_STORE_DOMAIN=
SHOPIFY_ADMIN_ACCESS_TOKEN=

# Cloudinary
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# OpenAI
OPENAI_API_KEY=

# Email (SMTP)
SMTP_HOST=
SMTP_PORT=
SMTP_SECURE=
EMAIL_USER=
EMAIL_PASS=
```

> This list is representative, not exhaustive — check the code for any additional keys.

## Project Structure

```
src/
  app/                 # App Router routes
    admin/             # Admin panel (stores, users, products, reports, fees)
    dashboard/         # Store/consignor dashboard (add-product, subscription-plan, …)
    try/               # Logged-out "try it free" guest flow
    api/               # Route handlers (incl. Stripe webhook, admin APIs)
  actions/             # Server actions (products, auth, Stripe, Shopify, …)
  components/          # Shared UI (incl. pricing/)
  models/              # Mongoose schemas
  mails/               # Nodemailer email templates
  proxy.js             # Middleware — route protection & role-based redirects
```

## Roles

`admin` · `developer` · `store` · `brand` · `consignor`. Route access and redirects are
enforced in [`src/proxy.js`](src/proxy.js). A user's `isActive` flag is set to `true` only
when a Stripe subscription is created (via the app checkout or the `customer.subscription.created`
webhook); it is not set at signup.

## Admin — Stores & Users

`/admin/stores-users` lists every store and user (admins excluded), newest first.

- **Search / filter / sort** by name, email, country, city, signup date, product count.
- **Download CSV** of the current view.
- **View** — opens the store detail page (stores only).
- **Delete** — permanently removes a store/user.

### Delete behaviour

`DELETE /api/admin/users/:userId` (admin/developer only) performs a **hard delete**:

1. Removes the user's Shopify-synced products from Shopify (best-effort — a Shopify
   outage does not block the DB deletion).
2. Cascade-deletes the user and **all associated data** across every collection that
   references them: products, accounts, active-user sessions, add-on purchases, carts,
   support tickets, Instagram logs, notifications, sessions, Shopify-store records,
   subscriptions, transactions, point rules, store referral codes, approved products,
   and referrals.
3. Deletes the user document.

Guards: an admin cannot delete their own account, and `admin`/`developer` accounts
cannot be deleted through this endpoint.

> **This is irreversible — there is no backup.** The confirmation dialog states this
> before proceeding.

## Deployment

Pushing to `master` auto-deploys to Vercel. Run `npm run build` locally before pushing
to catch build errors early.
