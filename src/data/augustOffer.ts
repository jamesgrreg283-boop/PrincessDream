/**
 * August Booking Offer — 15% off package total, applied to the cash balance only.
 * Online deposit is unchanged. Stripe / deposit amounts are not affected.
 *
 * To turn OFF after August:
 *   1. Set `enabled: false` below, OR
 *   2. Leave it — offer auto-ends after `bookByISO` (UK date).
 * Keep `api/_lib/augustOffer.mjs` in sync with this file.
 */

export const AUGUST_OFFER = {
  /** Flip to false to disable immediately (recommended once August ends). */
  enabled: true,
  /** Last day customers can book to get the offer (Europe/London calendar date). */
  bookByISO: "2026-08-31",
  percentOff: 15,
  title: "August Booking Offer",
  headline: "Book before 31st August and receive 15% OFF any package.",
  bullets: [
    "Party can take place on any future date",
    "Discount automatically applied to your remaining balance",
    "Secure your date today with your standard online deposit",
  ] as const,
} as const;

/** UK calendar date as YYYY-MM-DD. */
function ukDateISO(now = new Date()): string {
  return now.toLocaleDateString("en-CA", { timeZone: "Europe/London" });
}

export function isAugustOfferActive(now = new Date()): boolean {
  if (!AUGUST_OFFER.enabled) return false;
  return ukDateISO(now) <= AUGUST_OFFER.bookByISO;
}

export type PricedPackage = {
  price: number;
  depositOnline: number;
};

/** Whole-pound discount amount (15% of list total). */
export function augustDiscountAmount(pkg: PricedPackage): number {
  if (!isAugustOfferActive()) return 0;
  return Math.round((pkg.price * AUGUST_OFFER.percentOff) / 100);
}

/** List total after August discount (deposit unchanged). */
export function augustPromoTotal(pkg: PricedPackage): number {
  return pkg.price - augustDiscountAmount(pkg);
}

/** Cash balance on the day after August discount. */
export function augustPromoRemaining(pkg: PricedPackage): number {
  return Math.max(0, augustPromoTotal(pkg) - pkg.depositOnline);
}
