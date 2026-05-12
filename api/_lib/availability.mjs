const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

export function isValidPartyDate(iso) {
  if (!iso || typeof iso !== "string") return false;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return false;
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  return dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d;
}

export function isValidPartyTime(t) {
  return typeof t === "string" && TIME_RE.test(t);
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

export async function fetchBookingsForDate(supabase, partyDate) {
  const { data, error } = await supabase
    .from("bookings")
    .select("party_start_time, status, hold_expires_at")
    .eq("party_date", partyDate);

  if (error) throw error;
  return data ?? [];
}

/** Admin blocks (e.g. Instagram holds) — table optional until migration applied. */
export async function fetchBlockedTimesForDate(supabase, partyDate) {
  const { data, error } = await supabase
    .from("blocked_slots")
    .select("party_start_time")
    .eq("party_date", partyDate);

  if (error) {
    console.warn("blocked_slots query:", error.message || error);
    return [];
  }
  return (data ?? []).map((r) => r.party_start_time);
}

export async function getOccupiedTimesForDate(supabase, partyDate) {
  const [rows, blockedTimes] = await Promise.all([
    fetchBookingsForDate(supabase, partyDate),
    fetchBlockedTimesForDate(supabase, partyDate),
  ]);

  const set = new Set(blockedTimes);
  for (const row of rows) {
    if (rowBlocksSlot(row)) set.add(row.party_start_time);
  }
  return [...set];
}

export async function isSlotAvailable(supabase, partyDate, partyStartTime) {
  const occupied = await getOccupiedTimesForDate(supabase, partyDate);
  return !occupied.includes(partyStartTime);
}
