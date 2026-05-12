/**
 * Creates or updates Stripe Products + one-time GBP Prices for party deposits.
 * Idempotent: finds products by metadata `apd_package_slug` (keep in sync with
 * `src/data/packages.ts` deposit amounts).
 *
 * Usage (from repo root):
 *   node --env-file=.env.local scripts/sync-stripe-deposit-products.mjs
 *
 * Requires: STRIPE_SECRET_KEY
 * Prints: lines to add to `.env.local` and Vercel (STRIPE_PRICE_*).
 */

import Stripe from "stripe";

/** Must match `src/data/packages.ts` slugs and depositOnline (pounds → pence). */
const DEPOSITS = [
  {
    slug: "30-minute-appearance",
    name: "PrincessDream — 30 Minute Appearance (deposit)",
    description:
      "Online deposit to secure a 30-minute princess appearance. Balance due before the party.",
    // TODO: restore 4000 after testing — must match create-checkout-session DEPOSITS_PENCE
    unitAmountPence: 100,
  },
  {
    slug: "1-hour-party",
    name: "PrincessDream — 1 Hour Party (deposit)",
    description:
      "Online deposit to secure a 1-hour princess party. Balance due before the party.",
    unitAmountPence: 5000,
  },
  {
    slug: "2-hour-party",
    name: "PrincessDream — 2 Hour Party (deposit)",
    description:
      "Online deposit to secure a 2-hour princess party. Balance due before the party.",
    unitAmountPence: 5000,
  },
];

const ENV_KEY_BY_SLUG = {
  "30-minute-appearance": "STRIPE_PRICE_30_MINUTE_APPEARANCE",
  "1-hour-party": "STRIPE_PRICE_1_HOUR_PARTY",
  "2-hour-party": "STRIPE_PRICE_2_HOUR_PARTY",
};

async function findProductBySlug(stripe, slug) {
  const q = `metadata['apd_package_slug']:'${slug}'`;
  const res = await stripe.products.search({ query: q, limit: 1 });
  return res.data[0] ?? null;
}

async function findActiveMatchingPrice(stripe, productId, unitAmountPence) {
  const prices = await stripe.prices.list({
    product: productId,
    active: true,
    limit: 20,
  });
  return (
    prices.data.find(
      (p) =>
        p.currency === "gbp" &&
        p.unit_amount === unitAmountPence &&
        p.type === "one_time"
    ) ?? null
  );
}

async function main() {
  const secret = process.env.STRIPE_SECRET_KEY?.trim();
  if (!secret) {
    console.error(
      "Missing STRIPE_SECRET_KEY. Run:\n  node --env-file=.env.local scripts/sync-stripe-deposit-products.mjs"
    );
    process.exit(1);
  }

  const stripe = new Stripe(secret);
  const lines = [];

  for (const row of DEPOSITS) {
    let product = await findProductBySlug(stripe, row.slug);
    if (!product) {
      product = await stripe.products.create({
        name: row.name,
        description: row.description,
        metadata: { apd_package_slug: row.slug, apd_type: "party_deposit" },
      });
      console.log(`Created product ${product.id} (${row.slug})`);
    } else {
      await stripe.products.update(product.id, {
        name: row.name,
        description: row.description,
        metadata: { apd_package_slug: row.slug, apd_type: "party_deposit" },
      });
      console.log(`Updated product ${product.id} (${row.slug})`);
    }

    let price = await findActiveMatchingPrice(
      stripe,
      product.id,
      row.unitAmountPence
    );
    if (!price) {
      price = await stripe.prices.create({
        product: product.id,
        currency: "gbp",
        unit_amount: row.unitAmountPence,
        nickname: `Deposit £${row.unitAmountPence / 100}`,
      });
      console.log(`Created price ${price.id} (${row.slug}) £${row.unitAmountPence / 100}`);
    } else {
      console.log(`Using existing price ${price.id} (${row.slug})`);
    }

    const envKey = ENV_KEY_BY_SLUG[row.slug];
    lines.push(`${envKey}=${price.id}`);
  }

  console.log("\n--- Add these to `.env.local` and Vercel (Environment Variables) ---\n");
  console.log(lines.join("\n"));
  console.log("\nThen redeploy / restart `vercel dev` so Checkout uses catalogue prices.\n");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
