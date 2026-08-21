/**
 * Public bookings require at least this many calendar days' notice.
 * Keep in sync with `api/_lib/bookingLeadTime.mjs`.
 */
export const MIN_BOOKING_LEAD_DAYS = 21;

/** UK calendar date as YYYY-MM-DD. */
export function ukDateISO(now = new Date()): string {
  return now.toLocaleDateString("en-CA", { timeZone: "Europe/London" });
}

/** Earliest party date (YYYY-MM-DD) customers may book online. */
export function earliestBookableDateISO(now = new Date()): string {
  const today = ukDateISO(now);
  const [y, m, d] = today.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + MIN_BOOKING_LEAD_DAYS);
  const yy = dt.getUTCFullYear();
  const mm = String(dt.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(dt.getUTCDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

export function isPartyDateTooSoon(partyDateISO: string, now = new Date()): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(partyDateISO)) return true;
  return partyDateISO < earliestBookableDateISO(now);
}

export const BOOKING_LEAD_TIME_MESSAGE =
  `Parties and appearances must be booked at least ${MIN_BOOKING_LEAD_DAYS} days (3 weeks) in advance. Please choose a later date.`;
