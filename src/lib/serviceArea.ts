/**
 * Service-area checks for party postcodes.
 * Base: 184a Armscott Road, Coventry — we cover towns within ~40 minutes' drive
 * (Coventry, Bedworth, Nuneaton, Leamington Spa, Southam, Warwick, Kenilworth).
 */

/** Outward codes (districts) we accept — roughly ≤40 min from Armscott Road / CV2. */
const COVERED_DISTRICTS = new Set([
  // Coventry
  "CV1",
  "CV2",
  "CV3",
  "CV4",
  "CV5",
  "CV6",
  "CV7",
  // Kenilworth (within radius)
  "CV8",
  // Nuneaton
  "CV10",
  "CV11",
  // Bedworth
  "CV12",
  // Leamington Spa
  "CV31",
  "CV32",
  "CV33",
  // Warwick
  "CV34",
  "CV35",
  // Southam
  "CV47",
]);

export const OUT_OF_AREA_MESSAGE =
  "Sorry, we don't cover this area. We only take parties within about 40 minutes of Coventry (including Bedworth, Nuneaton, Leamington Spa, Southam and Warwick).";

/** Matches a full UK postcode (optional space). */
const UK_POSTCODE_RE = /^([A-Z]{1,2}\d[A-Z\d]?)\s*(\d[A-Z]{2})$/i;

export function normalisePostcode(raw: string): string {
  const compact = String(raw || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "");
  const m = UK_POSTCODE_RE.exec(compact);
  if (!m) return String(raw || "").trim().toUpperCase();
  return `${m[1]} ${m[2]}`;
}

export function isValidUkPostcodeFormat(raw: string): boolean {
  const compact = String(raw || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "");
  return UK_POSTCODE_RE.test(compact);
}

export function postcodeDistrict(raw: string): string | null {
  if (!isValidUkPostcodeFormat(raw)) return null;
  const m = UK_POSTCODE_RE.exec(
    String(raw).trim().toUpperCase().replace(/\s+/g, "")
  );
  return m ? m[1] : null;
}

export function isPostcodeInServiceArea(raw: string): boolean {
  const district = postcodeDistrict(raw);
  if (!district) return false;
  return COVERED_DISTRICTS.has(district);
}

export type PostcodeCheck =
  | { ok: true; normalised: string }
  | { ok: false; error: string };

export function checkServicePostcode(raw: string): PostcodeCheck {
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
