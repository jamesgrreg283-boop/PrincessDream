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
│   └── stripe.ts         # Stripe deposit redirect logic (Payment Link or API)
└── pages/                # One file per route
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

### Option 2 — Checkout Session API

1. Create a tiny serverless endpoint (Vercel/Netlify/Cloudflare) that creates
   a Stripe Checkout Session and returns `{ url }`.
2. Copy `.env.example` to `.env` and set:

```
VITE_STRIPE_CHECKOUT_ENDPOINT=https://your-api/.../create-checkout-session
```

The booking form will POST `{ amount, currency, packageSlug, booking }` to
that endpoint and redirect to the returned `url`.

### Dev mode

If neither option is configured, the form simulates a successful submission
and routes to `/booking-success?dev=1` so you can test the flow.

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
