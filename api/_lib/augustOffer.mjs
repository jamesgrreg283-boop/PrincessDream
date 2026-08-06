/**
 * Mirror of `src/data/augustOffer.ts` — keep in sync.
 * August offer: 15% off total, applied to cash balance only (deposit unchanged).
 */

export const AUGUST_OFFER = {
  enabled: true,
  bookByISO: "2026-08-31",
  percentOff: 15,
};

function ukDateISO(now = new Date()) {
  return now.toLocaleDateString("en-CA", { timeZone: "Europe/London" });
}

export function isAugustOfferActive(now = new Date()) {
  if (!AUGUST_OFFER.enabled) return false;
  return ukDateISO(now) <= AUGUST_OFFER.bookByISO;
}

export function augustDiscountAmount(pkg) {
  if (!isAugustOfferActive()) return 0;
  const price = Number(pkg?.price) || 0;
  return Math.round((price * AUGUST_OFFER.percentOff) / 100);
}

export function augustPromoTotal(pkg) {
  const price = Number(pkg?.price) || 0;
  return price - augustDiscountAmount(pkg);
}

export function augustPromoRemaining(pkg) {
  const deposit = Number(pkg?.depositOnline) || 0;
  return Math.max(0, augustPromoTotal(pkg) - deposit);
}
