import { packageBySlug } from "./packages.mjs";
import { isValidPartyDate, isValidPartyTime } from "./availability.mjs";

const EMAIL_RE = /^\S+@\S+\.\S+$/;

export function buildNotes(booking) {
  const parts = [];
  const n = String(booking.numChildren || "").trim();
  if (n) parts.push(`Number of children: ${n}`);
  const s = String(booking.specialRequests || "").trim();
  if (s) parts.push(`Special requests: ${s}`);
  return parts.join("\n\n") || null;
}

export function validateBookingPayload(booking) {
  const e = [];
  if (!booking || typeof booking !== "object") {
    return { ok: false, errors: ["Invalid booking"] };
  }
  const b = booking;

  if (!String(b.parentName || "").trim()) e.push("parentName");
  if (!EMAIL_RE.test(String(b.email || "").trim())) e.push("email");
  if (!String(b.phone || "").trim() || String(b.phone).replace(/\D/g, "").length < 7)
    e.push("phone");
  if (!String(b.childName || "").trim()) e.push("childName");
  if (!String(b.childAge || "").trim()) e.push("childAge");
  if (!isValidPartyDate(String(b.partyDate || ""))) e.push("partyDate");
  if (!isValidPartyTime(String(b.partyTime || ""))) e.push("partyTime");
  if (!String(b.address || "").trim()) e.push("address");
  if (!String(b.character || "").trim()) e.push("character");
  if (!String(b.packageSlug || "").trim()) e.push("packageSlug");
  if (!packageBySlug(String(b.packageSlug || ""))) e.push("packageSlug");

  return e.length ? { ok: false, errors: e } : { ok: true };
}

export function bookingRowFromPayload(booking, pkg) {
  return {
    parent_name: String(booking.parentName).trim(),
    email: String(booking.email).trim(),
    phone: String(booking.phone).trim(),
    child_name: String(booking.childName).trim(),
    child_age: String(booking.childAge).trim(),
    party_date: String(booking.partyDate),
    party_start_time: String(booking.partyTime),
    address: String(booking.address).trim(),
    selected_character: String(booking.character).trim(),
    selected_package: String(booking.packageSlug).trim(),
    total_price: pkg.price,
    deposit_amount: pkg.depositOnline,
    remaining_balance: pkg.price - pkg.depositOnline,
    notes: buildNotes(booking),
    status: "pending",
    stripe_session_id: null,
    stripe_payment_intent_id: null,
  };
}
