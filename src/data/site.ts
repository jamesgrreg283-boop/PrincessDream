// ============================================================================
// Site-wide constants. Replace these values with real business info if needed.
// ============================================================================

export const SITE = {
  name: "PrincessDream",
  tagline: "Princess Parties in Coventry & Surrounding Areas",
  phone: "07871 796024",
  phoneTel: "+447871796024",
  email: "princessdreamuk@gmail.com",
  whatsapp: "+447871796024",
  /** Canonical production origin — must match sitemap, redirects, and Search Console property. */
  url: "https://www.princessdream.co.uk",
  serviceArea: "Coventry, Leamington Spa, Bedworth, Nuneaton, Kenilworth",
  copyrightYear: 2026,
  social: {
    facebook: "#",
    instagram: "#",
    tiktok: "#",
  },
} as const;

/** Absolute URL for OG images, JSON-LD, and canonical fallbacks. */
export function absoluteSiteUrl(pathOrUrl: string): string {
  if (pathOrUrl.startsWith("http://") || pathOrUrl.startsWith("https://")) {
    return pathOrUrl;
  }
  const path = pathOrUrl.startsWith("/") ? pathOrUrl : `/${pathOrUrl}`;
  return `${SITE.url}${path}`;
}

export const TRUST_BADGES = [
  { label: "DBS Checked", icon: "check" },
  { label: "Safety-focused", icon: "shield" },
  { label: "Professional Performers", icon: "star" },
  { label: "5-Star Experiences", icon: "sparkles" },
] as const;
