/**
 * Extra princess entertainer — £50 added to the cash balance (deposit unchanged).
 * Mandatory when more than 20 children are attending.
 */

export const EXTRA_PRINCESS_FEE_GBP = 50;
/** Required when child count is strictly greater than this. */
export const EXTRA_PRINCESS_REQUIRED_ABOVE = 20;

export function parseChildCount(raw: string | number | null | undefined): number | null {
  const n = Number(String(raw ?? "").trim());
  if (!Number.isFinite(n) || n < 1) return null;
  return Math.floor(n);
}

export function extraPrincessRequired(raw: string | number | null | undefined): boolean {
  const n = parseChildCount(raw);
  return n != null && n > EXTRA_PRINCESS_REQUIRED_ABOVE;
}

export function extraPrincessFee(extraCharacterSlug: string | null | undefined): number {
  return String(extraCharacterSlug || "").trim() ? EXTRA_PRINCESS_FEE_GBP : 0;
}
