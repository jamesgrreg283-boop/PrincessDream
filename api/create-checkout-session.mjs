import Stripe from "stripe";
import { applyCors, handleOptions, isAllowedFrontendOrigin } from "./_lib/cors.mjs";
import { getSupabaseAdmin } from "./_lib/supabase.mjs";
import { isSlotAvailable } from "./_lib/availability.mjs";
import {
  bookingRowFromPayload,
  validateBookingPayload,
} from "./_lib/bookingValidate.mjs";
import { packageBySlug } from "./_lib/packages.mjs";

const DEPOSITS_PENCE = {
  "30-minute-appearance": 4000,
  "1-hour-party": 5000,
  "2-hour-party": 5000,
};

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
  if (handleOptions(req, res)) return;

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!isAllowedFrontendOrigin(requestOrigin)) {
    return res.status(403).json({ error: "Origin not allowed" });
  }

  applyCors(res, requestOrigin);

  const body = parseBody(req);
  if (!body) {
    return res.status(400).json({ error: "Invalid JSON body" });
  }

  const { currency = "gbp", packageSlug, booking, returnOrigin } = body;

  const ro =
    typeof returnOrigin === "string" ? returnOrigin.trim().replace(/\/$/, "") : "";
  const o = requestOrigin.trim().replace(/\/$/, "");
  if (!ro || ro !== o) {
    return res.status(403).json({
      error: "returnOrigin must match the site address (refresh and try again).",
    });
  }

  const base = ro;

  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) {
    return res.status(500).json({ error: "Stripe is not configured" });
  }

  if (!booking || typeof booking !== "object") {
    return res.status(400).json({ error: "Missing booking" });
  }

  const v = validateBookingPayload(booking);
  if (!v.ok) {
    return res.status(400).json({ error: "Invalid booking fields", fields: v.errors });
  }

  const pkg = packageBySlug(String(packageSlug));
  if (!pkg || pkg.slug !== booking.packageSlug) {
    return res.status(400).json({ error: "Invalid package" });
  }

  let supabase;
  try {
    supabase = getSupabaseAdmin();
  } catch (e) {
    if (e?.code === "NO_SUPABASE") {
      return res.status(500).json({ error: "Database is not configured" });
    }
    throw e;
  }

  const available = await isSlotAvailable(
    supabase,
    booking.partyDate,
    booking.partyTime
  );
  if (!available) {
    return res.status(409).json({
      error:
        "That date and time is no longer available. Please choose another slot.",
    });
  }

  const holdMin = Math.max(
    5,
    Math.min(120, Number(process.env.BOOKING_PENDING_HOLD_MINUTES || 30))
  );
  const holdExpires = new Date(Date.now() + holdMin * 60 * 1000).toISOString();

  const row = bookingRowFromPayload(booking, pkg);
  row.hold_expires_at = holdExpires;

  const { data: inserted, error: insErr } = await supabase
    .from("bookings")
    .insert(row)
    .select("id")
    .single();

  if (insErr || !inserted?.id) {
    console.error(insErr);
    return res.status(500).json({ error: "Could not create booking hold" });
  }

  const bookingId = inserted.id;

  const stripe = new Stripe(secret);

  let line_items;
  try {
    line_items = await buildLineItems(stripe, packageSlug, currency);
  } catch (e) {
    await supabase.from("bookings").update({ status: "cancelled" }).eq("id", bookingId);
    if (e && e.code === "PRICE_MISMATCH") {
      return res.status(500).json({ error: e.message });
    }
    const msg =
      e && typeof e.message === "string" ? e.message : "Stripe line item error";
    console.error(e);
    return res.status(500).json({ error: msg });
  }

  if (!line_items) {
    await supabase.from("bookings").update({ status: "cancelled" }).eq("id", bookingId);
    return res.status(400).json({ error: "Invalid package" });
  }

  const email = String(booking.email || "").trim();

  let session;
  try {
    session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: email,
      line_items,
      success_url: `${base}/booking-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${base}/book?canceled=1`,
      client_reference_id: bookingId,
      metadata: {
        booking_id: bookingId,
        packageSlug: String(packageSlug),
        parentName: String(booking.parentName || "").slice(0, 500),
        childName: String(booking.childName || "").slice(0, 500),
        partyDate: String(booking.partyDate || "").slice(0, 500),
        character: String(booking.character || "").slice(0, 500),
      },
    });
  } catch (e) {
    console.error(e);
    await supabase.from("bookings").update({ status: "cancelled" }).eq("id", bookingId);
    return res.status(500).json({
      error:
        e && typeof e.message === "string"
          ? e.message
          : "Could not start checkout session",
    });
  }

  if (!session.url) {
    await supabase.from("bookings").update({ status: "cancelled" }).eq("id", bookingId);
    return res.status(500).json({ error: "No checkout URL returned" });
  }

  const { error: upErr } = await supabase
    .from("bookings")
    .update({ stripe_session_id: session.id })
    .eq("id", bookingId);

  if (upErr) {
    console.error(upErr);
    return res.status(500).json({ error: "Booking was created but checkout link failed to save. Contact support." });
  }

  return res.status(200).json({ url: session.url });
}
