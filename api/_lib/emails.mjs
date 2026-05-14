import { Resend } from "resend";
import { characterLabel } from "./characters.mjs";
import { packageBySlug } from "./packages.mjs";

const SUPPORT_PHONE = process.env.BOOKING_SUPPORT_PHONE?.trim() || "07871 796024";
const SUPPORT_PHONE_TEL = process.env.BOOKING_SUPPORT_PHONE_TEL?.trim() || "+447871796024";

function primaryContactEmail() {
  return (
    process.env.ADMIN_BOOKING_EMAIL?.trim() ||
    process.env.NOTIFY_EMAIL_TO?.trim() ||
    "princessdreamuk@gmail.com"
  );
}

function esc(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escPlain(s) {
  return String(s ?? "");
}

function safePounds(n) {
  const v = Number(n);
  if (!Number.isFinite(v)) return "—";
  return `£${v}`;
}

function safeReplyTo(email) {
  const t = String(email ?? "").trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t)) return null;
  return t;
}

/** After both Resend calls succeed, callers persist this so backup routes skip duplicates. */
export async function markBookingConfirmationEmailsSent(supabase, bookingId) {
  const { error } = await supabase
    .from("bookings")
    .update({ confirmation_emails_sent_at: new Date().toISOString() })
    .eq("id", bookingId);
  if (error) {
    console.error("Could not set confirmation_emails_sent_at:", error);
    return false;
  }
  return true;
}

/** One HTML table row — name `tableRow` avoids any collision with a booking record named `row`. */
function tableRow(label, valueHtml) {
  return `
    <tr>
      <td style="padding:10px 16px 10px 0;font-weight:600;vertical-align:top;color:#5b3d52;width:42%;border-bottom:1px solid #f3e8ee">${esc(label)}</td>
      <td style="padding:10px 0;vertical-align:top;color:#2A1B2D;border-bottom:1px solid #f3e8ee">${valueHtml}</td>
    </tr>`;
}

function bookingDetailLines(booking) {
  const slug = booking?.selected_package;
  const pkg = packageBySlug(slug);
  const pkgName = pkg
    ? `${pkg.name} (${escPlain(slug) || "—"})`
    : escPlain(slug) || "—";
  const princess = characterLabel(booking?.selected_character);
  const notesRaw = booking?.notes != null ? String(booking.notes).trim() : "";
  const notes = notesRaw ? escPlain(notesRaw) : "—";

  return [
    ["Parent name", escPlain(booking?.parent_name) || "—"],
    ["Email", escPlain(booking?.email) || "—"],
    ["Phone", escPlain(booking?.phone) || "—"],
    ["Child's name", escPlain(booking?.child_name) || "—"],
    ["Child's age", escPlain(booking?.child_age) || "—"],
    ["Party date", escPlain(booking?.party_date) || "—"],
    ["Start time", escPlain(booking?.party_start_time) || "—"],
    ["Address", escPlain(booking?.address) || "—"],
    ["Chosen princess", escPlain(princess) || "—"],
    ["Package", pkgName || "—"],
    ["Total price", safePounds(booking?.total_price)],
    ["Deposit paid", safePounds(booking?.deposit_amount)],
    ["Balance due on the day", safePounds(booking?.remaining_balance)],
    ["Notes / special requests", notes],
  ];
}

function formatBookingDetailsPlain(booking) {
  const lines = bookingDetailLines(booking).map(([k, v]) => `${k}: ${v}`);
  return lines.join("\n");
}

function formatBookingDetailsTable(booking) {
  const rows = bookingDetailLines(booking)
    .map(([label, value]) => tableRow(label, esc(value)))
    .join("");

  return `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;font-family:Georgia,'Times New Roman',serif;font-size:15px;line-height:1.45">
    ${rows}
  </table>`;
}

function adminReferenceBlock(booking) {
  const sid = booking?.stripe_session_id ? escPlain(booking.stripe_session_id) : "—";
  const pi = booking?.stripe_payment_intent_id
    ? escPlain(booking.stripe_payment_intent_id)
    : "—";
  const bid = booking?.id ? escPlain(booking.id) : "—";
  const created = booking?.created_at ? escPlain(booking.created_at) : "—";

  return `
  <div style="margin:20px 0 0;padding:14px 16px;background:#fff;border-radius:12px;border:1px solid #ead5e3;font-family:ui-monospace,Consolas,monospace;font-size:12px;color:#4a3544;line-height:1.6">
    <div style="font-weight:700;font-family:system-ui,sans-serif;font-size:11px;letter-spacing:0.06em;text-transform:uppercase;color:#9d174d;margin-bottom:8px">Internal reference</div>
    <div><strong>Booking ID</strong> — ${esc(bid)}</div>
    <div><strong>Stripe Checkout session</strong> — ${esc(sid)}</div>
    <div><strong>PaymentIntent</strong> — ${esc(pi)}</div>
    <div><strong>Row created</strong> — ${esc(created)}</div>
  </div>`;
}

function wrapEmailHtml({ title, preheader, innerHtml }) {
  const contact = primaryContactEmail();
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${esc(title)}</title>
</head>
<body style="margin:0;padding:0;background:#faf5f9;">
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all">${esc(preheader)}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#faf5f9;padding:24px 12px">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 12px 40px rgba(157,23,77,0.08)">
          <tr>
            <td style="background:linear-gradient(135deg,#db2777 0%,#be185d 45%,#9d174d 100%);padding:28px 24px;text-align:center">
              <div style="font-family:Georgia,serif;font-size:26px;font-weight:700;color:#fff;letter-spacing:0.02em">PrincessDream</div>
              <div style="font-family:system-ui,sans-serif;font-size:13px;color:rgba(255,255,255,0.9);margin-top:6px">Magical parties · Coventry &amp; surrounds</div>
            </td>
          </tr>
          <tr>
            <td style="padding:28px 24px 32px;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#2A1B2D;font-size:15px;line-height:1.55">
              ${innerHtml}
            </td>
          </tr>
          <tr>
            <td style="padding:0 24px 24px;text-align:center;font-family:system-ui,sans-serif;font-size:12px;color:#88627a">
              Questions? Call <a href="tel:${esc(SUPPORT_PHONE_TEL)}" style="color:#be185d;font-weight:600">${esc(SUPPORT_PHONE)}</a>
              · <a href="mailto:${esc(contact)}" style="color:#be185d">${esc(contact)}</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function formatAdminNotificationHtml(booking) {
  const parentEmail = esc(booking?.email || "—");
  const inner = `
  <p style="margin:0 0 16px;font-size:16px"><strong style="color:#9d174d">New confirmed booking</strong> — deposit received via Stripe.</p>
  <p style="margin:0 0 20px;color:#4a3544">Reply to this email to reach the parent at <strong>${parentEmail}</strong>.</p>
  ${formatBookingDetailsTable(booking)}
  ${adminReferenceBlock(booking)}`;

  const child = escPlain(booking?.child_name) || "—";
  const pdate = escPlain(booking?.party_date) || "—";
  const ptime = escPlain(booking?.party_start_time) || "—";

  return wrapEmailHtml({
    title: "New PrincessDream booking",
    preheader: `Confirmed: ${child} · ${pdate} · ${ptime}`,
    innerHtml: inner,
  });
}

function formatCustomerConfirmationHtml(booking) {
  const name = esc(booking?.parent_name || "there");
  const inner = `
  <p style="margin:0 0 12px;font-size:17px">Hi ${name},</p>
  <p style="margin:0 0 18px">Thank you — your deposit payment was received and your booking is <strong style="color:#9d174d">confirmed</strong>.</p>
  <p style="margin:0 0 14px;font-weight:600;color:#5b3d52">Your party details</p>
  ${formatBookingDetailsTable(booking)}
  <p style="margin:22px 0 0">The remaining balance above is due in <strong>cash on the day</strong> of the party.</p>
  <p style="margin:14px 0 0">If anything needs to change, reply to this email or call us on <strong>${esc(SUPPORT_PHONE)}</strong>.</p>
  <p style="margin:22px 0 0;font-family:Georgia,serif;font-size:16px;color:#9d174d">With love,<br/>PrincessDream ✨</p>`;

  const pdate = escPlain(booking?.party_date) || "your party date";
  const child = escPlain(booking?.child_name) || "your child";

  return wrapEmailHtml({
    title: "Your booking is confirmed",
    preheader: `You're booked for ${pdate}. We can't wait to celebrate with ${child}!`,
    innerHtml: inner,
  });
}

function formatAdminNotificationText(booking) {
  const ref = [
    "",
    "--- Internal reference ---",
    `Booking ID: ${booking?.id || "—"}`,
    `Stripe session: ${booking?.stripe_session_id || "—"}`,
    `PaymentIntent: ${booking?.stripe_payment_intent_id || "—"}`,
    `Created: ${booking?.created_at || "—"}`,
  ].join("\n");

  return [
    "New confirmed PrincessDream booking (deposit received via Stripe).",
    "Reply to this email to reach the parent.",
    "",
    formatBookingDetailsPlain(booking),
    ref,
  ].join("\n");
}

function formatCustomerConfirmationText(booking) {
  const pn = escPlain(booking?.parent_name) || "there";
  return [
    `Hi ${pn},`,
    "",
    "Thank you — your deposit was received and your booking is CONFIRMED.",
    "",
    formatBookingDetailsPlain(booking),
    "",
    "The remaining balance is due in cash on the day of the party.",
    "If anything needs to change, reply to this email or call us.",
    "",
    "— PrincessDream",
    "",
    `Phone: ${SUPPORT_PHONE}`,
    `Email: ${primaryContactEmail()}`,
  ].join("\n");
}

/**
 * Sends admin + customer confirmation emails via Resend.
 * Call only for a paid, confirmed booking row (e.g. Stripe webhook or ensure-booking-emails).
 */
export async function sendBookingConfirmationEmails(booking) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  const adminInbox = primaryContactEmail();

  if (booking?.confirmation_emails_sent_at) {
    console.log(
      `Booking emails skipped: already recorded for booking ${booking?.id || "?"}`
    );
    return { skipped: true, reason: "already_sent" };
  }

  if (!apiKey) {
    console.warn(
      "Booking emails skipped: RESEND_API_KEY is not set (add it in Vercel → Environment Variables for production; .env.local is not deployed)."
    );
    return { skipped: true, reason: "missing_RESEND_API_KEY" };
  }
  if (!from) {
    console.warn(
      "Booking emails skipped: RESEND_FROM_EMAIL is not set (must be a verified sender/domain in Resend)."
    );
    return { skipped: true, reason: "missing_RESEND_FROM_EMAIL" };
  }

  const resend = new Resend(apiKey);
  const idBase = booking?.id
    ? `booking-${booking.id}`
    : `booking-${booking?.stripe_session_id || "unknown"}`;

  const childName = escPlain(booking?.child_name) || "—";
  const partyDate = escPlain(booking?.party_date) || "—";
  const partyTime = escPlain(booking?.party_start_time) || "—";
  const adminSubject = `New booking: ${childName} · ${partyDate} · ${partyTime}`;

  const errors = [];
  const customerTo = safeReplyTo(booking?.email);
  if (!customerTo) {
    console.error(
      "Booking customer email skipped: invalid or missing customer email on booking row"
    );
    errors.push({
      target: "customer",
      phase: "validate",
      error: { message: "invalid_or_missing_customer_email" },
    });
  }

  let adminPayload = null;
  try {
    const replyParent = safeReplyTo(booking?.email);
    adminPayload = {
      from,
      to: adminInbox,
      ...(replyParent ? { replyTo: replyParent } : {}),
      subject: adminSubject,
      html: formatAdminNotificationHtml(booking),
      text: formatAdminNotificationText(booking),
    };
  } catch (e) {
    console.error("Admin booking email render failed:", e);
    errors.push({
      target: "admin",
      phase: "render",
      error: { message: String(e?.message ?? e) },
    });
  }

  let customerPayload = null;
  if (customerTo) {
    try {
      customerPayload = {
        from,
        to: customerTo,
        replyTo: adminInbox,
        subject: "Your PrincessDream booking is confirmed ✨",
        html: formatCustomerConfirmationHtml(booking),
        text: formatCustomerConfirmationText(booking),
      };
    } catch (e) {
      console.error("Customer booking email render failed:", e);
      errors.push({
        target: "customer",
        phase: "render",
        error: { message: String(e?.message ?? e) },
      });
    }
  }

  let toAdmin = { data: null, error: null };
  if (adminPayload) {
    try {
      toAdmin = await resend.emails.send(adminPayload, {
        idempotencyKey: `${idBase}-admin-confirm-v1`,
      });
    } catch (e) {
      console.error("Resend admin booking email threw:", e);
      toAdmin = { data: null, error: { message: String(e?.message ?? e) } };
    }
    if (toAdmin.error) {
      console.error(
        "Resend admin booking email failed:",
        JSON.stringify(toAdmin.error)
      );
      errors.push({ target: "admin", phase: "send", error: toAdmin.error });
    }
  }

  let toCustomer = { data: null, error: null };
  if (customerPayload) {
    try {
      toCustomer = await resend.emails.send(customerPayload, {
        idempotencyKey: `${idBase}-customer-confirm-v1`,
      });
    } catch (e) {
      console.error("Resend customer booking email threw:", e);
      toCustomer = { data: null, error: { message: String(e?.message ?? e) } };
    }
    if (toCustomer.error) {
      console.error(
        "Resend customer email failed:",
        JSON.stringify(toCustomer.error)
      );
      errors.push({ target: "customer", phase: "send", error: toCustomer.error });
    }
  }

  if (errors.length) {
    console.error(
      `Resend: admin→${adminInbox}, customer→${customerTo || "(skipped)"}, from=${from}. Fix domain verification or API key in Resend dashboard.`
    );
  } else {
    console.log(
      `Booking confirmation emails sent (admin ${adminInbox}, customer ${customerTo})`
    );
  }

  return { toAdmin, toCustomer, errors: errors.length ? errors : undefined };
}
