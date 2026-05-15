import { assertAdmin } from "./_lib/authAdmin.mjs";
import {
  ADMIN_COOKIE_NAME,
  getCookieValue,
  verifyAdminPassword,
  verifySignedSessionToken,
} from "./_lib/adminSession.mjs";
import { processAdminTestConfirmationEmail } from "./_lib/adminTestConfirmation.mjs";
import {
  applyCorsCredentials,
  getRequestOrigin,
  handleOptionsCredentials,
  isAllowedFrontendOrigin,
} from "./_lib/cors.mjs";
import { sendBookingConfirmationEmails } from "./_lib/emails.mjs";
import { getSupabaseAdmin } from "./_lib/supabase.mjs";

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

/** Session cookie or body password (same as admin login). */
function adminAuthorizedWithPasswordFallback(req, body) {
  const token = getCookieValue(req, ADMIN_COOKIE_NAME);
  if (verifySignedSessionToken(token)) return true;
  const pw = String(body?.password ?? "");
  if (pw && verifyAdminPassword(pw)) return true;
  return false;
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

  const body = parseBody(req);
  if (!body) {
    return res.status(400).json({ error: "Invalid JSON body" });
  }

  if (body.mode === "test") {
    try {
      if (!adminAuthorizedWithPasswordFallback(req, body)) {
        return res.status(401).json({ error: "Unauthorized" });
      }
    } catch (e) {
      console.error("[send-confirmation-email test] auth:", e);
      return res.status(500).json({ error: e.message || "Auth error" });
    }
    const out = await processAdminTestConfirmationEmail(body);
    return res.status(out.statusCode).json(out.json);
  }

  try {
    assertAdmin(req);
  } catch (e) {
    return res.status(e.statusCode || 401).json({ error: e.message });
  }

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
    const result = await sendBookingConfirmationEmails(row, {
      skipAlreadySentCheck: true,
      idempotencyNonce: `manual-resend-${Date.now()}`,
    });
    return res.status(200).json({ ok: true, result });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Failed to send emails" });
  }
}
