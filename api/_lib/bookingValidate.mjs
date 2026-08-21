import { packageBySlug } from "./packages.mjs";
import { isValidPartyDate, isValidPartyTime } from "./availability.mjs";
import { checkServicePostcode } from "./serviceArea.mjs";
import {
  augustPromoRemaining,
  augustPromoTotal,
  isAugustOfferActive,
} from "./augustOffer.mjs";
import {
  extraPrincessFee,
  extraPrincessRequired,
  parseChildCount,
} from "./extraPrincess.mjs";
import { isPartyDateTooSoon } from "./bookingLeadTime.mjs";

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
  if (isAugustOfferActive()) {
    parts.push(
      "August offer: 15% off package total applied to cash balance on the day (online deposit unchanged)."
    );
  }
  const n = String(booking.numChildren || "").trim();
  if (n) parts.push(`Number of children: ${n}`);
  const extra = String(booking.extraCharacter || "").trim();
  if (extra) {
    parts.push(`Extra princess: ${extra} (£${extraPrincessFee(extra)} on the day)`);
  }
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

/**
 * @param {object} booking
 * @param {{ skipLeadTime?: boolean }} [opts] Admin manual entries may skip the 3-week rule.
 */
export function validateBookingPayload(booking, opts = {}) {
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
  else if (!opts.skipLeadTime && isPartyDateTooSoon(String(b.partyDate))) {
    e.push("partyDateLeadTime");
  }
  if (!isValidPartyTime(String(b.partyTime || ""))) e.push("partyTime");
  if (!String(b.address || "").trim()) e.push("address");

  const postcodeCheck = checkServicePostcode(resolvePostcode(b));
  if (!postcodeCheck.ok) e.push("postcode");

  const character = String(b.character || "").trim().toLowerCase();
  if (!character || !ALLOWED_CHARACTERS.has(character)) e.push("character");

  const extraCharacter = String(b.extraCharacter || "").trim().toLowerCase();
  if (extraCharacter && !ALLOWED_CHARACTERS.has(extraCharacter)) e.push("extraCharacter");
  if (extraCharacter && extraCharacter === character) e.push("extraCharacter");
  if (extraPrincessRequired(b.numChildren) && !extraCharacter) e.push("extraCharacter");

  if (!String(b.packageSlug || "").trim()) e.push("packageSlug");
  if (!packageBySlug(String(b.packageSlug || ""))) e.push("packageSlug");

  return e.length ? { ok: false, errors: e } : { ok: true };
}

export function bookingRowFromPayload(booking, pkg) {
  const ageTrim = String(booking.childAge || "").trim();
  const postcodeCheck = checkServicePostcode(resolvePostcode(booking));
  const normalisedPostcode = postcodeCheck.ok ? postcodeCheck.normalised : "";

  // Street line only in address; postcode stored in its own column.
  let address = String(booking.address || "").trim();
  if (normalisedPostcode) {
    const compactPc = normalisedPostcode.replace(/\s+/g, "");
    // Strip a trailing postcode if the client still appended it.
    const stripped = address
      .replace(new RegExp(`,?\\s*${normalisedPostcode.replace(/\s+/g, "\\s*")}\\s*$`, "i"), "")
      .replace(new RegExp(`,?\\s*${compactPc}\\s*$`, "i"), "")
      .trim();
    if (stripped) address = stripped;
  }

  const extraCharacter = String(booking.extraCharacter || "").trim().toLowerCase();
  const extraFee = extraPrincessFee(extraCharacter);
  const deposit = Number(pkg.depositOnline) || 0;
  const packageTotal = isAugustOfferActive() ? augustPromoTotal(pkg) : Number(pkg.price) || 0;
  const packageRemaining = isAugustOfferActive()
    ? augustPromoRemaining(pkg)
    : Math.max(0, packageTotal - deposit);
  const total = packageTotal + extraFee;
  const remaining = packageRemaining + extraFee;
  const kids = parseChildCount(booking.numChildren);

  return {
    parent_name: String(booking.parentName).trim(),
    email: String(booking.email).trim(),
    phone: String(booking.phone).trim(),
    child_name: String(booking.childName).trim(),
    child_age: ageTrim || "—",
    party_date: String(booking.partyDate),
    party_start_time: String(booking.partyTime),
    address,
    postcode: normalisedPostcode || null,
    selected_character: String(booking.character).trim(),
    extra_character: extraCharacter || null,
    num_children: kids,
    selected_package: String(booking.packageSlug).trim(),
    total_price: total,
    deposit_amount: deposit,
    remaining_balance: remaining,
    notes: buildNotes(booking),
    status: "pending",
    stripe_session_id: null,
    stripe_payment_intent_id: null,
  };
}
