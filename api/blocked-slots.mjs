import { assertAdmin } from "./_lib/authAdmin.mjs";
import { getSupabaseAdmin } from "./_lib/supabase.mjs";
import {
  applyCorsCredentials,
  getRequestOrigin,
  handleOptionsCredentials,
  isAllowedFrontendOrigin,
} from "./_lib/cors.mjs";
import {
  isValidPartyDate,
  isValidPartyTime,
  partyTimeToMinutes,
} from "./_lib/availability.mjs";

function parseBody(req) {
  const b = req.body;
  if (b && typeof b === "object" && !Buffer.isBuffer(b)) return b;
  if (typeof b === "string" && b.length > 0) {
    try {
      return JSON.parse(b);
    } catch {
      return null;
    }
  }
  return null;
}

export default async function handler(req, res) {
  const origin = getRequestOrigin(req);
  if (handleOptionsCredentials(req, res)) return;

  if (!origin || !isAllowedFrontendOrigin(origin)) {
    return res.status(403).json({ error: "Origin not allowed" });
  }
  applyCorsCredentials(res, origin);

  try {
    assertAdmin(req);
  } catch (e) {
    return res.status(e.statusCode || 401).json({ error: e.message });
  }

  let supabase;
  try {
    supabase = getSupabaseAdmin();
  } catch (e) {
    if (e?.code === "NO_SUPABASE") {
      return res.status(500).json({ error: "Database is not configured" });
    }
    throw e;
  }

  if (req.method === "GET") {
    const { data, error } = await supabase
      .from("blocked_slots")
      .select("*")
      .order("party_date", { ascending: true })
      .order("party_start_time", { ascending: true })
      .limit(500);

    if (error) {
      console.error(error);
      return res.status(500).json({ error: "Could not load blocks" });
    }
    return res.status(200).json({ blocks: data ?? [] });
  }

  if (req.method === "POST") {
    const body = parseBody(req);
    const partyDate = String(body?.partyDate ?? body?.party_date ?? "").trim();
    const partyEndDateRaw = String(
      body?.partyEndDate ?? body?.party_end_date ?? ""
    ).trim();
    const partyTime = String(body?.partyTime ?? body?.party_start_time ?? "").trim();
    const partyEndTimeRaw = String(
      body?.partyEndTime ?? body?.party_end_time ?? ""
    ).trim();
    const notes = body?.notes != null ? String(body.notes).trim() : null;

    if (!isValidPartyDate(partyDate) || !isValidPartyTime(partyTime)) {
      return res.status(400).json({ error: "Invalid start date or start time" });
    }

    const partyEndDate =
      partyEndDateRaw && isValidPartyDate(partyEndDateRaw) ? partyEndDateRaw : null;
    if (partyEndDate && partyEndDate < partyDate) {
      return res.status(400).json({ error: "End date must be on or after start date" });
    }

    let partyEndTime = null;
    if (partyEndTimeRaw) {
      if (!isValidPartyTime(partyEndTimeRaw)) {
        return res.status(400).json({ error: "Invalid end time" });
      }
      partyEndTime = partyEndTimeRaw;
      if (partyTimeToMinutes(partyEndTime) < partyTimeToMinutes(partyTime)) {
        return res.status(400).json({ error: "End time must be on or after start time" });
      }
    }

    const insertRow = {
      party_date: partyDate,
      party_end_date: partyEndDate && partyEndDate !== partyDate ? partyEndDate : null,
      party_start_time: partyTime,
      party_end_time: partyEndTime,
      notes: notes || null,
    };

    const { data: inserted, error: insErr } = await supabase
      .from("blocked_slots")
      .insert(insertRow)
      .select("*")
      .single();

    if (insErr) {
      console.error(insErr);
      const detail = String(insErr.message || "").toLowerCase();
      if (detail.includes("party_end_date") || detail.includes("party_end_time")) {
        return res.status(500).json({
          error:
            "Database is missing block range columns. Ask your developer to apply the blocked_slots range migration.",
        });
      }
      return res.status(500).json({ error: "Could not create block" });
    }

    return res.status(201).json({ block: inserted });
  }

  if (req.method === "DELETE") {
    const id = String(req.query?.id ?? "").trim();
    if (!id) {
      return res.status(400).json({ error: "Missing id" });
    }

    const { error: delErr } = await supabase.from("blocked_slots").delete().eq("id", id);

    if (delErr) {
      console.error(delErr);
      return res.status(500).json({ error: "Could not delete block" });
    }

    return res.status(200).json({ ok: true });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
