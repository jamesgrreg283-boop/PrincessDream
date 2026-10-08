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
import {
  isSlotAvailable,
  isValidPartyDate,
  isValidPartyTime,
} from "./_lib/availability.mjs";
import { ALLOWED_CHARACTERS } from "./_lib/bookingValidate.mjs";
import { checkServicePostcode } from "./_lib/serviceArea.mjs";
import { extraPrincessFee, parseChildCount } from "./_lib/extraPrincess.mjs";

const STATUSES = new Set(["pending", "confirmed", "cancelled"]);
const EMAIL_RE = /^\S+@\S+\.\S+$/;

function ukStamp() {
  return new Date().toLocaleString("en-GB", {
    timeZone: "Europe/London",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Admin edit of an existing booking (date, time, party and contact details).
 * Uses existing columns only. Deposit is never changed; totals follow package / extra princess.
 */
async function amendBooking(res, supabase, id, d, force) {
  const { data: current, error: getErr } = await supabase
    .from("bookings")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (getErr) {
    console.error(getErr);
    return res.status(500).json({ error: "Could not load booking" });
  }
  if (!current) {
    return res.status(404).json({ error: "Booking not found" });
  }

  const str = (k, fallback) => (d[k] === undefined ? fallback : String(d[k] ?? "").trim());

  const partyDate = str("partyDate", current.party_date);
  const partyTime = str("partyTime", current.party_start_time);
  const packageSlug = str("packageSlug", current.selected_package);
  const character = str("character", current.selected_character).toLowerCase();
  const extraCharacter = str("extraCharacter", current.extra_character ?? "").toLowerCase();
  const parentName = str("parentName", current.parent_name);
  const email = str("email", current.email);
  const phone = str("phone", current.phone);
  const childName = str("childName", current.child_name);
  const childAge = str("childAge", current.child_age);
  const address = str("address", current.address);
  const postcodeRaw = str("postcode", current.postcode ?? "");
  const numChildrenRaw =
    d.numChildren === undefined ? current.num_children : d.numChildren;
  const notes = d.notes === undefined ? current.notes : String(d.notes ?? "").trim() || null;

  const errors = [];
  if (!isValidPartyDate(partyDate)) errors.push("party date");
  if (!isValidPartyTime(partyTime)) errors.push("start time");
  const pkg = packageBySlug(packageSlug);
  if (!pkg) errors.push("package");
  if (!character || !ALLOWED_CHARACTERS.has(character)) errors.push("princess");
  if (extraCharacter && !ALLOWED_CHARACTERS.has(extraCharacter)) errors.push("extra princess");
  if (extraCharacter && extraCharacter === character) {
    errors.push("extra princess (must differ from the main princess)");
  }
  if (!parentName) errors.push("parent name");
  if (!EMAIL_RE.test(email)) errors.push("email");
  if (phone.replace(/\D/g, "").length < 7) errors.push("phone (at least 7 digits)");
  if (!childName) errors.push("child name");
  if (!address) errors.push("address");
  let postcode = current.postcode ?? null;
  if (postcodeRaw) {
    const pc = checkServicePostcode(postcodeRaw);
    if (!pc.ok) errors.push("postcode (outside service area)");
    else postcode = pc.normalised;
  } else {
    postcode = null;
  }
  if (errors.length) {
    return res.status(400).json({ error: `Please check: ${errors.join(", ")}.` });
  }

  const slotChanged =
    partyDate !== current.party_date ||
    partyTime !== current.party_start_time ||
    packageSlug !== current.selected_package;
  if (slotChanged && current.status !== "cancelled" && !force) {
    const free = await isSlotAvailable(supabase, partyDate, partyTime, packageSlug, id);
    if (!free) {
      return res.status(409).json({
        error: "That date/time clashes with another booking or a blocked date.",
        conflict: true,
      });
    }
  }

  const deposit = Number(current.deposit_amount) || 0;
  const oldExtraFee = extraPrincessFee(current.extra_character);
  const newExtraFee = extraPrincessFee(extraCharacter);
  let total = Number(current.total_price) || 0;
  let remaining = Number(current.remaining_balance) || 0;
  if (packageSlug !== current.selected_package) {
    total = pkg.price + newExtraFee;
    remaining = Math.max(0, total - deposit);
  } else if (oldExtraFee !== newExtraFee) {
    total = total - oldExtraFee + newExtraFee;
    remaining = Math.max(0, remaining - oldExtraFee + newExtraFee);
  }

  const changes = [];
  if (partyDate !== current.party_date) changes.push(`date ${current.party_date} → ${partyDate}`);
  if (partyTime !== current.party_start_time) {
    changes.push(`time ${current.party_start_time} → ${partyTime}`);
  }
  if (packageSlug !== current.selected_package) {
    changes.push(`package ${current.selected_package} → ${packageSlug}`);
  }
  if (character !== current.selected_character) {
    changes.push(`princess ${current.selected_character} → ${character}`);
  }
  if (extraCharacter !== (current.extra_character ?? "")) {
    changes.push(`extra princess ${current.extra_character || "none"} → ${extraCharacter || "none"}`);
  }
  const amendLine = changes.length ? `Amended by admin ${ukStamp()}: ${changes.join("; ")}` : "";
  const finalNotes = [notes, amendLine].filter(Boolean).join("\n\n") || null;

  const update = {
    party_date: partyDate,
    party_start_time: partyTime,
    selected_package: packageSlug,
    selected_character: character,
    extra_character: extraCharacter || null,
    num_children: parseChildCount(numChildrenRaw),
    parent_name: parentName,
    email,
    phone,
    child_name: childName,
    child_age: childAge || "—",
    address,
    postcode,
    total_price: total,
    remaining_balance: remaining,
    notes: finalNotes,
  };

  const { data: updated, error: upErr } = await supabase
    .from("bookings")
    .update(update)
    .eq("id", id)
    .select("*")
    .maybeSingle();
  if (upErr) {
    console.error(upErr);
    return res.status(500).json({ error: "Could not update booking" });
  }
  return res.status(200).json({ booking: updated });
}

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
      extraCharacter: body.extraCharacter ?? "",
      packageSlug: body.packageSlug,
      numChildren: body.numChildren ?? "",
      specialRequests: body.specialRequests ?? "",
    };

    // Admin can enter short-notice holds / Instagram bookings.
    const v = validateBookingPayload(booking, { skipLeadTime: true });
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
    if (body?.details && typeof body.details === "object") {
      return amendBooking(res, supabase, id, body.details, Boolean(body.force));
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
