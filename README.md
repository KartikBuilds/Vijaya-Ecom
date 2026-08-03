# Vijaya Premix Storefront

The Vijaya Premix storefront is a Next.js App Router application built with strict TypeScript, React, and a locally compiled Tailwind CSS pipeline. The seven-product catalogue in `data/products.ts` is the single source used by product listings, filters, search, wishlist, recipes, quick view, and cart behavior.

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Validate a production build

```bash
npm run typecheck
npm run lint
npm run build
npm start
```

## Current Step 1 limitations

- Cart and wishlist persistence use browser `localStorage`.
- Login and signup are clearly labelled prototypes using local/session browser storage. They are not secure authentication.
- Prices, delivery, and availability remain “on request”; checkout does not create a real order or payment.
- Preorder remains the current empty-state presentation.
- The canonical base URL is the existing placeholder `https://www.vijayapremix.example`, centralized in `lib/site.ts`; replace it before production deployment.

No admin dashboard, database, APIs, CMS, payment gateway, or production authentication are implemented. A later architecture step can add those systems without duplicating the storefront catalogue or changing this Step 1 UI.
