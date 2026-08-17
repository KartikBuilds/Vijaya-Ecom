# Vijaya Premix

Next.js 15 App Router storefront and internal Vijaya Admin management platform backed by PostgreSQL and Prisma.

## Environment

Copy `.env.example` to an ignored local environment file and configure:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/vijaya_premix"
ADMIN_EMAIL="admin@example.com"
ADMIN_USERNAME="Sujata"
ADMIN_PASSWORD=<secure environment value>
SESSION_SECRET="generate-a-long-random-secret"
NEXT_PUBLIC_SITE_URL="https://your-production-domain.example"
```

Never commit real `.env*` files. `ADMIN_PASSWORD` is provisioning input only; the application stores only a bcrypt password hash.

## Setup

```bash
npm install
npm run db:generate
npm run db:migrate
npm run db:seed
npm run lint
npm run typecheck
npm run build
```

Use Prisma migrations for schema history. Do not use `prisma db push` for production changes.

For reproducible local PostgreSQL:

```bash
docker compose --env-file .env.local -f compose.dev.yml up -d postgres
```

The local `.env.local` file must define `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_PORT`, and a matching `DATABASE_URL`.

## Admin Provisioning

`npm run db:seed` provisions or updates the configured initial administrator by `ADMIN_EMAIL`, assigns `ADMIN_USERNAME`, sets role `SUPER_ADMIN`, activates the account, and stores only a bcrypt hash. The public admin login accepts username or email plus the configured password. No public admin signup exists.

## Admin Architecture

Protected admin routes live under `/admin` and use server-side session checks. Route groups currently expose:

- `/admin`, `/admin/login`
- `/admin/profile`, `/admin/security`
- `/admin/team`, `/admin/roles`
- `/admin/products`, `/admin/recipes`, `/admin/reviews`, `/admin/media`
- `/admin/customers`, `/admin/customers/[id]`
- `/admin/content`, `/admin/homepage`, `/admin/banners`, `/admin/ugc`
- `/admin/feedback`, `/admin/notifications`
- `/admin/analytics`, `/admin/activity`
- `/admin/settings`

Admin pages declare `noindex, nofollow`.

## Customer Authentication

Customer `/login`, `/signup`, and `/logout` use server/database authentication. Passwords are bcrypt-hashed, sessions are stored in `CustomerSession`, cookies are `HttpOnly`, expired sessions are rejected, and disabled or blocked customers cannot authenticate. Admin block/disable actions revoke active customer sessions.

Cart and wishlist persistence remain browser-side storefront preferences; account authentication no longer uses localStorage.

## Roles and Permissions

RBAC is centralized in `lib/auth/permissions.ts`:

- `SUPER_ADMIN`: full platform access.
- `PRODUCT_MANAGER`: products, media, own profile/security, analytics.
- `CONTENT_MANAGER`: recipes, reviews, homepage/content, banners, UGC, media, notifications, analytics.
- `ORDER_MANAGER`: customer, feedback, notifications, analytics, own profile/security.

Pages and server actions independently call `requirePermission()` or `requireRole()`. Hidden navigation is not treated as authorization.

## Publishing Workflow

Products, recipes, reviews, banners, and UGC use controlled lifecycle states such as `DRAFT`, `SCHEDULED`, `PUBLISHED`, `HIDDEN`, `ARCHIVED`, plus moderation states where appropriate. Public queries dynamically require `status=PUBLISHED`, `publishAt <= now()` when set, and `unpublishAt > now()` when set, so scheduled content does not require an administrator browser tab.

Preview/publish UX is foundation-level in this iteration; supported admin forms persist drafts and public storefront queries exclude non-public states.

## Management Modules

- Products: existing CMS preserved, with expanded schema for pinned, preorder messaging, scheduling, visibility, and SEO.
- Recipes: product association, safe HTTP(S) video URLs, structured ingredients/instructions, scheduling, SEO.
- Reviews: moderation lifecycle, featured/pinned flags, internal moderation notes.
- Homepage: structured hero, CTA, featured product, section visibility, promise and Pack-to-Plate content.
- Banners: controlled placements (`HOME_HERO`, `HOME_PROMO`, `PRODUCTS_TOP`, `PREORDER`, `GLOBAL_NOTICE`), schedule fields, CTA fields.
- Media: local/public asset and external URL registry. Production upload requires durable storage.
- Customers: status-ready customer records with privacy-conscious activity, review and UGC summaries.
- UGC: customer cooking content moderation with approved/rejected/hidden/archive states.
- Feedback: inquiry categorization, status workflow, internal notes.
- Notifications: unread/read records, mark one/all read, entity links.
- Analytics: controlled first-party event model with empty states when no records exist.
- Activity: audit log for important admin changes, without secrets or tokens.
- Security: password change with current password verification, bcrypt hashing, session list, logout other/all sessions.
- Team: Super Admin staff creation, role assignment, activation/deactivation, and final active Super Admin protection.

## Media Configuration

Durable upload storage is intentionally not faked. Configure Vercel Blob, Cloudinary, S3, or another durable provider before enabling production uploads.

Current status: `MEDIA PROVIDER CONFIGURATION REQUIRED`.

## Rate Limiting

Admin and customer login use PostgreSQL-backed throttling via `AuthThrottle`. Keys are HMAC-hashed with `SESSION_SECRET`; raw passwords and raw credential secrets are not stored.

## Storefront Integration

Public product, recipe, and review queries only return currently eligible published content. Draft, scheduled-before-publish, hidden, archived, rejected, and internal-note fields are not exposed through storefront helpers.

## Remaining Limitations

- Orders, payments, inventory, customer authentication, customer sessions, and real upload storage are not implemented.
- Customer pages are architecture-ready and show empty states when no real customer accounts exist.
- Exact automatic status transitions still require deployment cron if destructive state changes are desired; current public visibility is dynamic and time-aware.
- Browser QA at all requested viewport widths requires a runnable local build/dev server and browser automation.

## CI Validation

`.github/workflows/admin-platform-validation.yml` runs npm clean install with optional dependencies, Prisma validation/generation/migrations, seed, lint, TypeScript, validation scripts, build, and a tracked secret scan against a PostgreSQL service container.
