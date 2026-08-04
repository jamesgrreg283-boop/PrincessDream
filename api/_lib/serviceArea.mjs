/**
 * Service-area checks for party postcodes (server).
 * Mirrors src/lib/serviceArea.ts — keep districts in sync.
 * Base: 184a Armscott Road, Coventry (~40 min drive radius).
 */

const COVERED_DISTRICTS = new Set([
  "CV1",
  "CV2",
  "CV3",
  "CV4",
  "CV5",
  "CV6",
  "CV7",
  "CV8",
  "CV10",
  "CV11",
  "CV12",
  "CV31",
  "CV32",
  "CV33",
  "CV34",
  "CV35",
  "CV47",
]);

export const OUT_OF_AREA_MESSAGE =
  "Sorry, we don't cover this area. We only take parties within about 40 minutes of Coventry (including Bedworth, Nuneaton, Leamington Spa, Southam and Warwick).";

const UK_POSTCODE_RE = /^([A-Z]{1,2}\d[A-Z\d]?)\s*(\d[A-Z]{2})$/i;

export function normalisePostcode(raw) {
  const compact = String(raw || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "");
  const m = UK_POSTCODE_RE.exec(compact);
  if (!m) return String(raw || "").trim().toUpperCase();
  return `${m[1]} ${m[2]}`;
}

export function isValidUkPostcodeFormat(raw) {
  const compact = String(raw || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "");
  return UK_POSTCODE_RE.test(compact);
}

export function isPostcodeInServiceArea(raw) {
  if (!isValidUkPostcodeFormat(raw)) return false;
  const m = UK_POSTCODE_RE.exec(
    String(raw).trim().toUpperCase().replace(/\s+/g, "")
  );
  return m ? COVERED_DISTRICTS.has(m[1]) : false;
}

export function checkServicePostcode(raw) {
  const trimmed = String(raw || "").trim();
  if (!trimmed) {
    return { ok: false, error: "Please enter the party postcode" };
  }
  if (!isValidUkPostcodeFormat(trimmed)) {
    return { ok: false, error: "Please enter a valid UK postcode" };
  }
  const normalised = normalisePostcode(trimmed);
  if (!isPostcodeInServiceArea(normalised)) {
    return { ok: false, error: OUT_OF_AREA_MESSAGE };
  }
  return { ok: true, normalised };
}
