import Stripe from "stripe";

const DEPOSITS_PENCE = {
  "30-minute-appearance": 4000,
  "1-hour-party": 5000,
  "2-hour-party": 5000,
};

/** From `npm run stripe:sync-deposits` — add to Vercel + `.env.local`. */
function priceIdForPackage(slug) {
  const map = {
    "30-minute-appearance": process.env.STRIPE_PRICE_30_MINUTE_APPEARANCE,
    "1-hour-party": process.env.STRIPE_PRICE_1_HOUR_PARTY,
    "2-hour-party": process.env.STRIPE_PRICE_2_HOUR_PARTY,
  };
  const id = map[slug];
  return typeof id === "string" && id.startsWith("price_") ? id.trim() : null;
}

async function buildLineItems(stripe, packageSlug, currency) {
  const expected = DEPOSITS_PENCE[packageSlug];
  if (expected == null) return null;

  const priceId = priceIdForPackage(packageSlug);
  if (priceId) {
    const price = await stripe.prices.retrieve(priceId);
    if (price.currency !== "gbp" || price.unit_amount !== expected) {
      const err = new Error(
        `Stripe price ${priceId} must be GBP one-time for ${expected} pence.`
      );
      err.code = "PRICE_MISMATCH";
      throw err;
    }
    return [{ price: priceId, quantity: 1 }];
  }

  return [
    {
      price_data: {
        currency,
        unit_amount: expected,
        product_data: {
          name: `Party deposit (${String(packageSlug).replace(/-/g, " ")})`,
          description: "PrincessDream booking deposit — balance due before the party.",
        },
      },
      quantity: 1,
    },
  ];
}

function isAllowedFrontendOrigin(origin) {
  if (!origin || typeof origin !== "string") return false;
  if (origin.startsWith("http://localhost:")) return true;
  if (origin.startsWith("http://127.0.0.1:")) return true;
  const extras = (process.env.STRIPE_ALLOWED_FRONTEND_ORIGINS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  try {
    const { hostname } = new URL(origin);
    if (hostname.endsWith(".vercel.app")) return true;
    return extras.includes(origin);
  } catch {
    return false;
  }
}

function parseBody(req) {
  const b = req.body;
  if (b && typeof b === "object" && !Buffer.isBuffer(b)) return b;
  if (typeof b === "string" && b.length > 0) {
    try {
      return JSON.parse(b);
    } catch {
      return null;
    }
  }
  return null;
}

export default async function handler(req, res) {
  const requestOrigin = req.headers.origin || "";

  if (req.method === "OPTIONS") {
    if (isAllowedFrontendOrigin(requestOrigin)) {
      res.setHeader("Access-Control-Allow-Origin", requestOrigin);
      res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
      res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    }
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!isAllowedFrontendOrigin(requestOrigin)) {
    return res.status(403).json({ error: "Origin not allowed" });
  }

  res.setHeader("Access-Control-Allow-Origin", requestOrigin);
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) {
    return res.status(500).json({ error: "Stripe is not configured" });
  }

  const body = parseBody(req);
  if (!body) {
    return res.status(400).json({ error: "Invalid JSON body" });
  }

  const { currency = "gbp", packageSlug, booking, returnOrigin } = body;

  const base =
    typeof returnOrigin === "string" && isAllowedFrontendOrigin(returnOrigin)
      ? returnOrigin.replace(/\/$/, "")
      : null;

  if (!base) {
    return res.status(400).json({ error: "Invalid or missing returnOrigin" });
  }

  if (!booking || typeof booking !== "object") {
    return res.status(400).json({ error: "Missing booking" });
  }

  const email = String(booking.email || "").trim();
  if (!email) {
    return res.status(400).json({ error: "Missing booking email" });
  }

  const stripe = new Stripe(secret);

  let line_items;
  try {
    line_items = await buildLineItems(stripe, packageSlug, currency);
  } catch (e) {
    if (e && e.code === "PRICE_MISMATCH") {
      return res.status(500).json({ error: e.message });
    }
    const msg =
      e && typeof e.message === "string" ? e.message : "Stripe line item error";
    console.error(e);
    return res.status(500).json({ error: msg });
  }

  if (!line_items) {
    return res.status(400).json({ error: "Invalid package" });
  }

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: email,
    line_items,
    success_url: `${base}/booking-success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${base}/book?canceled=1`,
    metadata: {
      packageSlug: String(packageSlug),
      parentName: String(booking.parentName || "").slice(0, 500),
      childName: String(booking.childName || "").slice(0, 500),
      partyDate: String(booking.partyDate || "").slice(0, 500),
      character: String(booking.character || "").slice(0, 500),
    },
  });

  if (!session.url) {
    return res.status(500).json({ error: "No checkout URL returned" });
  }

  return res.status(200).json({ url: session.url });
}
