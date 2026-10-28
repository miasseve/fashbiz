# FASHBIZ / REE

## Overview

Resale-commerce platform for secondhand & vintage stores (re-e.dk, brand **Ree** /
leStores AI). Stores upload products, AI generates the listing details, and items are
synced out to Shopify and sold with automatic consignor split-payments. Built with the
Next.js App Router. Admins manage stores, users, products and payouts from `/admin`.
Stores and consignors use `/dashboard`. Deployed on Vercel (auto-deploys from `master`).

## Stack

| Area | Tech |
|------|------|
| Framework | Next.js 16 (App Router, Turbopack) · React 19 |
| Language | JavaScript (no TypeScript), JSX for components |
| Auth | NextAuth v5 beta (JWT sessions, credentials provider) · `src/proxy.js` middleware |
| Database | MongoDB + Mongoose 8.x (cached connection in `src/lib/db.js`) |
| Payments | Stripe (subscriptions, Checkout, Connect transfers/payouts, webhooks) |
| Storefront sync | Shopify Admin API (product + collection sync) |
| Media | Cloudinary (image hosting) |
| AI | OpenAI GPT-4o-mini — structured-output listing generation + image analysis (the `/api/google-vision` route calls OpenAI despite its name, not Google) |
| State | Redux Toolkit + redux-persist (key: "fash") |
| UI | Tailwind CSS v3 · HeroUI · Framer Motion · Lucide · react-icons |
| Forms | react-hook-form + Yup validation |
| Email | Nodemailer (SMTP) |
| Hosting | Vercel (auto-deploy from `master`) |
| Node | 22.x |

## Commands

| Command | Purpose |
|---------|---------|
| `npm run dev` | Dev server (Turbopack) |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run lint` | ESLint (flat config, next/core-web-vitals) |
| `NODE_OPTIONS="--max-old-space-size=8192" npm run build` | Production build with increased memory |

No test framework is configured.

## Path alias

`@/*` resolves to `./src/*` (configured in `jsconfig.json`).

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

## Coding conventions

- **No TypeScript.** Pure JS with JSX.
- **Server Actions** (`"use server"`) in `src/actions/` for data mutations, called directly from client components.
- **Route Handlers** (`route.js`) for API endpoints. No pages router anywhere.
- **Mongoose model pattern**: `mongoose.models.X || mongoose.model("X", Schema)` to avoid recompilation in dev.
- **HeroUI components** (Button, Card, Input, Spinner, Dropdown) instead of raw HTML elements.
- **Yup validation** schemas live in `src/actions/validations.js`.
- **`@/*` imports** everywhere: `@/models/User`, `@/lib/db`, `@/actions/authActions`.

## Role system

Five roles: `admin`, `developer`, `store`, `brand`, `consignor`. Middleware (`src/proxy.js`) enforces role-based route access and redirects.

## Currency

All prices are in DKK (Danish Krone).

## Environment variables

See `.env.example` for the full list. Secrets include MongoDB URI, Stripe keys, OpenAI key, Cloudinary credentials, Shopify API keys, NextAuth secret, and SMTP config.

## Deployment

- Vercel, auto-deploys from `master` branch.
- API routes have 60-second max duration (`vercel.json`).
- Two cron jobs: daily subscription check (01:00 UTC), daily upload reminder (08:00 UTC).

## Git conventions

- Default branch: `master`.
- Base branch for tasks: `master`. Create task branches from `master` and merge them
  back into `master`.
- Feature branches: `feat/<description>`.
- Commit style: `type(scope): message` (e.g. `fix(pricing): ...`, `feat(auth): ...`).

## Rules

Active rule files live in `.claude/rules/` — currently `plan-mode.md`,
`known-failures.md` and `task-workflow.md`. Template skeletons for additional topics are
in `.claude/templates/rules/`; to activate one, copy it into `.claude/rules/`, fill it
in, and submit it as a normal PR.

## Things to watch for

- Two Tailwind configs exist (`tailwind.config.js` CJS and `tailwind.config.mjs` ESM). The CJS one is active (used by PostCSS).
- `DESIGN.md` in the repo root contains design tokens for the pricing page specifically.
- Remnants of a prior Wix integration exist in comments; Shopify is the current storefront.
- Unclaimed stores use `@ree-unclaimed.internal` emails. Matching happens on real-owner signup.
- Demo mode still exists and the 200-product limit is still in code — only the demo-mode naming was removed from the screens (the client kept the skip-Stripe function).
