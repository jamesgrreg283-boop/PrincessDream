import Stripe from "stripe";
import { getSupabaseAdmin } from "./_lib/supabase.mjs";
import {
  applyCors,
  getRequestOrigin,
  handleOptions,
  isAllowedFrontendOrigin,
} from "./_lib/cors.mjs";

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
  const requestOrigin = getRequestOrigin(req);
  if (handleOptions(req, res)) return;

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  if (!isAllowedFrontendOrigin(requestOrigin)) {
    return res.status(403).json({ error: "Origin not allowed" });
  }
  applyCors(res, requestOrigin);

  const body = parseBody(req);
  const sessionId = String(body?.session_id || "").trim();
  if (!sessionId.startsWith("cs_")) {
    return res.status(400).json({ error: "Missing or invalid session_id" });
  }

  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) {
    return res.status(500).json({ error: "Stripe is not configured" });
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

  const stripe = new Stripe(secret);

  let session;
  try {
    session = await stripe.checkout.sessions.retrieve(sessionId);
  } catch (e) {
    console.error(e);
    return res.status(400).json({ error: "Could not verify checkout session" });
  }

  if (session.payment_status === "paid") {
    return res
      .status(200)
      .json({ ok: true, released: false, reason: "already_paid" });
  }

  const bookingId =
    (session.metadata && session.metadata.booking_id) ||
    session.client_reference_id;
  if (!bookingId) {
    return res.status(400).json({ error: "Session is not linked to a booking" });
  }

  const { error } = await supabase
    .from("bookings")
    .update({ status: "cancelled" })
    .eq("id", bookingId)
    .eq("status", "pending");

  if (error) {
    console.error(error);
    return res.status(500).json({ error: "Could not release booking hold" });
  }

  return res.status(200).json({ ok: true, released: true });
}
