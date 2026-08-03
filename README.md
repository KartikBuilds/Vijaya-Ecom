# Vijaya Premix

This repository contains the Next.js 15 App Router storefront, PostgreSQL/Prisma foundation, secure administrator access, and the Step 3 Product CMS. It uses strict TypeScript and locally compiled Tailwind CSS.

The customer storefront intentionally still reads the seven-product catalogue from `data/products.ts`. The database contains a seeded copy for the future CMS, but public product queries will move to PostgreSQL only in a later step.

## Requirements

- Node.js supported by Next.js 15
- PostgreSQL
- npm

## Environment

Copy `.env.example` to an ignored local environment file and replace every sample value:

```bash
cp .env.example .env
```

- `DATABASE_URL`: PostgreSQL connection string.
- `ADMIN_EMAIL`: email provisioned by the seed command.
- `ADMIN_PASSWORD`: 12–128 character admin password; stored only as a bcrypt hash.
- `SESSION_SECRET`: independent random secret containing at least 32 characters.

Never commit a real environment file or reuse sample values in production.

## Install and database setup

```bash
npm install
npm run db:generate
npm run db:migrate
npm run db:seed
```

Use `npm run db:migrate:dev -- --name <migration-name>` only when authoring a new migration. `npm run db:studio` opens Prisma Studio for local inspection.

The seed is idempotent by category slug, product slug, and admin email. Explicitly running it updates the configured email-matched administrator’s password hash, enforces the `ADMIN` role, and reactivates the account. It never logs a password or hash.

## Run and validate

```bash
npm run dev
npm run lint
npm run typecheck
npm run build
```

Admin login is available only at `/admin/login`; no admin link appears in the public navigation and there is no public admin signup.

## Step 3 Product CMS

Authenticated administrators can use:

- `/admin/products` to search and filter products, review live counts, and archive or restore records.
- `/admin/products/new` to create a Draft or Published product.
- `/admin/products/[id]` to edit product content, category, Decimal prices, image reference, preparation/servings text, visibility, ordering, and SEO metadata.

Products support `DRAFT`, `PUBLISHED`, and `ARCHIVED` states. The normal interface never permanently deletes products. Archive preserves the record; Restore intentionally returns an archived product to `DRAFT` so publication requires a deliberate review.

Prices use PostgreSQL `DECIMAL(10,2)` through Prisma Decimal and remain nullable. Compare-at price, when supplied, must be greater than or equal to the price.

Image binaries are not stored in PostgreSQL. Step 3 accepts either an existing local `/assets/...` path or a validated external HTTP(S) URL and provides an object-contain preview. No durable upload provider is configured, so file upload is intentionally deferred rather than writing to ephemeral deployment storage.

Product mutations use server actions, independently enforce the active `ADMIN` session, validate an explicit field allowlist with Zod, and safely handle unique slug conflicts. Run the deterministic validation checks with:

```bash
npm run test:product-validation
```

## Admin security

- Credentials are validated on the server with generic failure responses.
- Passwords are hashed with bcrypt (cost 12).
- A successful login creates 32 random bytes of session entropy.
- Only an HMAC-SHA-256 token hash is stored in PostgreSQL.
- The opaque token cookie is `HttpOnly`, `SameSite=Lax`, secure in production, and expires after seven days.
- Protected admin layouts verify the database session, expiry, active state, and `ADMIN` role server-side.
- Login and logout use same-origin, POST-only server routes; logout invalidates the database session and clears the cookie.
- Admin pages declare `noindex, nofollow` metadata.

## Current Step 3 boundaries

- The admin dashboard and Product CMS use live database statistics and records.
- Product permanent deletion, durable file upload, reviews, recipes, homepage settings, orders, payments, media, analytics, and other CMS modules are not implemented.
- Customer login/signup remains the existing browser-storage prototype; real customer authentication is not part of Step 2.
- The public storefront continues using `data/products.ts` until the planned later database integration step.
- Prices and delivery remain “on request”; no payment or real checkout exists.
- The placeholder canonical URL remains centralized in `lib/site.ts` and must be replaced before production.

Step 4 will connect the customer storefront to Prisma. Until then, Product CMS changes intentionally do not appear on public pages.
