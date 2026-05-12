/** Mirror of `src/data/packages.ts` — keep deposit/totals/durations in sync. */
export const PACKAGES = [
  {
    slug: "30-minute-appearance",
    name: "30 Minute Appearance",
    price: 100,
    /** £1 for Stripe test checkouts; switch to 40 when you go live with £40 Stripe Price + env. */
    depositOnline: 1,
    durationMinutes: 30,
  },
  {
    slug: "1-hour-party",
    name: "1 Hour Party",
    price: 180,
    depositOnline: 50,
    durationMinutes: 60,
  },
  {
    slug: "2-hour-party",
    name: "2 Hour Party",
    price: 230,
    depositOnline: 50,
    durationMinutes: 120,
  },
];

export function packageBySlug(slug) {
  return PACKAGES.find((p) => p.slug === slug) ?? null;
}

/** Party length on the day (visit / performance), used for travel buffers. */
export function durationMinutesForPackageSlug(slug) {
  const p = packageBySlug(String(slug || ""));
  return typeof p?.durationMinutes === "number" ? p.durationMinutes : 60;
}
