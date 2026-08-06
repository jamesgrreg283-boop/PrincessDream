// ============================================================================
// Party packages. `price` = total in GBP (whole pounds).
// `depositOnline` = amount paid online to secure the booking (whole pounds).
// ============================================================================

import {
  augustDiscountAmount,
  augustPromoRemaining,
  augustPromoTotal,
  isAugustOfferActive,
} from "./augustOffer";

export type Package = {
  slug: string;
  name: string;
  duration: string;
  price: number;
  /** Fixed GBP amount charged as the online deposit for this package */
  depositOnline: number;
  popular?: boolean;
  tagline: string;
  includes: string[];
};

export const PACKAGES: Package[] = [
  {
    slug: "30-minute-appearance",
    name: "30 Minute Appearance",
    duration: "30 minutes",
    price: 100,
    depositOnline: 40,
    tagline: "A magical short visit — perfect for younger children.",
    includes: [
      "Meet and Greet",
      "Sing Along",
      "Fairy Dust Wish",
      "Photos",
      "Special Present for the Birthday Child",
    ],
  },
  {
    slug: "1-hour-party",
    name: "1 Hour Party",
    duration: "1 hour",
    price: 180,
    depositOnline: 50,
    popular: true,
    tagline: "Our most popular package — packed with magical moments.",
    includes: [
      "Meet and Greet",
      "Games (Musical Statues and more)",
      "Pass the Parcel",
      "Sing Along",
      "Magical Wish",
      "Photos",
      "Special Present for the Birthday Child",
    ],
  },
  {
    slug: "2-hour-party",
    name: "2 Hour Party",
    duration: "2 hours",
    price: 230,
    depositOnline: 50,
    tagline: "The complete fairytale experience — every detail included.",
    includes: [
      "Meet and Greet",
      "Games",
      "Pass the Parcel",
      "Sing Along",
      "Dancing",
      "Crafts and Colouring",
      "Magical Wish",
      "Photos",
      "Special Present for the Birthday Child",
    ],
  },
];

/** Online deposit — never changed by promotional offers. */
export const depositFor = (pkg: Package) => pkg.depositOnline;

/** Standard (non-promo) cash balance. */
export const standardRemainingFor = (pkg: Package) => pkg.price - pkg.depositOnline;

/**
 * Cash balance due on the day.
 * During the August offer this is reduced by 15% of the package total (deposit unchanged).
 */
export const remainingFor = (pkg: Package) =>
  isAugustOfferActive() ? augustPromoRemaining(pkg) : standardRemainingFor(pkg);

/** Effective package total after any active promo (deposit still taken at full depositOnline). */
export const totalFor = (pkg: Package) =>
  isAugustOfferActive() ? augustPromoTotal(pkg) : pkg.price;

export const discountFor = (pkg: Package) =>
  isAugustOfferActive() ? augustDiscountAmount(pkg) : 0;

export { isAugustOfferActive };
