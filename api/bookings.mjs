import { assertAdmin } from "./_lib/authAdmin.mjs";
import { getSupabaseAdmin } from "./_lib/supabase.mjs";
import {
  applyCorsCredentials,
  getRequestOrigin,
  handleOptionsCredentials,
  isAllowedFrontendOrigin,
} from "./_lib/cors.mjs";
import { packageBySlug } from "./_lib/packages.mjs";
import {
  bookingRowFromPayload,
  buildNotes,
  validateBookingPayload,
} from "./_lib/bookingValidate.mjs";
import { insertBookingRow } from "./_lib/insertBooking.mjs";
import { isSlotAvailable } from "./_lib/availability.mjs";

const STATUSES = new Set(["pending", "confirmed", "cancelled"]);

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
      .from("bookings")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);

    if (error) {
      console.error(error);
      return res.status(500).json({ error: "Could not load bookings" });
    }
    return res.status(200).json({ bookings: data ?? [] });
  }

  if (req.method === "POST") {
    const body = parseBody(req);
    if (!body || typeof body !== "object") {
      return res.status(400).json({ error: "Invalid JSON body" });
    }

    const booking = {
      occasionType: body.occasionType ?? "child_birthday",
      parentName: body.parentName,
      email: body.email,
      phone: body.phone,
      childName: body.childName,
      childAge: body.childAge,
      partyDate: body.partyDate,
      partyTime: body.partyTime,
      address: body.address,
      postcode: body.postcode,
      character: body.character,
      packageSlug: body.packageSlug,
      numChildren: body.numChildren ?? "",
      specialRequests: body.specialRequests ?? "",
    };

    const v = validateBookingPayload(booking);
    if (!v.ok) {
      return res.status(400).json({ error: "Invalid booking", fields: v.errors });
    }

    const pkg = packageBySlug(booking.packageSlug);
    const available = await isSlotAvailable(
      supabase,
      booking.partyDate,
      booking.partyTime,
      booking.packageSlug
    );
    if (!available) {
      return res.status(409).json({
        error: "That slot is already booked or blocked. Pick another date or time.",
      });
    }

    const row = bookingRowFromPayload(booking, pkg);
    row.status = "confirmed";
    row.hold_expires_at = null;
    row.stripe_session_id = null;
    row.stripe_payment_intent_id = null;
    if (body.notes != null) {
      const manual = String(body.notes).trim();
      const auto = buildNotes(booking);
      row.notes = [manual, auto].filter(Boolean).join("\n\n---\n\n");
    }

    const { data: inserted, error: insErr } = await insertBookingRow(supabase, row);

    if (insErr) {
      console.error(insErr);
      return res.status(500).json({ error: "Could not create booking" });
    }

    return res.status(201).json({ booking: inserted });
  }

  if (req.method === "PATCH") {
    const body = parseBody(req);
    const id = String(body?.id ?? "").trim();
    const status = String(body?.status ?? "").trim();

    if (!id) {
      return res.status(400).json({ error: "Missing id" });
    }
    if (!STATUSES.has(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    const { data: updated, error: upErr } = await supabase
      .from("bookings")
      .update({ status })
      .eq("id", id)
      .select("*")
      .maybeSingle();

    if (upErr) {
      console.error(upErr);
      return res.status(500).json({ error: "Could not update booking" });
    }
    if (!updated) {
      return res.status(404).json({ error: "Booking not found" });
    }

    return res.status(200).json({ booking: updated });
  }

  if (req.method === "DELETE") {
    const id = String(req.query?.id ?? "").trim();
    if (!id) {
      return res.status(400).json({ error: "Missing id" });
    }

    const { error: delErr } = await supabase.from("bookings").delete().eq("id", id);

    if (delErr) {
      console.error(delErr);
      return res.status(500).json({ error: "Could not delete booking" });
    }

    return res.status(200).json({ ok: true });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
