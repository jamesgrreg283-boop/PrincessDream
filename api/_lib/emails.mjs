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

function formatBookingHtml(row) {
  const pkg = packageBySlug(row.selected_package);
  const pkgName = pkg?.name ?? row.selected_package;
  const char = characterLabel(row.selected_character);
  return `
  <h1>New booking</h1>
  <table style="border-collapse:collapse;font-family:system-ui,sans-serif;font-size:14px">
    <tr><td style="padding:4px 12px 4px 0;font-weight:600">Parent</td><td>${esc(row.parent_name)}</td></tr>
    <tr><td style="padding:4px 12px 4px 0;font-weight:600">Email</td><td>${esc(row.email)}</td></tr>
    <tr><td style="padding:4px 12px 4px 0;font-weight:600">Phone</td><td>${esc(row.phone)}</td></tr>
    <tr><td style="padding:4px 12px 4px 0;font-weight:600">Child</td><td>${esc(row.child_name)} (${esc(row.child_age)})</td></tr>
    <tr><td style="padding:4px 12px 4px 0;font-weight:600">Date</td><td>${esc(row.party_date)}</td></tr>
    <tr><td style="padding:4px 12px 4px 0;font-weight:600">Start time</td><td>${esc(row.party_start_time)}</td></tr>
    <tr><td style="padding:4px 12px 4px 0;font-weight:600">Address</td><td>${esc(row.address)}</td></tr>
    <tr><td style="padding:4px 12px 4px 0;font-weight:600">Princess</td><td>${esc(char)}</td></tr>
    <tr><td style="padding:4px 12px 4px 0;font-weight:600">Package</td><td>${esc(pkgName)}</td></tr>
    <tr><td style="padding:4px 12px 4px 0;font-weight:600">Total</td><td>£${row.total_price}</td></tr>
    <tr><td style="padding:4px 12px 4px 0;font-weight:600">Deposit paid</td><td>£${row.deposit_amount}</td></tr>
    <tr><td style="padding:4px 12px 4px 0;font-weight:600">Balance</td><td>£${row.remaining_balance}</td></tr>
    <tr><td style="padding:4px 12px 4px 0;font-weight:600;vertical-align:top">Notes</td><td>${esc(row.notes || "—")}</td></tr>
    <tr><td style="padding:4px 12px 4px 0;font-weight:600">Status</td><td>${esc(row.status)}</td></tr>
  </table>`;
}

function formatCustomerHtml(row) {
  const pkg = packageBySlug(row.selected_package);
  const pkgName = pkg?.name ?? row.selected_package;
  const char = characterLabel(row.selected_character);
  return `
  <p style="font-family:system-ui,sans-serif;font-size:15px">Hi ${esc(row.parent_name)},</p>
  <p style="font-family:system-ui,sans-serif;font-size:15px">Thank you — your deposit payment was received and your booking is <strong>confirmed</strong>.</p>
  <p style="font-family:system-ui,sans-serif;font-size:15px"><strong>Party date:</strong> ${esc(row.party_date)} at ${esc(row.party_start_time)}<br/>
  <strong>Princess:</strong> ${esc(char)}<br/>
  <strong>Package:</strong> ${esc(pkgName)}<br/>
  <strong>Address:</strong> ${esc(row.address)}</p>
  <p style="font-family:system-ui,sans-serif;font-size:15px">Remaining balance of <strong>£${row.remaining_balance}</strong> is due in cash on the day.</p>
  <p style="font-family:system-ui,sans-serif;font-size:15px">If anything needs to change, just reply to this email or call us.</p>
  <p style="font-family:system-ui,sans-serif;font-size:15px">— PrincessDream ✨</p>`;
}

export async function sendBookingConfirmationEmails(row) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  const notifyTo = process.env.NOTIFY_EMAIL_TO || "princessdreamuk@gmail.com";

  if (!apiKey || !from) {
    console.warn("RESEND_API_KEY or RESEND_FROM_EMAIL missing — skipping emails");
    return { skipped: true };
  }

  const resend = new Resend(apiKey);
  const subject = `Booking confirmed — ${row.party_date} (${row.party_start_time})`;

  const [toTeam, toCustomer] = await Promise.all([
    resend.emails.send({
      from,
      to: notifyTo,
      subject: `[PrincessDream] ${subject}`,
      html: formatBookingHtml(row),
    }),
    resend.emails.send({
      from,
      to: row.email,
      subject: `Your PrincessDream booking is confirmed ✨`,
      html: formatCustomerHtml(row),
    }),
  ]);

  if (toTeam.error) console.error("Resend team email:", toTeam.error);
  if (toCustomer.error) console.error("Resend customer email:", toCustomer.error);

  return { toTeam, toCustomer };
}
