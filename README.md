# Vijaya Premix

Full-stack e-commerce storefront and secure admin CMS for Vijaya Premix food products. Built with Next.js 15, React 18, Prisma ORM, PostgreSQL, and TypeScript.

## Quick Start

### Prerequisites
- Node.js 18+ and npm
- PostgreSQL 16+
- Docker and Docker Compose (optional, for local PostgreSQL)

### Local Setup

1. **Install dependencies and configure environment:**
   ```bash
   npm install
   cp .env.example .env.local
   ```
   Edit `.env.local` with your local database credentials and a generated SESSION_SECRET (32+ random characters).

2. **Start PostgreSQL locally** (optional, if not running elsewhere):
   ```bash
   docker compose --env-file .env.local -f compose.dev.yml up -d postgres
   ```

3. **Initialize database:**
   ```bash
   npm run db:generate
   npm run db:migrate
   npm run db:seed
   ```
   The seed command provisions the initial admin account using `ADMIN_EMAIL`, `ADMIN_USERNAME`, and `ADMIN_PASSWORD` from your environment. The password is hashed immediately; never log it.

4. **Validate and run:**
   ```bash
   npm run lint
   npm run typecheck
   npm run test:validation
   npm run build
   npm run dev
   ```

The storefront runs at `http://localhost:3000` and admin portal at `http://localhost:3000/admin`.

## Environment Configuration

See `.env.example` for all required variables:

- **`DATABASE_URL`**: PostgreSQL connection string (production uses durable storage)
- **`ADMIN_EMAIL`, `ADMIN_USERNAME`, `ADMIN_PASSWORD`**: Initial super-admin credentials (password hashed after seed)
- **`SESSION_SECRET`**: Secure session key (32+ random characters, never shared)
- **`NEXT_PUBLIC_SITE_URL`**: Production domain for canonical URLs and SEO metadata

Never commit `.env`, `.env.local`, or `.env.production` files.

## Admin Portal

**Access**: `/admin/login` via username or email + password.

### Secured Routes
- **Dashboard & Auth**: `/admin`, `/admin/login`, `/admin/logout`
- **Account**: `/admin/profile`, `/admin/security`
- **Team Management**: `/admin/team`, `/admin/roles`
- **Content**: `/admin/products`, `/admin/recipes`, `/admin/reviews`
- **Media & UGC**: `/admin/media`, `/admin/ugc`
- **Site Content**: `/admin/homepage`, `/admin/banners`, `/admin/content`
- **Customer Management**: `/admin/customers`, `/admin/customers/[id]`
- **Feedback & Notifications**: `/admin/feedback`, `/admin/notifications`
- **Observability**: `/admin/analytics`, `/admin/activity`
- **Configuration**: `/admin/settings`

All admin pages return `noindex, nofollow` and enforce server-side session validation.

### Role-Based Access Control

Four roles define admin capabilities (defined in `lib/auth/permissions.ts`):

- **`SUPER_ADMIN`**: Full platform access, staff management, all content and customer operations.
- **`PRODUCT_MANAGER`**: Products, media uploads, analytics, own profile/security.
- **`CONTENT_MANAGER`**: Recipes, reviews, homepage, banners, UGC, media, notifications, analytics.
- **`ORDER_MANAGER`**: Customer records, feedback, notifications, analytics, own profile/security.

Pages and server actions independently verify permissions; UI navigation is not security.

### Content Publishing

Products, recipes, reviews, banners, and UGC support lifecycle management:

- **Status states**: `DRAFT`, `PUBLISHED`, `SCHEDULED`, `HIDDEN`, `ARCHIVED`
- **Moderation states** (reviews, UGC): `PENDING`, `APPROVED`, `REJECTED`, `HIDDEN`
- **Scheduling**: `publishAt` and `unpublishAt` timestamps enable automatic visibility without admin polling

Public storefront queries return only currently eligible published content based on status and schedule.

## Authentication & Security

### Customer Accounts
- Email/username and bcrypt-hashed password
- Persistent `CustomerSession` records in PostgreSQL
- HttpOnly, secure session cookies
- Admin block/disable actions immediately revoke active sessions
- No localStorage for sensitive auth data

### Admin Accounts
- Bcrypt-hashed passwords, never plaintext storage
- Session list with logout-other and logout-all-sessions
- Password change requires current password verification
- Rate limiting on login attempts via PostgreSQL throttle records

### Rate Limiting
Login endpoints use HMAC-hashed rate-limit keys; raw credentials are not logged.

## Media Management

Uploaded images and videos require durable external storage (Vercel Blob, Cloudinary, S3, etc.) before production use.

**Current status**: Media provider integration is required for production file uploads.

## Validation Commands

```bash
npm run test:validation       # Product, recipe, and review validation
npm run test:integration      # CI integration test suite
npm run test:e2e              # Smoke test (requires running server)
npm run audit:production      # Production dependency audit
```

## CI Pipeline

`.github/workflows/admin-platform-validation.yml` on each push:
- Clean install with optional dependencies
- Prisma schema validation, code generation, migrations
- Database seed
- ESLint and TypeScript type checking
- Validation scripts and build
- Secret detection scan against a PostgreSQL test container

## Production Deployment

### Checklist
- [ ] Database: PostgreSQL 16+ with durable automated backups
- [ ] Secrets: Generate strong `SESSION_SECRET`, unique `ADMIN_PASSWORD`; use environment variables only
- [ ] Media storage: Configure and verify external storage provider
- [ ] SEO: Set `NEXT_PUBLIC_SITE_URL` to production domain for sitemaps and JSON-LD
- [ ] Database migrations: Use `npm run db:migrate` (not `prisma db push`) for schema changes
- [ ] Session cleanup: Implement periodic deletion of expired customer sessions
- [ ] Monitoring: Log admin activity via `/admin/activity` and audit critical changes

### Build & Run
```bash
npm install --production
npm run build
npm start
```

Use a reverse proxy (Nginx, Cloudflare) for SSL termination, rate limiting, and static asset caching.

## Not Yet Implemented

- **Orders & payments**: No order management or payment gateway integration
- **Inventory**: No stock tracking or supply-chain visibility
- **Email**: No transactional email service (password reset, notifications, etc.)
- **External storage**: Local file uploads not suitable for production; requires S3, Blob, or Cloudinary
- **Scheduled jobs**: Cron tasks for automatic status transitions, session cleanup, and digest emails require external job runner (Vercel Cron, Bull, etc.)

## Browser Compatibility

Tested and supported on modern browsers (Chrome, Firefox, Safari, Edge). Run locally with `npm run dev` to test responsive design across viewport widths.

## Support & Questions

For issues, questions, or feature requests, contact the development team or check the project documentation.
