# FASHBIZ / REE

## Overview

Resale-commerce platform for secondhand & vintage stores (re-e.dk). Stores upload
products, AI generates the listing details, and items are synced out to Shopify and
sold with automatic consignor split-payments. Built with the Next.js App Router.
Admins manage stores, users, products and payouts from `/admin`. Stores and consignors
use `/dashboard`. Deployed on Vercel (auto-deploys from `master`).

## Stack

| Area | Tech |
|------|------|
| Framework | Next.js 16 (App Router, Turbopack) · React 19 |
| Language | JavaScript (no TypeScript) |
| Auth | NextAuth v5 beta (JWT sessions, credentials provider) · `src/proxy.js` middleware |
| Database | MongoDB + Mongoose 8.x |
| Payments | Stripe (subscriptions + Connect transfers/payouts) |
| Storefront sync | Shopify (product + collection sync) |
| Media | Cloudinary (image hosting) |
| AI | OpenAI (product analysis / listing generation) |
| Email | Nodemailer (SMTP) |
| UI | Tailwind CSS v3 · HeroUI · Framer Motion · Lucide · react-icons |
| State | Redux Toolkit + Redux Persist |
| Hosting | Vercel (auto-deploy from `master`) |
| Node | 22.x |

## Commands

| Command | Purpose |
|---------|---------|
| `npm run dev` | Dev server (Turbopack) |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run lint` | ESLint |
| `NODE_OPTIONS="--max-old-space-size=8192" npm run build` | Production build with increased memory |

## File Index

```
src/
  app/                  App Router routes
    (auth)/             Auth pages (discover-login SSO)
    admin/              Admin panel (stores, users, products, reports, fees)
    api/                Route handlers (public/, mobile/, cron/, stripe, shopify...)
    cart/               Shopping cart
    checkout/           Checkout flow
    dashboard/          Store/consignor dashboard (add-product, subscription-plan, ...)
    try/                Guest "try it free" flow
  actions/              Server actions (products, auth, Stripe, Shopify, ...)
  components/           Shared UI (pricing/, seo/)
  features/             Redux slices (cart, product)
  lib/                  Utilities (AI analysis, DB, Cloudinary, subscriptions, SEO, ...)
  models/               Mongoose schemas (User, Product, Reservation, Notification, ...)
  mails/                Email templates
  auth.js               NextAuth configuration
  auth.config.js        Auth providers config
  proxy.js              Middleware — route protection & role-based redirects
  store.js              Redux store setup
scripts/                One-off scripts (Shopify backfill, favicon, webhooks)
docs/                   Documentation (API contracts)
DESIGN.md               Pricing page design system
```

## Rules

No rule files exist yet. Template skeletons for standard topics are available in
`.claude/templates/rules/`. To activate one, copy it to `.claude/rules/`, fill it in,
and submit it as a normal PR.
