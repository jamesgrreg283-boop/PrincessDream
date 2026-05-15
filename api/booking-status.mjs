import { getSupabaseAdmin } from "./_lib/supabase.mjs";
import {
  applyCors,
  getRequestOrigin,
  handleOptions,
  isAllowedFrontendOrigin,
} from "./_lib/cors.mjs";

export default async function handler(req, res) {
  const requestOrigin = getRequestOrigin(req) || String(req.headers.origin || "").trim();
  if (handleOptions(req, res)) return;
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  if (!isAllowedFrontendOrigin(requestOrigin)) {
    return res.status(403).json({ error: "Origin not allowed" });
  }
  applyCors(res, requestOrigin);

  const sessionId = String(req.query?.session_id || "").trim();
  if (!sessionId.startsWith("cs_")) {
    return res.status(400).json({ error: "Invalid session" });
  }

  let supabase;
  try {
    supabase = getSupabaseAdmin();
  } catch (e) {
    if (e?.code === "NO_SUPABASE") {
      return res.status(503).json({ error: "Not configured" });
    }
    throw e;
  }

  const { data, error } = await supabase
    .from("bookings")
    .select("id, status, party_date, party_start_time")
    .eq("stripe_session_id", sessionId)
    .maybeSingle();

  if (error) {
    console.error(error);
    return res.status(500).json({ error: "Lookup failed" });
  }
  if (!data) {
    return res.status(200).json({ status: "unknown" });
  }

  return res.status(200).json({
    status: data.status,
    bookingId: data.id,
    partyDate: data.party_date,
    partyTime: data.party_start_time,
  });
}
