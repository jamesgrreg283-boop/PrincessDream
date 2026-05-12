import { Resend } from "resend";
import { characterLabel } from "./characters.mjs";
import { packageBySlug } from "./packages.mjs";

function esc(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function row(label, value) {
  return `<tr><td style="padding:6px 14px 6px 0;font-weight:600;vertical-align:top;white-space:nowrap">${esc(label)}</td><td style="padding:6px 0">${value}</td></tr>`;
}

/** Full detail table for admin + customer (HTML). */
function formatBookingDetailsTable(row) {
  const pkg = packageBySlug(row.selected_package);
  const pkgName = pkg ? `${pkg.name} (${row.selected_package})` : row.selected_package;
  const princess = characterLabel(row.selected_character);
  const notes = row.notes?.trim() ? esc(row.notes) : "—";

  return `
  <table style="border-collapse:collapse;font-family:system-ui,-apple-system,sans-serif;font-size:14px;color:#2A1B2D;max-width:560px">
    ${row("Parent name", esc(row.parent_name))}
    ${row("Email", esc(row.email))}
    ${row("Phone", esc(row.phone))}
    ${row("Child's name", esc(row.child_name))}
    ${row("Child's age", esc(row.child_age))}
    ${row("Party date", esc(row.party_date))}
    ${row("Start time", esc(row.party_start_time))}
    ${row("Address", esc(row.address))}
    ${row("Chosen princess", esc(princess))}
    ${row("Package", esc(pkgName))}
    ${row("Total price", `£${row.total_price}`)}
    ${row("Deposit paid", `£${row.deposit_amount}`)}
    ${row("Balance due on the day", `£${row.remaining_balance}`)}
    ${row("Notes / special requests", notes)}
  </table>`;
}

function formatAdminNotificationHtml(row) {
  return `
  <p style="font-family:system-ui,sans-serif;font-size:15px;color:#2A1B2D">A booking was just marked <strong>confirmed</strong> after a successful Stripe deposit.</p>
  ${formatBookingDetailsTable(row)}`;
}

function formatCustomerConfirmationHtml(row) {
  return `
  <p style="font-family:system-ui,sans-serif;font-size:15px;color:#2A1B2D">Hi ${esc(row.parent_name)},</p>
  <p style="font-family:system-ui,sans-serif;font-size:15px;color:#2A1B2D">Thank you — your deposit payment was received and your booking is <strong>confirmed</strong>.</p>
  <p style="font-family:system-ui,sans-serif;font-size:15px;color:#2A1B2D">Here are your details:</p>
  ${formatBookingDetailsTable(row)}
  <p style="font-family:system-ui,sans-serif;font-size:15px;color:#2A1B2D;margin-top:1rem">The remaining balance shown above is due in <strong>cash on the day</strong> of the party.</p>
  <p style="font-family:system-ui,sans-serif;font-size:15px;color:#2A1B2D">If anything needs to change, just reply to this email or call us.</p>
  <p style="font-family:system-ui,sans-serif;font-size:15px;color:#2A1B2D">— PrincessDream ✨</p>`;
}

/**
 * Sends admin + customer confirmation emails via Resend.
 * Intended only after a booking is confirmed (e.g. Stripe webhook after paid checkout).
 */
export async function sendBookingConfirmationEmails(row) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  const adminInbox =
    process.env.ADMIN_BOOKING_EMAIL?.trim() ||
    process.env.NOTIFY_EMAIL_TO?.trim() ||
    "princessdreamuk@gmail.com";

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
  const adminSubject = "New Princess Dream Booking Confirmed";

  const [toAdmin, toCustomer] = await Promise.all([
    resend.emails.send({
      from,
      to: adminInbox,
      subject: adminSubject,
      html: formatAdminNotificationHtml(row),
    }),
    resend.emails.send({
      from,
      to: row.email,
      subject: "Your PrincessDream booking is confirmed ✨",
      html: formatCustomerConfirmationHtml(row),
    }),
  ]);

  const errors = [];
  if (toAdmin.error) {
    console.error("Resend admin booking email failed:", JSON.stringify(toAdmin.error));
    errors.push({ target: "admin", error: toAdmin.error });
  }
  if (toCustomer.error) {
    console.error("Resend customer email failed:", JSON.stringify(toCustomer.error));
    errors.push({ target: "customer", error: toCustomer.error });
  }

  if (errors.length) {
    console.error(
      `Resend: admin→${adminInbox}, customer→${row.email}, from=${from}. Fix domain verification or API key in Resend dashboard.`
    );
  } else {
    console.log(
      `Booking confirmation emails sent (admin ${adminInbox}, customer ${row.email})`
    );
  }

  return { toAdmin, toCustomer, errors: errors.length ? errors : undefined };
}
