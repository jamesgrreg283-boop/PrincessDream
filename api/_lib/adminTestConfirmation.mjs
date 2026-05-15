import { randomBytes } from "node:crypto";
import {
  markBookingConfirmationEmailsSent,
  sendBookingConfirmationEmails,
} from "./emails.mjs";
import { getSupabaseAdmin } from "./supabase.mjs";
import { buildSyntheticTestBooking } from "./syntheticTestBooking.mjs";

const ALLOWED_SLUGS = new Set([
  "30-minute-appearance",
  "1-hour-party",
  "2-hour-party",
]);

function resendId(res) {
  if (!res?.data) return null;
  return res.data.id ?? res.data.Id ?? null;
}

/**
 * Admin-only test send (no Stripe). Returns HTTP status + JSON body for the handler.
 * @param {Record<string, unknown>} body
 */
export async function processAdminTestConfirmationEmail(body) {
  const customerEmail = String(body?.customerEmail ?? "").trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail)) {
    return {
      statusCode: 400,
      json: { error: "Valid customerEmail is required" },
    };
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
        return {
          statusCode: 503,
          json: { error: "Database is not configured" },
        };
      }
      throw e;
    }
    const { data, error } = await supabase
      .from("bookings")
      .select("*")
      .eq("id", bookingId)
      .maybeSingle();
    if (error) {
      console.error("[send-confirmation-email test] fetch:", error);
      return { statusCode: 500, json: { error: "Lookup failed" } };
    }
    if (!data) {
      return { statusCode: 404, json: { error: "Booking not found" } };
    }
    row = data;
  } else {
    const slug = packageSlugRaw || "30-minute-appearance";
    if (!ALLOWED_SLUGS.has(slug)) {
      return {
        statusCode: 400,
        json: {
          error:
            "packageSlug must be one of: 30-minute-appearance, 1-hour-party, 2-hour-party",
        },
      };
    }
    row = buildSyntheticTestBooking({
      packageSlug: slug,
      customerEmail,
    });
    if (!row) {
      return {
        statusCode: 400,
        json: { error: "Could not build synthetic booking" },
      };
    }
  }

  const adminInbox =
    process.env.ADMIN_BOOKING_EMAIL?.trim() ||
    process.env.NOTIFY_EMAIL_TO?.trim() ||
    "princessdreamuk@gmail.com";

  const idemNonce = `test-${Date.now()}-${randomBytes(8).toString("hex")}`;

  console.log("[send-confirmation-email test] start", {
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
    console.error("[send-confirmation-email test] send exception:", e);
    return {
      statusCode: 500,
      json: {
        ok: false,
        error: String(e?.message ?? e),
        adminSent: false,
        customerSent: false,
      },
    };
  }

  if (result?.skipped) {
    console.warn("[send-confirmation-email test] skipped:", result.reason);
    return {
      statusCode: 200,
      json: {
        ok: false,
        skipped: true,
        skippedReason: result.reason,
        adminSent: false,
        customerSent: false,
        adminResendId: null,
        customerResendId: null,
        errors: null,
      },
    };
  }

  const adminResendId = resendId(result?.toAdmin);
  const customerResendId = resendId(result?.toCustomer);
  const adminSent = Boolean(result?.toAdmin?.data && !result?.toAdmin?.error);
  const customerSent = Boolean(
    result?.toCustomer?.data && !result?.toCustomer?.error
  );

  console.log("[send-confirmation-email test] Resend result", {
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
    console.error("[send-confirmation-email test] errors:", result.errors);
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
        "[send-confirmation-email test] confirmation_emails_sent_at mark:",
        marked
      );
    } catch (e) {
      console.error("[send-confirmation-email test] mark failed:", e);
    }
  }

  return {
    statusCode: 200,
    json: {
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
    },
  };
}
