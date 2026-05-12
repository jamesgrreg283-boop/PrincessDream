# PrincessDream

A production-ready website for **PrincessDream**, a children's princess
entertainment business serving Coventry, Leamington Spa, Bedworth, Nuneaton
and Kenilworth.

Built with **React + Vite + TypeScript + Tailwind CSS + Framer Motion +
React Router**, fully responsive, SEO-optimised, accessibility-friendly, and
ready for Stripe deposit payments.

---

## Quick start

```bash
npm install
npm run dev     # local dev server
npm run build   # production build to /dist
npm run preview # preview the production build
npm run stripe:sync-deposits  # Stripe deposit products (needs STRIPE_SECRET_KEY in .env.local)
```

Open <http://localhost:5173>.

---

## Project structure

```
src/
├── App.tsx               # Router & routes
├── main.tsx              # Entry, BrowserRouter, HelmetProvider
├── index.css             # Tailwind + global styles (sparkle effects, buttons, cards)
├── components/           # Reusable UI (Navbar, Footer, cards, SEO, sparkles, ...)
├── data/                 # Editable content: characters, packages, reviews, areas, faqs, site
├── lib/
│   └── stripe.ts         # Stripe deposit redirect (Payment Link or Checkout API)
└── pages/                # One file per route
api/
└── create-checkout-session.mjs  # Vercel: Stripe Checkout Session
scripts/
├── sync-stripe-deposit-products.mjs  # Idempotent Stripe Product/Price setup
└── hero-png-to-webp.mjs
public/
├── crown.svg             # Favicon (also reused inline)
├── robots.txt
└── sitemap.xml
```

---

## Where to edit content

All content is centralised in `src/data/` — no need to touch components for
copy or pricing changes.

| File                  | What it controls                                |
| --------------------- | ----------------------------------------------- |
| `data/site.ts`        | Business name, phone, email, social, copyright  |
| `data/characters.ts`  | Princess line-up, bios, photos                  |
| `data/packages.ts`    | Prices, durations, includes, "Most Popular"     |
| `data/reviews.ts`     | Testimonials                                    |
| `data/areas.ts`       | Service areas + per-area SEO copy               |
| `data/faqs.ts`        | FAQ accordion (also drives FAQ schema)          |

### Replacing placeholder images

All photos currently use royalty-free Unsplash placeholders. Search for the
`src` URLs in:

- `data/characters.ts` (one image per character)
- `pages/Home.tsx` → `HERO_IMG`
- `pages/Gallery.tsx` → `GALLERY` array

For each, swap in your real photo URL (or import a local file from
`src/assets/`).

---

## Stripe deposits

The site has a flexible Stripe integration in `src/lib/stripe.ts`. Two ways
to enable real payments:

### Option 1 — Hosted Payment Links (simplest)

1. In Stripe Dashboard, create three Payment Links (one per package) with
   amounts `£40`, `£50`, `£50` (30-minute, 1-hour, 2-hour packages).
2. Paste each URL into `STRIPE_PAYMENT_LINKS` in `src/lib/stripe.ts`:

```ts
export const STRIPE_PAYMENT_LINKS = {
  "30-minute-appearance": "https://buy.stripe.com/...",
  "1-hour-party":          "https://buy.stripe.com/...",
  "2-hour-party":          "https://buy.stripe.com/...",
};
```

Customers will be redirected to Stripe's hosted checkout.

### Option 2 — Checkout Session (this repo + Vercel)

The project includes `api/create-checkout-session.mjs`, which creates a Stripe
Checkout Session using your **secret** key on the server only.

1. Deploy the site to [Vercel](https://vercel.com/) (import the Git repo).
2. In the Vercel project → **Settings → Environment Variables**, add:
   - `STRIPE_SECRET_KEY` — your `sk_test_…` or `sk_live_…` (never prefix with `VITE_` and never commit it).
   - `STRIPE_PRICE_30_MINUTE_APPEARANCE`, `STRIPE_PRICE_1_HOUR_PARTY`, `STRIPE_PRICE_2_HOUR_PARTY` — Stripe **Price** IDs (`price_…`) from `npm run stripe:sync-deposits` (see below). When these are set, Checkout uses your Stripe **Products** catalogue; if omitted, Checkout still works using inline `price_data` for the same GBP amounts.
   - `STRIPE_ALLOWED_FRONTEND_ORIGINS` (optional) — comma-separated **extra** exact origins to allow (e.g. a staging URL or alternate domain). **Any HTTPS origin** on a normal browser request is already allowed for `/api/*`; this variable adds more rather than replacing that rule. `create-checkout-session` still requires `returnOrigin` to match the request origin.
   - `VITE_STRIPE_CHECKOUT_ENDPOINT` (optional) — only if the Checkout API is on a **different** origin than the website. If set, it must be the **full** URL including `/api/create-checkout-session` (not just your homepage URL). Same-domain Vercel deploys can omit it (the app uses `/api/create-checkout-session` on the current host).
3. **Create deposit products in Stripe (one-time):** from the repo root, with `STRIPE_SECRET_KEY` in `.env.local`:

```bash
npm run stripe:sync-deposits
```

Copy the printed `STRIPE_PRICE_*=price_…` lines into `.env.local` and into the same variables on Vercel, then redeploy.

4. Copy `.env.example` to `.env.local` (gitignored) and set:
   - `VITE_STRIPE_CHECKOUT_ENDPOINT` (optional on Vercel) — only needed if the API is **not** on the same domain as the site. On Vercel with this repo, production uses **`/api/create-checkout-session`** on the same origin automatically.
   - For local `npm run dev` without `vercel dev`, set `VITE_STRIPE_CHECKOUT_ENDPOINT` to your full API URL (e.g. `http://localhost:3000/api/create-checkout-session`).
   - `VITE_STRIPE_PUBLISHABLE_KEY` (optional) — your `pk_test_…` / `pk_live_…` if you later add Stripe.js; the redirect flow does not require it today.

Local testing: run `npx vercel dev` from the repo root (serves the Vite app and `/api/*` together), then add `STRIPE_SECRET_KEY` to `.env.local` for the serverless runtime. You do not need `VITE_STRIPE_CHECKOUT_ENDPOINT` when using `vercel dev` on one port if the CLI serves both app and API on the same origin.

The booking form POSTs `{ currency, packageSlug, booking, returnOrigin }`. The **deposit in pence** is chosen on the server from `packageSlug` (it does not trust a client-supplied amount).

### Dev mode

If neither Payment Links nor a reachable Checkout Session URL is available, the form simulates a successful submission and routes to `/booking-success?dev=1` so you can test the flow.

---

## SEO

- Per-page `<title>`, meta description, canonical, Open Graph + Twitter tags
  via `react-helmet-async` (`src/components/SEO.tsx`).
- `LocalBusiness` structured data in `index.html`.
- `FAQPage` structured data emitted from `/faq`.
- `sitemap.xml` and `robots.txt` in `public/`.
- Keyword-targeted landing pages at `/areas/:slug` for each service area.

After deploying, update `SITE.url` in `src/data/site.ts` and re-build.

---

## Accessibility

- Semantic HTML throughout (`<nav>`, `<main>`, `<article>`, `<figure>`, ...).
- All interactive elements are keyboard-accessible with visible focus rings.
- All decorative icons are `aria-hidden`; meaningful icons have labels.
- Color contrast meets WCAG AA on body text.
- Form fields have associated labels and inline error messages.

---

## Routes

| Path                  | Page                                  |
| --------------------- | ------------------------------------- |
| `/`                   | Home                                  |
| `/packages`           | Packages                              |
| `/characters`         | Characters                            |
| `/gallery`            | Gallery                               |
| `/reviews`            | Reviews                               |
| `/faq`                | FAQ                                   |
| `/areas`              | Areas overview                        |
| `/areas/:slug`        | Per-area SEO landing                  |
| `/book` / `/contact`  | Booking form                          |
| `/booking-success`    | Post-payment / dev success            |
| `/privacy`            | Privacy Policy                        |
| `/terms`              | Terms & Conditions                    |
| `*`                   | 404                                   |

---

## Brand

- **Colours** — Soft pink `#FCE4EC`, white, gold `#D4AF37`, lavender `#F3E5F5`.
- **Headings** — Playfair Display / Cinzel.
- **Body** — Poppins.
- **Vibe** — Magical, elegant, premium, family-warm.

Adjust everything in `tailwind.config.js`.

---

## Deploy

Static site — deploy `dist/` to any host (Vercel, Netlify, Cloudflare Pages,
Hostinger static, etc.). Most platforms auto-detect Vite.

Example (Vercel CLI):

```bash
npm run build
npx vercel deploy --prod
```

---

## License

© 2026 PrincessDream. All rights reserved.
