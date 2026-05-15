// ============================================================================
// Placeholder reviews. Replace with real reviews once collected.
// Wire to Google Business Profile API later via the Reviews page.
// ============================================================================

export type Review = {
  name: string;
  child?: string;
  location: string;
  rating: number;
  date: string;
  text: string;
  character?: string;
};

export const REVIEWS: Review[] = [
  {
    name: "Hannah M.",
    child: "Lily, 5",
    location: "Coventry",
    rating: 5,
    date: "April 2025",
    text:
      "Absolutely magical from start to finish! Elsa was perfect — she sang, she danced, she was so kind with all the children. My daughter said it was the best day of her life.",
    character: "Elsa",
  },
  {
    name: "Sarah J.",
    child: "Maisie, 6",
    location: "Leamington Spa",
    rating: 5,
    date: "March 2025",
    text:
      "Our daughter felt like a real princess. The communication beforehand was fantastic and the entertainer was so professional. We will be booking again next year!",
    character: "Belle",
  },
  {
    name: "Rachel D.",
    location: "Nuneaton",
    rating: 5,
    date: "September 2025",
    text:
      "Professional, punctual and incredible with children. Worth every penny — every child was engaged from the moment she arrived. Thank you for making the day so special.",
    character: "Rapunzel",
  },
  {
    name: "Emma P.",
    child: "Olivia, 4",
    location: "Bedworth",
    rating: 5,
    date: "November 2025",
    text:
      "Fairy Sparkles was beyond magical. The fairy dust wish moment had us all in tears. Honestly the best party we've ever had — booking was so simple too.",
    character: "Fairy Sparkles",
  },
  {
    name: "Charlotte W.",
    child: "Freya, 7",
    location: "Kenilworth",
    rating: 5,
    date: "January 2025",
    text:
      "Ariel was wonderful! Stayed in character the whole time, brilliant with all the kids, and the photos are absolutely beautiful. Highly recommended.",
    character: "Ariel",
  },
  {
    name: "Laura S.",
    child: "Sophia, 5",
    location: "Coventry",
    rating: 5,
    date: "December 2025",
    text:
      "Anna was so warm, fun and full of energy. The children adored her. Worth every single penny — five stars from a very happy family!",
    character: "Anna",
  },
];
