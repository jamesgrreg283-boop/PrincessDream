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
  // Update with the production domain when going live
  url: "https://aprincessdream.co.uk",
  serviceArea: "Coventry, Leamington Spa, Bedworth, Nuneaton, Kenilworth",
  copyrightYear: 2026,
  social: {
    facebook: "#",
    instagram: "#",
    tiktok: "#",
  },
} as const;

export const TRUST_BADGES = [
  { label: "DBS Checked", icon: "check" },
  { label: "Safety-focused", icon: "shield" },
  { label: "Professional Performers", icon: "star" },
  { label: "5-Star Experiences", icon: "sparkles" },
] as const;
