import { getSupabaseAdmin } from "./_lib/supabase.mjs";
import {
  applyCors,
  handleOptions,
  isAllowedFrontendOrigin,
} from "./_lib/cors.mjs";
import {
  getOccupiedTimesForDate,
  isSlotAvailable,
  isValidPartyDate,
  isValidPartyTime,
} from "./_lib/availability.mjs";

export default async function handler(req, res) {
  const requestOrigin = req.headers.origin || "";
  if (handleOptions(req, res)) return;
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  if (!isAllowedFrontendOrigin(requestOrigin)) {
    return res.status(403).json({ error: "Origin not allowed" });
  }
  applyCors(res, requestOrigin);

  let supabase;
  try {
    supabase = getSupabaseAdmin();
  } catch (e) {
    if (e?.code === "NO_SUPABASE") {
      return res.status(503).json({ error: "Availability check is not configured" });
    }
    throw e;
  }

  const date = String(req.query?.date || "").trim();
  const time = String(req.query?.time || "").trim();

  if (!isValidPartyDate(date)) {
    return res.status(400).json({ error: "Invalid or missing date" });
  }

  try {
    if (time) {
      if (!isValidPartyTime(time)) {
        return res.status(400).json({ error: "Invalid time" });
      }
      const available = await isSlotAvailable(supabase, date, time);
      return res.status(200).json({ available, partyDate: date, partyTime: time });
    }

    const occupiedTimes = await getOccupiedTimesForDate(supabase, date);
    return res.status(200).json({ occupiedTimes, partyDate: date });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Could not check availability" });
  }
}
