# CLAUDE.md

## Project overview

leStores AI (brand: **Ree**, live at re-e.dk / lestores-ai.com) is a resale-commerce SaaS for secondhand fashion stores in Denmark. Store owners photograph items, GPT-4o-mini generates Shopify-ready listings, and Stripe Connect handles consignor split-payments.

## Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16, App Router, React 19 |
| Language | JavaScript (no TypeScript), JSX for components |
| Auth | NextAuth v5 beta, credentials provider, JWT sessions |
| Database | MongoDB via Mongoose 8.x, cached connection in `src/lib/db.js` |
| Payments | Stripe (subscriptions, Checkout, Connect, webhooks) |
| Storefront | Shopify Admin API |
| Media | Cloudinary |
| AI | OpenAI GPT-4o-mini (structured output), Google Cloud Vision |
| State | Redux Toolkit + redux-persist (key: "fash") |
| UI | Tailwind CSS v3 + HeroUI + Framer Motion + Lucide React |
| Forms | react-hook-form + Yup validation |
| Email | Nodemailer (SMTP) |
| Deployment | Vercel (auto-deploy from `master`), Node 22.x |

## Commands

```bash
npm run dev      # Dev server (Turbopack)
npm run build    # Production build
npm run start    # Serve production build
npm run lint     # ESLint (flat config, next/core-web-vitals)
```

No test framework is configured.

## Path alias

`@/*` resolves to `./src/*` (configured in `jsconfig.json`).

## Key directories

```
src/
  app/              # Next.js App Router pages and API routes
    (auth)/         # Login, register, forgot/reset password
    try/            # Guest demo flow (no auth required)
    dashboard/      # Store/consignor/brand authenticated views
    admin/          # Admin panel
    api/            # ~85 API route handlers
      public/       # External API for Discover app (API-key auth)
  actions/          # Server Actions ("use server") for mutations
  components/       # Shared React components
  models/           # Mongoose schemas (~27 models)
  lib/              # Service modules, utilities, AI pipeline
  features/         # Redux slices (product, cart)
  mails/            # Email templates (Nodemailer)
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
- Base branch for current tasks: `feat/pricing-alignment`.
  Create task branches from it and merge back into it.
  Do not merge directly into `master` — the whole branch
  will be merged to master once the work is reviewed.
- Feature branches: `feat/<description>`.
- Commit style: `type(scope): message` (e.g. `fix(pricing): ...`, `feat(auth): ...`).

## Things to watch for

- Two Tailwind configs exist (`tailwind.config.js` CJS and `tailwind.config.mjs` ESM). The CJS one is active (used by PostCSS).
- `DESIGN.md` in the repo root contains design tokens for the pricing page specifically.
- Remnants of a prior Wix integration exist in comments; Shopify is the current storefront.
- Unclaimed stores use `@ree-unclaimed.internal` emails. Matching happens on real-owner signup.
- Demo mode: accounts start with a 200-product limit until they subscribe or connect Stripe.
