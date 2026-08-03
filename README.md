# Vijaya Premix

This repository contains the Next.js 15 App Router storefront, PostgreSQL/Prisma foundation, secure administrator access, Product CMS, and admin-managed customer reviews. It uses strict TypeScript and locally compiled Tailwind CSS.

PostgreSQL is the authoritative product catalogue. Public pages query published Prisma records for homepage products, search, filters, product details, preorder state, SEO, cart resolution, and wishlist resolution. Product CMS changes are revalidated across the storefront without a source deployment.

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
- `NEXT_PUBLIC_SITE_URL`: deployed HTTPS origin used by canonicals, sitemap, robots, and JSON-LD.

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

## Recipe and video CMS

Recipes are database-driven and managed at `/admin/recipes`, with Draft/Published/Archived lifecycle, product association, structured ingredient/instruction lists, SEO, and safe video URLs. YouTube URLs render through the privacy-enhanced embed domain; unsupported providers remain safe external links. Published recipes appear at `/recipes/[slug]`, and a featured published video recipe can appear on the homepage. No arbitrary iframe HTML is stored or rendered.

## Website content management

`/admin/homepage` controls structured hero content, section visibility, promise items, Pack-to-Plate steps, and featured hero product selection. `/admin/settings` controls brand/contact/social/WhatsApp details, global SEO defaults, and structured About content. Text is rendered as plain text; the CMS does not accept executable HTML, CSS, JavaScript, or metadata scripts. Published preorder products dynamically populate `/preorder`.

## Reviews CMS

Customer reviews are managed at `/admin/reviews`. Draft and archived reviews stay private; published reviews can appear on their associated product, and featured published reviews appear on the homepage (with a recent-published fallback). There is no anonymous public review submission. Ratings are server-validated integers from 1 through 5.

## Production deployment

Deploy to Vercel (not GitHub Pages) with a managed PostgreSQL database. Configure every variable in `.env.example`, then run `npm run db:migrate` against production before serving traffic. Run `npm run db:seed` once with a unique strong admin password to provision/update the initial administrator; rotate or remove `ADMIN_PASSWORD` from deployment configuration afterward if operational policy permits. Never run `prisma db push`, `migrate reset`, or a destructive reset in production.

No durable media provider is configured. Product/recipe CMS fields accept existing local public paths or validated HTTP(S) URLs; production upload UI must wait for configured Vercel Blob, Cloudinary, or S3-compatible storage. Login uses secure database sessions, but distributed brute-force rate limiting still requires a durable provider (for example a deployment-platform or managed rate-limit service) before high-risk public exposure; an in-memory serverless limiter is intentionally not presented as production protection.

## Current limitations

- The admin dashboard, Product CMS, and public product catalogue use live database records.
- Product permanent deletion, durable file upload, orders, payments, customer accounts, inventory, coupons, and analytics are not implemented.
- Customer login/signup remains the existing browser-storage prototype; real customer authentication is not part of Step 2.
- Cart and wishlist persistence remain client-side and store product IDs only; current display data is resolved from published database products and stale IDs are removed.
- Prices and delivery remain “on request”; no payment or real checkout exists.
- `NEXT_PUBLIC_SITE_URL` falls back to localhost only for local development and must be configured on Vercel.
- Customer login/signup remains a browser-storage prototype, and checkout does not create orders or take payment.
