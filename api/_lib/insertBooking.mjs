/**
 * Insert a booking row. If newer columns are not migrated yet, retry without them
 * so checkout is not blocked. Deposit / Stripe amounts are never changed here.
 *
 * @param {import("@supabase/supabase-js").SupabaseClient} supabase
 * @param {Record<string, unknown>} row
 * @param {string} [select]
 */
export async function insertBookingRow(supabase, row, select = "*") {
  const attempt = await supabase.from("bookings").insert(row).select(select).single();
  if (!attempt.error) return attempt;

  const msg = String(attempt.error.message || attempt.error.details || "").toLowerCase();
  const missingCol = (name) =>
    msg.includes(name) &&
    (msg.includes("column") || msg.includes("schema cache") || msg.includes("could not find"));

  const next = { ...row };
  let stripped = false;

  if (missingCol("postcode") && next.postcode) {
    const address = String(next.address || "");
    next.address = address.includes(String(next.postcode))
      ? address
      : `${address}, ${next.postcode}`.trim();
    delete next.postcode;
    stripped = true;
    console.warn("[bookings] postcode column missing — falling back into address");
  }

  if (missingCol("extra_character") || missingCol("num_children")) {
    const extras = [];
    if (next.extra_character) extras.push(`Extra princess: ${next.extra_character}`);
    if (next.num_children != null) extras.push(`Number of children: ${next.num_children}`);
    if (extras.length) {
      next.notes = [next.notes, extras.join("\n")].filter(Boolean).join("\n\n");
    }
    delete next.extra_character;
    delete next.num_children;
    stripped = true;
    console.warn("[bookings] extra princess / child-count columns missing — stored in notes");
  }

  if (!stripped) return attempt;
  return supabase.from("bookings").insert(next).select(select).single();
}
