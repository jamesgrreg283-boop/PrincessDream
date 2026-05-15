import { randomBytes } from "node:crypto";
import {
  ADMIN_COOKIE_NAME,
  getCookieValue,
  verifyAdminPassword,
  verifySignedSessionToken,
} from "../_lib/adminSession.mjs";
import {
  applyCorsCredentials,
  getRequestOrigin,
  handleOptionsCredentials,
  isAllowedFrontendOrigin,
} from "../_lib/cors.mjs";
import {
  markBookingConfirmationEmailsSent,
  sendBookingConfirmationEmails,
} from "../_lib/emails.mjs";
import { getSupabaseAdmin } from "../_lib/supabase.mjs";
import { buildSyntheticTestBooking } from "../_lib/syntheticTestBooking.mjs";

const ALLOWED_SLUGS = new Set([
  "30-minute-appearance",
  "1-hour-party",
  "2-hour-party",
]);

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

function adminAuthorized(req, body) {
  const token = getCookieValue(req, ADMIN_COOKIE_NAME);
  if (verifySignedSessionToken(token)) return true;
  const pw = String(body?.password ?? "");
  if (pw && verifyAdminPassword(pw)) return true;
  return false;
}

function resendId(res) {
  if (!res?.data) return null;
  return res.data.id ?? res.data.Id ?? null;
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

  try {
    if (!adminAuthorized(req, body)) {
      return res.status(401).json({ error: "Unauthorized" });
    }
  } catch (e) {
    console.error("[send-test-confirmation-email] auth:", e);
    return res.status(500).json({ error: e.message || "Auth error" });
  }

  const customerEmail = String(body?.customerEmail ?? "").trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail)) {
    return res.status(400).json({ error: "Valid customerEmail is required" });
  }

  const bookingId = String(body?.bookingId ?? "").trim();
  const markAsSent = Boolean(body?.markAsSent);
  const packageSlugRaw = String(body?.packageSlug ?? "").trim();

  let row = null;
  let source = "synthetic";

  if (bookingId) {
    source = "database";
    let supabase;
    try {
      supabase = getSupabaseAdmin();
    } catch (e) {
      if (e?.code === "NO_SUPABASE") {
        return res.status(503).json({ error: "Database is not configured" });
      }
      throw e;
    }
    const { data, error } = await supabase
      .from("bookings")
      .select("*")
      .eq("id", bookingId)
      .maybeSingle();
    if (error) {
      console.error("[send-test-confirmation-email] fetch:", error);
      return res.status(500).json({ error: "Lookup failed" });
    }
    if (!data) {
      return res.status(404).json({ error: "Booking not found" });
    }
    row = data;
  } else {
    const slug = packageSlugRaw || "30-minute-appearance";
    if (!ALLOWED_SLUGS.has(slug)) {
      return res.status(400).json({
        error:
          "packageSlug must be one of: 30-minute-appearance, 1-hour-party, 2-hour-party",
      });
    }
    row = buildSyntheticTestBooking({
      packageSlug: slug,
      customerEmail,
    });
    if (!row) {
      return res.status(400).json({ error: "Could not build synthetic booking" });
    }
  }

  const adminInbox =
    process.env.ADMIN_BOOKING_EMAIL?.trim() ||
    process.env.NOTIFY_EMAIL_TO?.trim() ||
    "princessdreamuk@gmail.com";

  const idemNonce = `test-${Date.now()}-${randomBytes(8).toString("hex")}`;

  console.log("[send-test-confirmation-email] start", {
    source,
    bookingId: row.id,
    package: row.selected_package,
    customerEmail,
    markAsSent,
    adminInbox,
    idempotencyNonce: idemNonce,
  });

  let result;
  try {
    result = await sendBookingConfirmationEmails(row, {
      skipAlreadySentCheck: true,
      idempotencyNonce: idemNonce,
      customerToOverride: customerEmail,
      subjectPrefix: "[TEST] ",
    });
  } catch (e) {
    console.error("[send-test-confirmation-email] send exception:", e);
    return res.status(500).json({
      ok: false,
      error: String(e?.message ?? e),
      adminSent: false,
      customerSent: false,
    });
  }

  if (result?.skipped) {
    console.warn("[send-test-confirmation-email] skipped:", result.reason);
    return res.status(200).json({
      ok: false,
      skipped: true,
      skippedReason: result.reason,
      adminSent: false,
      customerSent: false,
      adminResendId: null,
      customerResendId: null,
      errors: null,
    });
  }

  const adminResendId = resendId(result?.toAdmin);
  const customerResendId = resendId(result?.toCustomer);
  const adminSent = Boolean(result?.toAdmin?.data && !result?.toAdmin?.error);
  const customerSent = Boolean(
    result?.toCustomer?.data && !result?.toCustomer?.error
  );

  console.log("[send-test-confirmation-email] Resend result", {
    adminAttempted: true,
    adminSent,
    adminResendId,
    adminError: result?.toAdmin?.error ?? null,
    customerAttempted: true,
    customerSent,
    customerResendId,
    customerError: result?.toCustomer?.error ?? null,
    errors: result?.errors ?? null,
  });

  if (result?.errors?.length) {
    console.error("[send-test-confirmation-email] errors:", result.errors);
  }

  let marked = false;
  if (
    markAsSent &&
    bookingId &&
    source === "database" &&
    !result?.errors?.length
  ) {
    try {
      const supabase = getSupabaseAdmin();
      marked = await markBookingConfirmationEmailsSent(supabase, bookingId);
      console.log(
        "[send-test-confirmation-email] confirmation_emails_sent_at mark:",
        marked
      );
    } catch (e) {
      console.error("[send-test-confirmation-email] mark failed:", e);
    }
  }

  return res.status(200).json({
    ok: !result?.errors?.length,
    adminSent,
    customerSent,
    adminResendId,
    customerResendId,
    errors: result?.errors ?? null,
    skipped: false,
    confirmationMarked: marked,
    source,
    bookingId: row.id,
  });
}
