// ============================================================================
// Party packages. `price` = total in GBP (whole pounds).
// `depositOnline` = amount paid online to secure the booking (whole pounds).
// ============================================================================

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
    /** £1 while testing Stripe; live deposit is £40 — keep in sync with `api/_lib/packages.mjs`. */
    depositOnline: 1,
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

export const depositFor = (pkg: Package) => pkg.depositOnline;

export const remainingFor = (pkg: Package) => pkg.price - pkg.depositOnline;
