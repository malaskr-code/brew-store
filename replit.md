# Brew

- Public-facing store name: Brew. Keep “Brew” in English in Arabic copy, and preserve technical slugs, package names, database names, and environment-variable keys.

A Kuwait coffee store with a live MongoDB catalog, customer accounts, a private
owner editor, cart, favorites, currency conversion, and a coffee assistant.

## Run and build

- `pnpm --filter @workspace/brew-logic run dev` — one Next.js server for the
  storefront and all `/api/*` routes; use its managed workflow in Replit.
- `pnpm --filter @workspace/brew-logic run build` — production Next.js build.
- `pnpm --filter @workspace/brew-logic run start` — production server.
- `pnpm run typecheck` — all workspace TypeScript checks.
- `pnpm --filter @workspace/brew-server run test` — server unit tests; live
  MongoDB integration checks require `RUN_MONGO_INTEGRATION_TESTS=1`.
- `pnpm --filter @workspace/api-spec run codegen` — regenerate shared API types.
- `pnpm --filter @workspace/brew-server run seed:catalog` — explicit one-time
  seed; skips nonempty product/bundle collections. Never seed during deployment.

## Structure

- `artifacts/brew-logic` — the single Next.js frontend and backend.
- `artifacts/brew-logic/src/server` — native Next.js HTTP/auth/proxy handlers.
- `lib/brew-server` — server-only MongoDB, customer auth, catalog, chat, and
  currency services, plus seed data and tests.
- `lib/api-spec/openapi.yaml` — API contracts; generated client and Zod libraries
  retain the existing same-origin endpoint shapes.
- `artifacts/api-server` — retired artifact metadata only; no running backend.
- `artifacts/mockup-sandbox` — separate design preview, not deployed with the store.
- `docs/vercel-deployment.md` — exact single-project Vercel import settings.

## Constraints

- The user requested Next.js for the whole store, with frontend and backend
  hosted together. Do not reintroduce a separate Vite/Express store runtime.
- Do not change anything outside the requested feature.
- Preserve MongoDB; never replace it with another database without permission.
- Customer accounts use MongoDB, bcrypt, and a secure httpOnly JWT cookie.
  Customer email verification is disabled.
- Owner access uses a separate verified Clerk identity. A matching customer
  email must never grant administrator access.
- Never expose server secrets to browser code. Only publishable Clerk
  configuration may use `NEXT_PUBLIC_*`.
- Checkout uses Stripe-hosted test payments only; live keys are rejected.
  Catalog prices remain KWD. The user approved USD test payments: show and
  confirm a server-priced USD quote before redirecting to Stripe.
- MongoDB retains catalog, customers, and checkout order snapshots. The existing
  PostgreSQL database is used only for Stripe's managed event synchronization.
- `pnpm --filter @workspace/scripts run setup:stripe` initializes Stripe's
  managed schema, test webhook and backfill. Production requires a server-only
  `STRIPE_WEBHOOK_URL` and payment database connection; see the Vercel guide.
