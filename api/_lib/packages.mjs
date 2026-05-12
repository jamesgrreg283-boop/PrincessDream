/** Mirror of `src/data/packages.ts` — keep deposit/totals in sync. */
export const PACKAGES = [
  {
    slug: "30-minute-appearance",
    name: "30 Minute Appearance",
    price: 100,
    depositOnline: 40,
  },
  {
    slug: "1-hour-party",
    name: "1 Hour Party",
    price: 180,
    depositOnline: 50,
  },
  {
    slug: "2-hour-party",
    name: "2 Hour Party",
    price: 230,
    depositOnline: 50,
  },
];

export function packageBySlug(slug) {
  return PACKAGES.find((p) => p.slug === slug) ?? null;
}
