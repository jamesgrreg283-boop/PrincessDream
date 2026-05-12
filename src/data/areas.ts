// ============================================================================
// Service areas with SEO-focused unique content.
// Each area has a slug, keyword-rich copy, and surrounding-area notes.
// ============================================================================

export type Area = {
  slug: string;
  name: string;
  headline: string;
  intro: string;
  bullets: string[];
  keyword: string;
};

export const AREAS: Area[] = [
  {
    slug: "coventry",
    name: "Coventry",
    keyword: "Princess Parties Coventry",
    headline: "Princess Parties in Coventry",
    intro:
      "We're proud to call Coventry our home. Our magical princess parties travel right across the city — from Earlsdon and Allesley to Cheylesmore, Stoke and Walsgrave — bringing fairytales to life for birthday children across CV1 to CV6.",
    bullets: [
      "Local Coventry-based princess entertainers",
      "DBS checked and fully insured for your peace of mind",
      "Available for home parties, halls, and venue bookings",
      "Free travel within Coventry city limits",
    ],
  },
  {
    slug: "leamington-spa",
    name: "Leamington Spa",
    keyword: "Princess Parties Leamington Spa",
    headline: "Princess Parties in Leamington Spa",
    intro:
      "From Royal Leamington Spa's elegant streets to Lillington and Whitnash, we bring sparkle, sing-alongs and storybook charm to children's birthday parties across CV31 and CV32. Perfect for venues, garden parties and at-home celebrations.",
    bullets: [
      "Professional princess entertainers for Leamington Spa",
      "All-ages friendly — ideal for ages 3 to 10",
      "Trusted by Warwickshire families",
      "Quick online booking with secure deposit",
    ],
  },
  {
    slug: "nuneaton",
    name: "Nuneaton",
    keyword: "Princess Parties Nuneaton",
    headline: "Princess Parties in Nuneaton",
    intro:
      "We bring fairytale magic to Nuneaton and the surrounding villages — including Weddington, Attleborough and Stockingford. Whether it's a cosy living-room celebration or a grand hall party, our princesses make every birthday unforgettable.",
    bullets: [
      "Trusted children's entertainers covering CV10 and CV11",
      "Tailored experiences for every birthday child",
      "Reliable, punctual, and professional performers",
      "Available weekends and school holidays",
    ],
  },
  {
    slug: "bedworth",
    name: "Bedworth",
    keyword: "Princess Parties Bedworth",
    headline: "Princess Parties in Bedworth",
    intro:
      "Bedworth families love our magical visits. From Exhall to Collycroft and Bulkington, we deliver warm, professional princess parties that bring joy to children and reassurance to parents across CV12.",
    bullets: [
      "Warwickshire princess entertainer serving Bedworth",
      "Insured, DBS checked, and child-safety focused",
      "Memorable photo moments included",
      "Easy online booking with secure deposit",
    ],
  },
  {
    slug: "kenilworth",
    name: "Kenilworth",
    keyword: "Princess Parties Kenilworth",
    headline: "Princess Parties in Kenilworth",
    intro:
      "Kenilworth is one of our favourite places to visit — historic charm, lovely venues, and wonderful families. We bring elegant princess parties to Kenilworth CV8 with sing-alongs, games and unforgettable photo moments.",
    bullets: [
      "Elegant princess parties in Kenilworth CV8",
      "Perfect for garden parties and village halls",
      "Beautifully costumed, in-character performers",
      "Quick, friendly response to every enquiry",
    ],
  },
];
