import Stripe from "stripe";
import getRawBody from "raw-body";
import { getSupabaseAdmin } from "./_lib/supabase.mjs";
import {
  markBookingConfirmationEmailsSent,
  sendBookingConfirmationEmails,
} from "./_lib/emails.mjs";

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
        console.error(
          "checkout.session.completed: missing booking_id / client_reference_id"
        );
        return res.status(200).json({ received: true, ignored: true });
      }

      const pi =
        typeof session.payment_intent === "string"
          ? session.payment_intent
          : session.payment_intent?.id ?? null;
      const sessionId = typeof session.id === "string" ? session.id : null;

      const { data: booking, error: fetchErr } = await supabase
        .from("bookings")
        .select("*")
        .eq("id", bookingId)
        .maybeSingle();

      if (fetchErr) {
        console.error(
          "[checkout.session.completed] booking fetch failed:",
          fetchErr
        );
        return res.status(200).json({ received: true, booking_fetch_error: true });
      }

      if (!booking) {
        console.warn(
          `[checkout.session.completed] no booking row for booking_id=${bookingId}`
        );
        return res.status(200).json({ received: true, no_booking: true });
      }

      console.log(
        `[checkout.session.completed] booking found id=${booking.id} status=${booking.status} confirmation_emails_sent_at=${booking.confirmation_emails_sent_at ?? "null"}`
      );

      if (booking.status === "cancelled") {
        console.log(
          `[checkout.session.completed] skip emails: booking ${bookingId} is cancelled`
        );
        return res.status(200).json({ received: true, skipped: "cancelled" });
      }

      if (booking.confirmation_emails_sent_at) {
        console.log(
          `[checkout.session.completed] skip emails: confirmation_emails_sent_at=${booking.confirmation_emails_sent_at}`
        );
        return res.status(200).json({ received: true, skipped: "already_emailed" });
      }

      let rowForEmail = booking;

      if (booking.status === "pending") {
        const { data: updated, error: upErr } = await supabase
          .from("bookings")
          .update({
            status: "confirmed",
            stripe_payment_intent_id:
              pi ?? booking.stripe_payment_intent_id ?? null,
            ...(sessionId && !booking.stripe_session_id
              ? { stripe_session_id: sessionId }
              : {}),
          })
          .eq("id", bookingId)
          .eq("status", "pending")
          .select("*")
          .maybeSingle();

        if (upErr) {
          console.error(
            "[checkout.session.completed] pending→confirmed update failed:",
            upErr
          );
          return res.status(200).json({ received: true, update_failed: true });
        }

        if (updated) {
          console.log(
            `[checkout.session.completed] updated booking ${bookingId} pending → confirmed`
          );
          rowForEmail = updated;
        } else {
          const { data: again } = await supabase
            .from("bookings")
            .select("*")
            .eq("id", bookingId)
            .maybeSingle();
          if (again) {
            rowForEmail = again;
            console.log(
              `[checkout.session.completed] pending update did not apply (race or state change); refetched status=${rowForEmail.status}`
            );
          }
        }
      } else if (booking.status === "confirmed") {
        console.log(
          `[checkout.session.completed] booking ${bookingId} already confirmed; proceeding to send emails if confirmation_emails_sent_at is null`
        );
        const patch = {};
        if (pi && !booking.stripe_payment_intent_id) {
          patch.stripe_payment_intent_id = pi;
        }
        if (sessionId && !booking.stripe_session_id) {
          patch.stripe_session_id = sessionId;
        }
        if (Object.keys(patch).length > 0) {
          const { data: patched, error: patchErr } = await supabase
            .from("bookings")
            .update(patch)
            .eq("id", bookingId)
            .eq("status", "confirmed")
            .select("*")
            .maybeSingle();
          if (patchErr) {
            console.warn(
              "[checkout.session.completed] backfill session/pi failed:",
              patchErr
            );
          } else if (patched) {
            rowForEmail = patched;
            console.log(
              `[checkout.session.completed] backfilled stripe fields on confirmed booking ${bookingId}`
            );
          }
        }
      } else {
        console.warn(
          `[checkout.session.completed] unexpected status=${booking.status}; skip confirmation emails`
        );
        return res.status(200).json({ received: true, skipped: "bad_status" });
      }

      if (rowForEmail.status !== "confirmed") {
        console.warn(
          `[checkout.session.completed] booking ${bookingId} not confirmed (status=${rowForEmail.status}); skip emails`
        );
        return res.status(200).json({ received: true, skipped: "not_confirmed" });
      }

      if (rowForEmail.confirmation_emails_sent_at) {
        console.log(
          `[checkout.session.completed] skip emails after refetch: confirmation_emails_sent_at=${rowForEmail.confirmation_emails_sent_at}`
        );
        return res.status(200).json({ received: true, skipped: "already_emailed" });
      }

      console.log(
        `[checkout.session.completed] sending confirmation emails for booking ${rowForEmail.id}`
      );

      try {
        const mailResult = await sendBookingConfirmationEmails(rowForEmail);

        const adminId =
          mailResult?.toAdmin?.data?.id ??
          mailResult?.toAdmin?.data?.Id ??
          null;
        const customerId =
          mailResult?.toCustomer?.data?.id ??
          mailResult?.toCustomer?.data?.Id ??
          null;
        const adminErr = mailResult?.toAdmin?.error ?? null;
        const customerErr = mailResult?.toCustomer?.error ?? null;

        console.log(
          `[checkout.session.completed] Resend result booking=${rowForEmail.id} skipped=${Boolean(mailResult?.skipped)} reason=${mailResult?.reason ?? "n/a"} admin_id=${adminId ?? "n/a"} admin_err=${adminErr ? JSON.stringify(adminErr) : "none"} customer_id=${customerId ?? "n/a"} customer_err=${customerErr ? JSON.stringify(customerErr) : "none"}`
        );

        if (mailResult?.skipped) {
          console.warn(
            "[checkout.session.completed] confirmation emails skipped:",
            mailResult.reason
          );
        }
        if (mailResult?.errors?.length) {
          console.error(
            "[checkout.session.completed] confirmation emails errors:",
            mailResult.errors
          );
        }

        if (
          !mailResult?.skipped &&
          !mailResult?.errors?.length &&
          rowForEmail?.id
        ) {
          const marked = await markBookingConfirmationEmailsSent(
            supabase,
            rowForEmail.id
          );
          console.log(
            `[checkout.session.completed] confirmation_emails_sent_at mark: ${marked ? "ok" : "failed"}`
          );
        }
      } catch (mailErr) {
        console.error(
          "[checkout.session.completed] confirmation email exception:",
          mailErr
        );
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
