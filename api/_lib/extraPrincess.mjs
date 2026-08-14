/**
 * Mirror of `src/data/extraPrincess.ts` — keep in sync.
 * Extra princess: £50 on cash balance only (deposit unchanged).
 */

export const EXTRA_PRINCESS_FEE_GBP = 50;
export const EXTRA_PRINCESS_REQUIRED_ABOVE = 20;

export function parseChildCount(raw) {
  const n = Number(String(raw ?? "").trim());
  if (!Number.isFinite(n) || n < 1) return null;
  return Math.floor(n);
}

export function extraPrincessRequired(raw) {
  const n = parseChildCount(raw);
  return n != null && n > EXTRA_PRINCESS_REQUIRED_ABOVE;
}

export function extraPrincessFee(extraCharacterSlug) {
  return String(extraCharacterSlug || "").trim() ? EXTRA_PRINCESS_FEE_GBP : 0;
}
