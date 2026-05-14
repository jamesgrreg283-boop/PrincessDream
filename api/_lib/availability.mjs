import { durationMinutesForPackageSlug } from "./packages.mjs";

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

/** 9:00–16:00 inclusive, 15-minute steps (matches Book.tsx). */
export const PARTY_GRID_TIMES = (() => {
  const out = [];
  for (let m = 9 * 60; m <= 16 * 60; m += 15) {
    const h24 = Math.floor(m / 60);
    const min = m % 60;
    out.push(`${String(h24).padStart(2, "0")}:${String(min).padStart(2, "0")}`);
  }
  return out;
})();

export function isValidPartyDate(iso) {
  if (!iso || typeof iso !== "string") return false;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return false;
  const [y, mo, d] = iso.split("-").map(Number);
  const dt = new Date(y, mo - 1, d);
  return dt.getFullYear() === y && dt.getMonth() === mo - 1 && dt.getDate() === d;
}

export function isValidPartyTime(t) {
  return typeof t === "string" && TIME_RE.test(t);
}

export function partyTimeToMinutes(t) {
  const [h, m] = String(t).split(":").map(Number);
  return h * 60 + m;
}

/** Travel / turnaround gap (minutes) after one party ends before another can start (same day). */
export function travelBufferMinutes() {
  const n = Number(process.env.BOOKING_TRAVEL_BUFFER_MINUTES ?? 60);
  if (!Number.isFinite(n)) return 60;
  return Math.max(0, Math.min(180, Math.round(n)));
}

/** Rows blocking the slot: confirmed, or pending with active hold. */
export function rowBlocksSlot(row, now = new Date()) {
  if (row.status === "confirmed") return true;
  if (row.status === "pending") {
    if (!row.hold_expires_at) return true;
    return new Date(row.hold_expires_at) > now;
  }
  return false;
}

/**
 * True if two parties on the same calendar day cannot both run (includes travel buffer).
 * Uses discrete start times + durations in minutes from midnight.
 */
export function partyIntervalsConflict(startA, durA, startB, durB, buf) {
  return !(
    startB >= startA + durA + buf ||
    startA >= startB + durB + buf
  );
}

export async function fetchBookingsForDate(supabase, partyDate) {
  const { data, error } = await supabase
    .from("bookings")
    .select("party_start_time, status, hold_expires_at, selected_package")
    .eq("party_date", partyDate);

  if (error) throw error;
  return data ?? [];
}

/** True if this block row covers `calendarDate` (YYYY-MM-DD). */
export function blockRowCoversCalendarDate(row, calendarDate) {
  const startD = String(row.party_date ?? "");
  const endD = String(row.party_end_date ?? row.party_date ?? startD);
  return calendarDate >= startD && calendarDate <= endD;
}

/**
 * Party grid start times (HH:MM) blocked by one row on a given calendar day.
 * Empty if the row does not apply to that day.
 */
export function blockedStartTimesForRowOnDate(row, calendarDate) {
  if (!blockRowCoversCalendarDate(row, calendarDate)) return [];
  if (!isValidPartyTime(row.party_start_time)) return [];
  const startM = partyTimeToMinutes(row.party_start_time);
  const endT = row.party_end_time;
  const multiDay =
    row.party_end_date != null && String(row.party_end_date) > String(row.party_date);

  if ((!endT || !isValidPartyTime(endT) || endT === row.party_start_time) && multiDay) {
    const endM = partyTimeToMinutes("16:00");
    const out = [];
    for (const t of PARTY_GRID_TIMES) {
      const m = partyTimeToMinutes(t);
      if (m >= startM && m <= endM) out.push(t);
    }
    return out;
  }
  if (!endT || !isValidPartyTime(endT) || endT === row.party_start_time) {
    return [row.party_start_time];
  }
  const endM = partyTimeToMinutes(endT);
  if (endM < startM) return [];
  const out = [];
  for (const t of PARTY_GRID_TIMES) {
    const m = partyTimeToMinutes(t);
    if (m >= startM && m <= endM) out.push(t);
  }
  return out;
}

/** Admin blocks (holidays / holds) — optional table until migration applied. */
export async function fetchBlockedTimesForDate(supabase, partyDate) {
  // Use * so older DBs without party_end_date / party_end_time (migration not applied) still work.
  const { data, error } = await supabase.from("blocked_slots").select("*").limit(2000);

  if (error) {
    console.warn("blocked_slots query:", error.message || error);
    return [];
  }

  const set = new Set();
  for (const r of data ?? []) {
    for (const t of blockedStartTimesForRowOnDate(r, partyDate)) {
      set.add(t);
    }
  }
  return [...set];
}

function blockingRows(rows, now = new Date()) {
  return rows.filter((r) => rowBlocksSlot(r, now));
}

/**
 * @param {string} candidateTime "HH:MM"
 * @param {string} candidatePackageSlug
 * @param {Array<{party_start_time:string,status:string,hold_expires_at?:string|null,selected_package:string}>} rows
 * @param {Set<string>|string[]} blockedExactStarts admin-disabled start times only (exact match)
 */
export function candidateConflictsBookings(
  candidateTime,
  candidatePackageSlug,
  rows,
  blockedExactStarts,
  buf = travelBufferMinutes()
) {
  if (!isValidPartyTime(candidateTime)) return true;
  const blocked = new Set(
    Array.isArray(blockedExactStarts) ? blockedExactStarts : [...blockedExactStarts]
  );
  if (blocked.has(candidateTime)) return true;

  const s0 = partyTimeToMinutes(candidateTime);
  const d0 = durationMinutesForPackageSlug(candidatePackageSlug);

  for (const row of rows) {
    const s1 = partyTimeToMinutes(row.party_start_time);
    const d1 = durationMinutesForPackageSlug(row.selected_package);
    if (partyIntervalsConflict(s0, d0, s1, d1, buf)) return true;
  }
  return false;
}

/**
 * Start times unavailable for this package on this date (for the booking grid).
 * @param {string} packageSlug — when omitted, uses longest package so the list is conservative.
 */
export async function getOccupiedTimesForDate(
  supabase,
  partyDate,
  packageSlug = "2-hour-party"
) {
  const [rows, blockedTimes] = await Promise.all([
    fetchBookingsForDate(supabase, partyDate),
    fetchBlockedTimesForDate(supabase, partyDate),
  ]);

  const active = blockingRows(rows);
  const occupied = [];
  for (const t of PARTY_GRID_TIMES) {
    if (candidateConflictsBookings(t, packageSlug, active, blockedTimes)) {
      occupied.push(t);
    }
  }
  return occupied;
}

export async function isSlotAvailable(
  supabase,
  partyDate,
  partyStartTime,
  packageSlug = "2-hour-party"
) {
  const [rows, blockedTimes] = await Promise.all([
    fetchBookingsForDate(supabase, partyDate),
    fetchBlockedTimesForDate(supabase, partyDate),
  ]);
  return !candidateConflictsBookings(
    partyStartTime,
    packageSlug,
    blockingRows(rows),
    blockedTimes
  );
}
