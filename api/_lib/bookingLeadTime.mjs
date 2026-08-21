/**
 * Mirror of `src/data/bookingLeadTime.ts` — keep in sync.
 * Public bookings require at least this many calendar days' notice.
 */

export const MIN_BOOKING_LEAD_DAYS = 21;

export function ukDateISO(now = new Date()) {
  return now.toLocaleDateString("en-CA", { timeZone: "Europe/London" });
}

/** Earliest party date (YYYY-MM-DD) customers may book online. */
export function earliestBookableDateISO(now = new Date()) {
  const today = ukDateISO(now);
  const [y, m, d] = today.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + MIN_BOOKING_LEAD_DAYS);
  const yy = dt.getUTCFullYear();
  const mm = String(dt.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(dt.getUTCDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

export function isPartyDateTooSoon(partyDateISO, now = new Date()) {
  if (!partyDateISO || typeof partyDateISO !== "string") return true;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(partyDateISO)) return true;
  return partyDateISO < earliestBookableDateISO(now);
}

export const BOOKING_LEAD_TIME_MESSAGE = `Parties and appearances must be booked at least ${MIN_BOOKING_LEAD_DAYS} days (3 weeks) in advance. Please choose a later date.`;
