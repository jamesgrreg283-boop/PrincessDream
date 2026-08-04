/**
 * Insert a booking row. Prefer dedicated `postcode` column; if the column is not
 * migrated yet, fall back to appending postcode onto `address`.
 *
 * @param {import("@supabase/supabase-js").SupabaseClient} supabase
 * @param {Record<string, unknown>} row
 * @param {string} [select]
 */
export async function insertBookingRow(supabase, row, select = "*") {
  const attempt = await supabase.from("bookings").insert(row).select(select).single();
  if (!attempt.error) return attempt;

  const msg = String(attempt.error.message || attempt.error.details || "").toLowerCase();
  const missingPostcodeCol =
    msg.includes("postcode") &&
    (msg.includes("column") || msg.includes("schema cache") || msg.includes("could not find"));

  if (!missingPostcodeCol || !row.postcode) {
    return attempt;
  }

  const { postcode, ...rest } = row;
  const address = String(rest.address || "");
  const fallback = {
    ...rest,
    address: address.includes(String(postcode))
      ? address
      : `${address}, ${postcode}`.trim(),
  };
  console.warn(
    "[bookings] postcode column missing — storing postcode in address until migration is applied"
  );
  return supabase.from("bookings").insert(fallback).select(select).single();
}
