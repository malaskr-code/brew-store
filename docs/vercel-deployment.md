# Brew: one Next.js app on Vercel

The storefront and every `/api/*` endpoint now run inside the **same Next.js
application**. No separate Express backend or Vercel Services configuration is
needed. MongoDB and the customer/owner authentication boundaries are unchanged.

## Vercel import settings

| Setting | Value |
| --- | --- |
| Project name | `brew-logic-store` (or another available name) |
| Root directory | `artifacts/brew-logic` |
| Framework / Application preset | **Next.js**, not Services |
| Install command | Read from this app's `vercel.json` |
| Build command | `pnpm run build` |
| Output directory | Leave the Next.js default |

Import **only `artifacts/brew-logic`**. The former API artifact is retired;
`mockup-sandbox` is a design tool, not part of the deployed store.

Keep access to files outside the root directory enabled if Vercel offers the
setting. Next.js uses workspace packages under `lib/` and product images under
`attached_assets/`. The tracing root is configured for the whole repository.

## Environment variables

Set values securely in Vercel's Environment Variables settings. Never commit
an `.env` file or put secret values in `vercel.json`.

Server-only:

- `MONGODB_URI`
- `JWT_SECRET` (at least 32 bytes; retain it to preserve existing customer sessions)
- `SESSION_SECRET`
- `GROQ_API_KEY`
- `GROQ_MODEL`
- `GEO_API_URL`
- `BREW_LOGIC_ADMIN_EMAIL`
- `CLERK_SECRET_KEY`
- `CLERK_PUBLISHABLE_KEY`

Browser-safe Clerk configuration:

- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` — publishable key only; the Next config can
  also derive this from the server's `CLERK_PUBLISHABLE_KEY`.
- `NEXT_PUBLIC_CLERK_PROXY_URL` — only when the chosen Clerk instance requires a
  configured proxy. On Replit this can also derive from `CLERK_PROXY_URL`.

The old `VITE_*` variables are not used. Never put secret credentials into a
`NEXT_PUBLIC_*` variable.

The private owner editor still uses **Replit-managed Clerk**, separately from
MongoDB/JWT customer accounts. This migration does not replace that tenant,
change its keys, or automatically authorize another production domain.
Confirm that the existing Clerk instance can serve the Vercel domain before
relying on owner sign-in. Do not copy a Replit preview-specific proxy URL to
Vercel or replace managed credentials without a separate migration decision.

Use isolated data/credentials for Vercel preview environments. Allow backend
connections in MongoDB's network controls. Deployment never seeds, deletes, or
migrates database data automatically.

Cookies are host-bound: visitors on a new Vercel domain will need to log in
again. Their existing MongoDB accounts and passwords are unchanged.

## Local commands

Run from the repository root:

```sh
pnpm --filter @workspace/brew-logic run dev
pnpm --filter @workspace/brew-logic run build
pnpm --filter @workspace/brew-logic run start
```

The server binds to `PORT`, defaulting to 3000 outside the managed Replit workflow.
Replit serves the store and API from the same managed web service.

The explicit one-time catalog seed command is:

```sh
pnpm --filter @workspace/brew-server run seed:catalog
```

It skips nonempty product/bundle collections. Do not run it as a deploy step.

## Before launch

Push this migration to the GitHub branch Vercel imports, set the root directory
above, add environment variables, then check the build/deployment logs.

On the actual HTTPS deployment, verify:

1. `/api/healthz`, `/api/products`, and `/api/bundles`.
2. Home, Machines, Beans, product-detail deep links, images, and refresh.
3. Guest cart/favorites and currency persistence.
4. Customer signup/login/logout and secure httpOnly session cookies.
5. Chatbot and location/currency lookup.
6. Verified owner sign-in, catalog editing, and denied guest/customer admin access.
7. Arabic/RTL, dark mode, and mobile layout.

As before, in-memory rate limits and server rate caches are per running instance.
## Stripe test checkout

The cart now reviews an exact **USD test payment quote** before opening Stripe
Checkout. Catalog/display prices remain KWD, subject to the existing display
currency switcher. Quotes use the server's cached KWD exchange rates, round each
Stripe unit price to USD cents, and expire after 15 minutes.

Only `sk_test_` credentials and test sessions are accepted. Replacing the key
with a live key intentionally disables checkout rather than charging real money.
The publishable key is not needed for this hosted-redirect integration.

Set these **server-only** Vercel environment variables:

- `STRIPE_SECRET_KEY` — the matching test secret key.
- `DATABASE_URL` — the PostgreSQL connection for Stripe's managed event schema.
  This is separate from `MONGODB_URI`; MongoDB is not replaced or migrated.
- `STRIPE_WEBHOOK_URL` — the exact public HTTPS endpoint,
  `https://YOUR-VERCEL-DOMAIN/api/stripe/webhook`.

Do not copy a Replit preview webhook URL to Vercel. Ensure Stripe can reach the
Vercel webhook without deployment-protection authentication. The managed
integration registers the endpoint and stores its signing secret securely in
the Stripe payment database; `STRIPE_WEBHOOK_SECRET` is only needed if using an
explicitly configured signing secret instead.

The setup helper is:

```sh
pnpm --filter @workspace/scripts run setup:stripe
```

Run it with the intended deployment's test credentials, payment database and
webhook URL configured securely. It initializes **Stripe's managed schema
only**, not MongoDB users/products/bundles. Checkout initialization also ensures
the managed webhook/backfill is ready before creating a Stripe session.

Raw webhook signatures are verified by `stripe-replit-sync`; the handler never
trusts a browser-supplied event or `checkout=success` URL. The return flow checks
the checkout cookie owner, Stripe session, USD amount and order reference before
marking the MongoDB order paid and removing purchased items from the cart.
Cancelled, expired, failed and unverified payments leave the cart intact.

This is a **test checkout**, not a live-payment launch or fulfillment system.
The Stripe payment ledger is synchronized by webhook; the MongoDB confirmation
is finalized on the verified return. Automated fulfillment and owner order
management require separate work before accepting real orders.
