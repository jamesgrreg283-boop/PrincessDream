/**
 * Creates a **separate** Stripe Product + one-time GBP £1 Price for cheap test checkouts
 * for the 30-minute package. Does not modify your existing £40 catalogue product.
 *
 * Usage (repo root):
 *   node --env-file=.env.local scripts/create-stripe-30min-one-pound-deposit.mjs
 *
 * Or: npm run stripe:create-30min-1gbp-deposit
 *
 * Requires: STRIPE_SECRET_KEY (test or live — matches your key mode)
 *
 * Paste the printed STRIPE_PRICE_30_MINUTE_APPEARANCE=… line into Vercel and `.env.local`.
 */

import Stripe from "stripe";

const PRODUCT_NAME = "PrincessDream — 30 Minute Appearance (£1 test deposit)";
const PRODUCT_DESCRIPTION =
  "£1 GBP one-time deposit for Stripe test checkouts on PrincessDream (30-min package). Live deposit remains £40 on your main product.";

async function main() {
  const secret = process.env.STRIPE_SECRET_KEY?.trim();
  if (!secret) {
    console.error(
      "Missing STRIPE_SECRET_KEY. Run:\n  npm run stripe:create-30min-1gbp-deposit"
    );
    process.exit(1);
  }

  if (!/^sk_(test|live)_/.test(secret)) {
    console.error(
      "STRIPE_SECRET_KEY must be your standard Secret key (starts with sk_test_ or sk_live_).\n" +
        "In Stripe → Developers → API keys, copy the Secret key under “Standard keys” — not Publishable (pk_), Restricted (rk_), or any other value.\n" +
        `Your key starts with: ${secret.slice(0, 7)}…`
    );
    process.exit(1);
  }

  const stripe = new Stripe(secret);

  const product = await stripe.products.create({
    name: PRODUCT_NAME,
    description: PRODUCT_DESCRIPTION,
    metadata: {
      apd_type: "party_deposit_1gbp_test",
      apd_site_package_slug: "30-minute-appearance",
    },
  });

  const price = await stripe.prices.create({
    product: product.id,
    currency: "gbp",
    unit_amount: 100,
    nickname: "Deposit £1 (test)",
  });

  console.log("\nCreated in Stripe (Dashboard → Products):\n");
  console.log(`  Product: ${product.id}`);
  console.log(`  Price:   ${price.id}  (£1.00 GBP, one-time)\n`);
  console.log("Add this to Vercel → Environment Variables and to `.env.local`, then redeploy:\n");
  console.log(`STRIPE_PRICE_30_MINUTE_APPEARANCE=${price.id}\n`);
  console.log(
    "Your existing £40 product is unchanged. When you go live with £40 deposits, swap this env var to that Price ID and set deposits in code to £40.\n"
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
