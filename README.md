# Vijaya Premix — Frontend Prototype

A multi-page e-commerce prototype for **Vijaya Premix**, an Indian
ready-to-cook premix brand. Built with plain HTML5, Tailwind CSS (CDN) and
vanilla JavaScript only — no frameworks, no build step required to run it.

## Running it locally

No build tools are required. Either:

1. **Double-click `index.html`** to open it directly in a browser, or
2. **Serve it** (recommended, avoids any file:// quirks):
   ```bash
   cd vijaya-premix
   python3 -m http.server 8000
   # then open http://localhost:8000/index.html
   ```

An internet connection is needed on first load for Tailwind CSS, Google Fonts
and Font Awesome. The official catalogue images and logo are bundled locally.

## Directory structure

```
vijaya-premix/
├── index.html              Homepage — hero, categories, current catalogue,
│                            pack-to-plate, featured recipes, preorder teaser,
│                            gallery, newsletter, brand strip
├── products.html            All Premixes — search and filters (7 products)
├── recipes.html              Vijaya Recipe Book — filter, search, recipe modal
├── preorder.html             Upcoming flavours, adds "preorder" cart items
├── cart.html                 Cart page + mock checkout
├── login.html                 Prototype login (localStorage/sessionStorage)
├── signup.html                Prototype signup
├── about.html                 Brand story, Mission/Vision/Promise, FAQs,
│                              Contact, Shipping, Returns, Privacy (anchors
│                              used by every page's footer)
├── robots.txt
├── sitemap.xml
├── manifest.json
├── README.md
└── assets/
    ├── css/
    │   └── styles.css        Base type, focus states, toasts, filter chips,
    │                         decorative shapes (Tailwind utilities do the rest)
    ├── js/
    │   ├── data.js            Product / recipe / category / preorder sample data
    │   ├── main.js             Site-wide UI: nav, toasts, wishlist, quick view
    │   ├── search.js            Site search across products + recipes
    │   ├── cart.js               Cart drawer, cart page, mock checkout
    │   ├── products.js            products.html filters/sort/search
    │   ├── recipes.js              recipes.html filters/search + recipe modal
    │   └── auth.js                  login.html / signup.html validation
    └── images/
        ├── products/, recipes/, hero/   currently empty — see assets/images/README.md
        └── brand/                        official logo JPEG and favicon.svg
```

## How the site is built

Every page shares one header, footer, cart drawer and `<head>` (fonts,
Tailwind config, SEO meta, JSON-LD). The product and recipe **cards are
rendered as static HTML** (crawlable, work with JavaScript off) and then
**progressively enhanced** by `products.js` / `recipes.js`, which filter,
sort and search by reading each card's `data-*` attributes rather than
re-rendering from JSON. `data.js` holds the same catalogue as a JS array for
the navbar search, the cart, and the recipe/quick-view modals. Internally,
both are generated from one Python data source during authoring, which is
why the static markup and the JS dataset never drift apart — but the
shipped site is plain static HTML/CSS/JS with no build step or server
dependency.

## What's placeholder / sample content

- **Catalogue and logo imagery** — the seven supplied product packs and the
  official logo are bundled unchanged and used throughout the prototype.
- **Prices** — no prices were supplied, so the interface says “Price on request.”
- **Preorder launch dates** — illustrative ("Launching September 2026" etc.).
- **Contact details, shipping/returns/privacy text, FAQs** on `about.html`
  — clearly-labelled sample copy, not real policy.
- **`SITE_URL`** used for canonical/OG/schema URLs is a placeholder domain
  (`https://www.vijayapremix.example`).
- **Login/signup "auth"** — stores only a name/email in `localStorage` /
  `sessionStorage` to demo a logged-in nav state. No password is ever
  stored, hashed, or sent anywhere; there is no real backend.
- **Checkout** — collects name/address/phone/pincode client-side, clears
  the cart and shows a confirmation. No payment gateway is integrated.

## Before this goes to production

1. Add official lifestyle photography if it becomes available.
2. Replace `SITE_URL`, social links, contact email/phone/address, and the
   Instagram/Facebook/YouTube URLs with the real ones.
3. Add reviewed catalogue prices only when the brand supplies them.
4. Build a real backend for accounts (password hashing, sessions, email
   verification) — the current login/signup is a UI demo only.
5. Integrate a real payment gateway for checkout; the current flow is a
   client-side mock with no payment processing.
6. Replace the FAQ/shipping/returns/privacy copy on `about.html` with
   reviewed, legally-accurate policy text.
7. Confirm any marketing claims (e.g. "natural", "preservative-free") with
   the brand/legal team before adding them — none are currently made.
8. Re-run Lighthouse / axe before production and optimize supplied imagery
   with brand approval if alternate responsive files become available.
