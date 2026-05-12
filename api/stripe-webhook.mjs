import Stripe from "stripe";
import getRawBody from "raw-body";
import { getSupabaseAdmin } from "./_lib/supabase.mjs";
import { sendBookingConfirmationEmails } from "./_lib/emails.mjs";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).end("Method Not Allowed");
  }

  const stripeKey = process.env.STRIPE_SECRET_KEY;
  const whSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripeKey || !whSecret) {
    return res.status(500).send("Stripe webhook is not configured");
  }

  const sig = req.headers["stripe-signature"];
  if (!sig) {
    return res.status(400).send("Missing stripe-signature");
  }

  let buf;
  try {
    buf = await getRawBody(req, {
      length: req.headers["content-length"],
      limit: "2mb",
    });
  } catch (e) {
    console.error("Webhook raw body:", e);
    return res.status(400).send(`Webhook read error: ${e.message}`);
  }

  const stripe = new Stripe(stripeKey);

  let event;
  try {
    event = stripe.webhooks.constructEvent(buf, sig, whSecret);
  } catch (err) {
    console.error("Webhook signature failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  let supabase;
  try {
    supabase = getSupabaseAdmin();
  } catch (e) {
    console.error(e);
    return res.status(500).send("Database not configured");
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      if (session.mode !== "payment" || session.payment_status !== "paid") {
        return res.status(200).json({ received: true, ignored: true });
      }

      const bookingId =
        session.metadata?.booking_id || session.client_reference_id;
      if (!bookingId) {
        console.error("checkout.session.completed missing booking_id");
        return res.status(200).json({ received: true, ignored: true });
      }

      const pi =
        typeof session.payment_intent === "string"
          ? session.payment_intent
          : session.payment_intent?.id ?? null;

      const { data: updated, error: upErr } = await supabase
        .from("bookings")
        .update({
          status: "confirmed",
          stripe_payment_intent_id: pi,
        })
        .eq("id", bookingId)
        .eq("status", "pending")
        .select("*")
        .maybeSingle();

      if (upErr) {
        console.error(upErr);
        return res.status(500).json({ error: "Update failed" });
      }

      if (!updated) {
        console.warn(
          `checkout.session.completed: no pending booking updated (already confirmed/cancelled or wrong id?) — booking_id=${bookingId} — confirmation emails not sent`
        );
      } else {
        try {
          const mailResult = await sendBookingConfirmationEmails(updated);
          if (mailResult?.skipped) {
            console.warn("Confirmation emails skipped:", mailResult.reason);
          }
          if (mailResult?.errors?.length) {
            console.error("Confirmation emails partial failure:", mailResult.errors);
          }
        } catch (mailErr) {
          console.error("Confirmation email error:", mailErr);
        }
      }
    }

    if (event.type === "checkout.session.expired") {
      const session = event.data.object;
      const bookingId =
        session.metadata?.booking_id || session.client_reference_id;
      if (bookingId) {
        await supabase
          .from("bookings")
          .update({ status: "cancelled" })
          .eq("id", bookingId)
          .eq("status", "pending");
      }
    }
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Webhook handler error" });
  }

  return res.status(200).json({ received: true });
}
