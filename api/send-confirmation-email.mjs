import { assertAdmin } from "./_lib/authAdmin.mjs";
import { getSupabaseAdmin } from "./_lib/supabase.mjs";
import {
  applyCorsCredentials,
  getRequestOrigin,
  handleOptionsCredentials,
  isAllowedFrontendOrigin,
} from "./_lib/cors.mjs";
import { sendBookingConfirmationEmails } from "./_lib/emails.mjs";

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

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!origin || !isAllowedFrontendOrigin(origin)) {
    return res.status(403).json({ error: "Origin not allowed" });
  }
  applyCorsCredentials(res, origin);

  try {
    assertAdmin(req);
  } catch (e) {
    return res.status(e.statusCode || 401).json({ error: e.message });
  }

  const body = parseBody(req);
  const id = String(body?.bookingId || body?.id || "").trim();
  if (!id) {
    return res.status(400).json({ error: "Missing bookingId" });
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

  const { data: row, error } = await supabase
    .from("bookings")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error(error);
    return res.status(500).json({ error: "Lookup failed" });
  }
  if (!row) {
    return res.status(404).json({ error: "Booking not found" });
  }
  if (row.status !== "confirmed") {
    return res.status(400).json({ error: "Booking must be confirmed to email" });
  }

  try {
    const result = await sendBookingConfirmationEmails(row);
    return res.status(200).json({ ok: true, result });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Failed to send emails" });
  }
}
