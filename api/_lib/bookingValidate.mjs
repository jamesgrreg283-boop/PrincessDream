import { packageBySlug } from "./packages.mjs";
import { isValidPartyDate, isValidPartyTime } from "./availability.mjs";
import { checkServicePostcode, normalisePostcode } from "./serviceArea.mjs";

const EMAIL_RE = /^\S+@\S+\.\S+$/;

const OCCASION_LABELS = {
  child_birthday: "Child's birthday party",
  family_celebration: "Family celebration",
  corporate_school: "School, nursery, or corporate event",
  other: "Other occasion",
};

const ALLOWED_OCCASIONS = new Set(Object.keys(OCCASION_LABELS));

/** Bookable character slugs — keep in sync with src/data/characters.ts */
const ALLOWED_CHARACTERS = new Set([
  "glass-slipper-princess",
  "belle",
  "rapunzel",
  "ariel",
  "elsa",
  "anna",
  "fairy-sparkles",
  "surprise",
]);

function occasionLine(booking) {
  const t = String(booking.occasionType || "child_birthday");
  const label = OCCASION_LABELS[t] || t;
  return `Occasion: ${label}`;
}

export function buildNotes(booking) {
  const parts = [occasionLine(booking)];
  const n = String(booking.numChildren || "").trim();
  if (n) parts.push(`Number of children: ${n}`);
  const s = String(booking.specialRequests || "").trim();
  if (s) parts.push(`Special requests: ${s}`);
  return parts.join("\n\n") || null;
}

function resolvePostcode(booking) {
  const fromField = String(booking.postcode || "").trim();
  if (fromField) return fromField;
  const address = String(booking.address || "");
  const m = address
    .toUpperCase()
    .match(/\b([A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2})\b/);
  return m ? m[1] : "";
}

export function validateBookingPayload(booking) {
  const e = [];
  if (!booking || typeof booking !== "object") {
    return { ok: false, errors: ["Invalid booking"] };
  }
  const b = booking;

  const occasionType = String(b.occasionType || "child_birthday");
  if (!ALLOWED_OCCASIONS.has(occasionType)) e.push("occasionType");

  if (!String(b.parentName || "").trim()) e.push("parentName");
  if (!EMAIL_RE.test(String(b.email || "").trim())) e.push("email");
  if (!String(b.phone || "").trim() || String(b.phone).replace(/\D/g, "").length < 7)
    e.push("phone");
  if (!String(b.childName || "").trim()) e.push("childName");
  if (occasionType === "child_birthday" && !String(b.childAge || "").trim())
    e.push("childAge");
  if (!isValidPartyDate(String(b.partyDate || ""))) e.push("partyDate");
  if (!isValidPartyTime(String(b.partyTime || ""))) e.push("partyTime");
  if (!String(b.address || "").trim()) e.push("address");

  const postcodeCheck = checkServicePostcode(resolvePostcode(b));
  if (!postcodeCheck.ok) e.push("postcode");

  const character = String(b.character || "").trim().toLowerCase();
  if (!character || !ALLOWED_CHARACTERS.has(character)) e.push("character");
  if (!String(b.packageSlug || "").trim()) e.push("packageSlug");
  if (!packageBySlug(String(b.packageSlug || ""))) e.push("packageSlug");

  return e.length ? { ok: false, errors: e } : { ok: true };
}

export function bookingRowFromPayload(booking, pkg) {
  const ageTrim = String(booking.childAge || "").trim();
  let address = String(booking.address).trim();
  const pc = resolvePostcode(booking);
  if (pc && checkServicePostcode(pc).ok) {
    const normalised = normalisePostcode(pc);
    const upper = address.toUpperCase().replace(/\s+/g, "");
    const compactPc = normalised.replace(/\s+/g, "");
    if (!upper.includes(compactPc)) {
      address = `${address}, ${normalised}`;
    }
  }
  return {
    parent_name: String(booking.parentName).trim(),
    email: String(booking.email).trim(),
    phone: String(booking.phone).trim(),
    child_name: String(booking.childName).trim(),
    child_age: ageTrim || "—",
    party_date: String(booking.partyDate),
    party_start_time: String(booking.partyTime),
    address,
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
