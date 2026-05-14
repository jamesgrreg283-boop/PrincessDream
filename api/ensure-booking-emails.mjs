import Stripe from "stripe";
import { getSupabaseAdmin } from "./_lib/supabase.mjs";
import {
  applyCors,
  handleOptions,
  isAllowedFrontendOrigin,
} from "./_lib/cors.mjs";
import {
  markBookingConfirmationEmailsSent,
  sendBookingConfirmationEmails,
} from "./_lib/emails.mjs";

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
  const sessionId = String(body?.sessionId || "").trim();
  if (!sessionId.startsWith("cs_")) {
    return res.status(400).json({ error: "Invalid sessionId" });
  }

  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) {
    return res.status(500).json({ error: "Stripe is not configured" });
  }

  let supabase;
  try {
    supabase = getSupabaseAdmin();
  } catch (e) {
    if (e?.code === "NO_SUPABASE") {
      return res.status(503).json({ error: "Database is not configured" });
    }
    throw e;
  }

  const stripe = new Stripe(stripeKey);
  let session;
  try {
    session = await stripe.checkout.sessions.retrieve(sessionId);
  } catch (e) {
    console.error("ensure-booking-emails Stripe retrieve:", e);
    return res.status(400).json({ error: "Could not load checkout session" });
  }

  if (session.mode !== "payment" || session.payment_status !== "paid") {
    return res.status(200).json({ ok: false, reason: "not_paid" });
  }

  const bookingId =
    session.metadata?.booking_id || session.client_reference_id;
  const pi =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.payment_intent?.id ?? null;

  let row = null;
  let fetchErr = null;
  if (bookingId) {
    const r = await supabase
      .from("bookings")
      .select("*")
      .eq("id", bookingId)
      .maybeSingle();
    row = r.data;
    fetchErr = r.error;
  }

  if (fetchErr) {
    console.error(fetchErr);
    return res.status(500).json({ error: "Lookup failed" });
  }

  if (!row) {
    const bySession = await supabase
      .from("bookings")
      .select("*")
      .eq("stripe_session_id", session.id)
      .maybeSingle();
    if (bySession.error) {
      console.error(bySession.error);
      return res.status(500).json({ error: "Lookup failed" });
    }
    row = bySession.data;
  }

  if (!row) {
    return res.status(404).json({ error: "booking_not_found" });
  }

  if (row.status === "pending") {
    const { data: updated, error: upErr } = await supabase
      .from("bookings")
      .update({
        status: "confirmed",
        stripe_payment_intent_id: pi ?? row.stripe_payment_intent_id,
      })
      .eq("id", row.id)
      .eq("status", "pending")
      .select("*")
      .maybeSingle();

    if (upErr) {
      console.error(upErr);
      return res.status(500).json({ error: "Update failed" });
    }
    if (updated) row = updated;
    else {
      const { data: again } = await supabase
        .from("bookings")
        .select("*")
        .eq("id", row.id)
        .maybeSingle();
      if (again) row = again;
    }
  }

  if (row.status === "cancelled") {
    return res.status(200).json({ ok: false, reason: "cancelled" });
  }

  if (row.status !== "confirmed") {
    return res.status(200).json({ ok: false, reason: "not_confirmed", status: row.status });
  }

  if (row.confirmation_emails_sent_at) {
    return res.status(200).json({ ok: true, alreadySent: true });
  }

  try {
    const mailResult = await sendBookingConfirmationEmails(row);
    if (mailResult?.skipped) {
      return res.status(200).json({
        ok: false,
        reason: mailResult.reason || "skipped",
      });
    }
    if (mailResult?.errors?.length) {
      console.error("ensure-booking-emails partial failure:", mailResult.errors);
      return res.status(200).json({ ok: false, emailErrors: mailResult.errors });
    }

    const marked = await markBookingConfirmationEmailsSent(supabase, row.id);
    if (!marked) {
      console.error("ensure-booking-emails: markBookingConfirmationEmailsSent failed");
    }

    return res.status(200).json({ ok: true, sent: true });
  } catch (e) {
    console.error("ensure-booking-emails:", e);
    return res.status(500).json({ error: "Email send failed" });
  }
}
