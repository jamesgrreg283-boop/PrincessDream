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

/**
 * Public site base URL (https, no trailing slash) for plain-text email footers.
 * Defaults: BOOKING_EMAIL_ASSETS_BASE_URL → Vercel preview host → production host.
 */
function emailPublicAssetsBase() {
  const configured = process.env.BOOKING_EMAIL_ASSETS_BASE_URL?.trim();
  if (configured) {
    return configured
      .replace(/\/$/, "")
      .replace(/^http:\/\//i, "https://");
  }
  const v = process.env.VERCEL_URL?.trim();
  if (v) {
    const host = v.replace(/^https?:\/\//i, "");
    return `https://${host}`;
  }
  return "https://aprincessdream.co.uk";
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
  const { occasion, restNotes } = splitOccasionFromNotes(notesRaw);
  const notesDisplay = restNotes ? escPlain(restNotes) : "—";

  return [
    ["Parent name", escPlain(booking?.parent_name) || "—"],
    ["Email", escPlain(booking?.email) || "—"],
    ["Phone", escPlain(booking?.phone) || "—"],
    ["Occasion", escPlain(occasion) || "—"],
    ["Guest / group / birthday child", escPlain(booking?.child_name) || "—"],
    ["Age (if given)", escPlain(booking?.child_age) || "—"],
    ["Party date", escPlain(booking?.party_date) || "—"],
    ["Start time", escPlain(booking?.party_start_time) || "—"],
    ["Address", escPlain(booking?.address) || "—"],
    ["Chosen princess", escPlain(princess) || "—"],
    ["Package", pkgName || "—"],
    ["Total price", safePounds(booking?.total_price)],
    ["Deposit paid", safePounds(booking?.deposit_amount)],
    ["Balance due on the day", safePounds(booking?.remaining_balance)],
    ["Notes / special requests", notesDisplay],
  ];
}

/** First paragraph from `buildNotes` is `Occasion: …`; keep table tidy for older rows without it. */
function splitOccasionFromNotes(notesRaw) {
  const raw = String(notesRaw ?? "").trim();
  if (!raw) return { occasion: null, restNotes: "" };
  const parts = raw.split("\n\n");
  const first = parts[0] ?? "";
  if (/^Occasion:\s*/i.test(first)) {
    const occasion = first.replace(/^Occasion:\s*/i, "").trim();
    const restNotes = parts.slice(1).join("\n\n").trim();
    return { occasion: occasion || null, restNotes };
  }
  return { occasion: null, restNotes: raw };
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
  const contact = primaryContactEmail();
  const name = esc(booking?.parent_name || "there");
  const child = esc(booking?.child_name || "your little star");
  const pdate = esc(escPlain(booking?.party_date) || "your party date");
  const ptimeRaw = escPlain(booking?.party_start_time) || "";
  const princess = esc(
    characterLabel(booking?.selected_character) || "your chosen princess"
  );

  const preheader = `You're booked! ${escPlain(booking?.party_date) || "your party date"}${ptimeRaw ? ` · ${ptimeRaw}` : ""} — we can't wait to celebrate with ${escPlain(booking?.child_name) || "you"}!`;

  const detailsCard = `
  <div style="background:#fffaf7;border-radius:18px;border:1px solid #f5cfe0;padding:22px 18px 18px;margin:0 0 26px;box-shadow:0 6px 28px rgba(106,27,154,0.07)">
    <p style="margin:0 0 14px;font-family:Georgia,'Times New Roman',serif;font-size:18px;font-weight:700;color:#6a1b9a;text-align:center">Your party details</p>
    <p style="margin:0 0 16px;text-align:center;font-size:13px;color:#8e5a7a;line-height:1.5">Everything looks magical so far — give this a quick read and let us know if anything needs a sprinkle of change.</p>
    ${formatBookingDetailsTable(booking)}
  </div>`;

  const balanceCallout = `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 26px;border-collapse:separate;border-spacing:0">
    <tr>
      <td style="background:linear-gradient(135deg,#fff9f0 0%,#fff3e0 100%);border-radius:14px;border-left:4px solid #c9a227;padding:16px 18px;font-size:14px;line-height:1.55;color:#4a3544">
        <strong style="color:#8d6e15">Balance on the day:</strong> the amount shown above is due in <strong>cash</strong> when your princess arrives — easy and stress-free.
      </td>
    </tr>
  </table>`;

  const whatsNext = `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 28px;border-collapse:separate;border-spacing:0">
    <tr>
      <td style="padding:0 0 12px;font-family:Georgia,'Times New Roman',serif;font-size:17px;font-weight:700;color:#ad1457;text-align:center">What happens next?</td>
    </tr>
    <tr>
      <td>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:separate;border-spacing:0 10px">
          <tr>
            <td style="width:40px;vertical-align:top;text-align:center;font-size:18px;color:#c9a227">&#9733;</td>
            <td style="vertical-align:top;font-size:14px;line-height:1.5;color:#4a3544"><strong style="color:#6a1b9a">We&apos;re on it.</strong> Keep this email as your confirmation — we may reach out if we need any tiny final details.</td>
          </tr>
          <tr>
            <td style="width:40px;vertical-align:top;text-align:center;font-size:18px;color:#c9a227">&#9733;</td>
            <td style="vertical-align:top;font-size:14px;line-height:1.5;color:#4a3544"><strong style="color:#6a1b9a">Before the big day.</strong> We&apos;ll send a friendly reminder so the excitement stays high and nothing is left to chance.</td>
          </tr>
          <tr>
            <td style="width:40px;vertical-align:top;text-align:center;font-size:18px;color:#c9a227">&#9733;</td>
            <td style="vertical-align:top;font-size:14px;line-height:1.5;color:#4a3544"><strong style="color:#6a1b9a">Showtime!</strong> ${child} and ${princess} will be ready for a celebration to remember.</td>
          </tr>
        </table>
      </td>
    </tr>
  </table>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${esc("Your PrincessDream booking is confirmed")}</title>
</head>
<body style="margin:0;padding:0;background:linear-gradient(180deg,#fdf2f8 0%,#fce7f3 35%,#fae8ff 100%);">
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all">${esc(preheader)}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:28px 12px 40px">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 20px 50px rgba(106,27,154,0.12),0 0 0 1px rgba(233,30,99,0.06)">
          <tr>
            <td style="background:linear-gradient(165deg,#fce4ec 0%,#f8bbd9 40%,#e1bee7 100%);padding:28px 20px 22px;text-align:center;border-bottom:1px solid rgba(201,168,39,0.35)">
              <p style="margin:0 0 14px;font-size:13px;letter-spacing:0.28em;text-transform:uppercase;color:#7b1fa2;font-weight:700">Magical parties they&apos;ll never forget</p>
              <p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:22px;font-weight:700;color:#ad1457;line-height:1.2">Princess Dream Parties</p>
              <p style="margin:14px 0 0;font-size:15px;color:#880e4f;letter-spacing:0.12em">&#9733; &nbsp;&#10022;&nbsp; &#9733;</p>
            </td>
          </tr>
          <tr>
            <td style="padding:30px 26px 8px;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#2A1B2D;font-size:15px;line-height:1.6">
              <p style="margin:0 0 8px;font-family:Georgia,'Times New Roman',serif;font-size:26px;font-weight:700;color:#c2185b;line-height:1.25">You&apos;re officially booked!</p>
              <p style="margin:0 0 18px;font-size:16px;color:#5b3d52">Hi ${name},</p>
              <p style="margin:0 0 16px">Your deposit just landed with a little <strong style="color:#c2185b">sparkle</strong> — your party is <strong style="color:#6a1b9a">confirmed</strong>. We are so excited to help make ${child}&apos;s day unforgettable.</p>
              <p style="margin:0 0 22px;padding:12px 16px;background:#fce4ec;border-radius:12px;font-size:14px;color:#4a3544;text-align:center;border:1px dashed #f48fb1">
                <span style="font-size:18px;vertical-align:middle;color:#c9a227">&#9733;</span>
                &nbsp; <strong>${pdate}</strong>${ptimeRaw ? ` &nbsp;&middot;&nbsp; <strong>${esc(ptimeRaw)}</strong>` : ""} &nbsp; <span style="color:#7b1fa2">·</span> &nbsp; <strong>${princess}</strong>
              </p>
              ${detailsCard}
              ${balanceCallout}
              ${whatsNext}
              <p style="margin:0 0 12px">Questions, tweaks, or happy dances? Reply to this email or call us on <a href="tel:${esc(SUPPORT_PHONE_TEL)}" style="color:#c2185b;font-weight:700;text-decoration:none">${esc(SUPPORT_PHONE)}</a>.</p>
              <p style="margin:22px 0 0;padding-top:18px;border-top:1px solid #f3e5f5;font-family:Georgia,'Times New Roman',serif;font-size:17px;color:#7b1fa2;text-align:center">With sparkle and love,<br/><span style="color:#e91e63">The PrincessDream Team</span> &#10024;</p>
            </td>
          </tr>
          <tr>
            <td style="padding:0 22px 26px;text-align:center;font-size:12px;color:#88627a;line-height:1.6">
              <a href="mailto:${esc(contact)}" style="color:#ad1457;font-weight:600">${esc(contact)}</a>
              <span style="color:#ccc">&nbsp;&middot;&nbsp;</span>
              Coventry &amp; surrounding areas
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
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
  const base = emailPublicAssetsBase();
  return [
    `Hi ${pn},`,
    "",
    "You're officially booked with Princess Dream Parties — your deposit was received and your booking is CONFIRMED!",
    "",
    "Magical parties they'll never forget.",
    "",
    formatBookingDetailsPlain(booking),
    "",
    "The remaining balance is due in cash on the day of the party.",
    "If anything needs to change, reply to this email or call us.",
    "",
    "With sparkle and love,",
    "The PrincessDream Team",
    "",
    `Phone: ${SUPPORT_PHONE}`,
    `Email: ${primaryContactEmail()}`,
    `Website: ${base}`,
  ].join("\n");
}

/**
 * Sends admin + customer confirmation emails via Resend (same templates as Stripe webhook).
 *
 * @param {object} booking - booking row shape for templates
 * @param {{
 *   skipAlreadySentCheck?: boolean;
 *   idempotencyNonce?: string | null;
 *   customerToOverride?: string | null;
 *   subjectPrefix?: string | null;
 * }} [options]
 */
export async function sendBookingConfirmationEmails(booking, options = {}) {
  const {
    skipAlreadySentCheck = false,
    idempotencyNonce = null,
    customerToOverride = null,
    subjectPrefix = null,
  } = options;

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  const adminInbox = primaryContactEmail();

  if (!skipAlreadySentCheck && booking?.confirmation_emails_sent_at) {
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
  const idemSuffix = idempotencyNonce || "confirm-v1";

  const childName = escPlain(booking?.child_name) || "—";
  const partyDate = escPlain(booking?.party_date) || "—";
  const partyTime = escPlain(booking?.party_start_time) || "—";
  const prefix = subjectPrefix || "";
  const adminSubject = `${prefix}New booking: ${childName} · ${partyDate} · ${partyTime}`;
  const customerSubject = `${prefix}Your PrincessDream booking is confirmed ✨`;

  const errors = [];
  const customerTo = safeReplyTo(
    customerToOverride != null && String(customerToOverride).trim()
      ? String(customerToOverride).trim()
      : booking?.email
  );
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
        subject: customerSubject,
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
        idempotencyKey: `${idBase}-admin-${idemSuffix}`,
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
        idempotencyKey: `${idBase}-customer-${idemSuffix}`,
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
    const adminId = toAdmin?.data?.id ?? toAdmin?.data?.Id ?? null;
    const custId = toCustomer?.data?.id ?? toCustomer?.data?.Id ?? null;
    console.log(
      `Booking confirmation emails sent (booking=${booking?.id || "?"}): admin id=${adminId ?? "n/a"} → ${adminInbox}; customer id=${custId ?? "n/a"} → ${customerTo || "n/a"}`
    );
  }

  return { toAdmin, toCustomer, errors: errors.length ? errors : undefined };
}
