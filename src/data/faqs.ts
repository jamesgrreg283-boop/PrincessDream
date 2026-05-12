// ============================================================================
// FAQ entries. These are also used to emit FAQPage schema on the FAQ page.
// ============================================================================

export type Faq = { q: string; a: string };

export const FAQS: Faq[] = [
  {
    q: "How do I book a princess party?",
    a: "Complete the booking form and pay the online deposit for your chosen package to secure your date. We'll confirm everything by email and message.",
  },
  {
    q: "How much is the deposit?",
    a: "A fixed online deposit secures your booking: £40 for the 30-minute appearance (£100 total), and £50 for the 1-hour (£180 total) or 2-hour (£230 total) parties.",
  },
  {
    q: "When is the remaining balance due?",
    a: "The remaining balance is paid in cash on the day of the party, just before the princess begins.",
  },
  {
    q: "What areas do you cover?",
    a: "Coventry, Leamington Spa, Bedworth, Nuneaton, Kenilworth and surrounding areas across Warwickshire and the West Midlands.",
  },
  {
    q: "Are your performers DBS checked?",
    a: "Yes — all performers are DBS checked for your peace of mind.",
  },
  {
    q: "Are you fully insured?",
    a: "Yes, we are fully insured with public liability cover.",
  },
  {
    q: "Can I choose my child's favourite princess?",
    a: "Absolutely! Choose your princess at the time of booking. Bookings are subject to character availability on your chosen date.",
  },
  {
    q: "What ages are your parties suitable for?",
    a: "Typically ages 3 to 10, but we can adapt the experience for different age groups — just let us know in your booking form.",
  },
  {
    q: "What if I need to cancel?",
    a: "Deposits are non-refundable but may be transferable to another date depending on notice and availability.",
  },
  {
    q: "How far in advance should I book?",
    a: "We recommend booking as early as possible to secure your preferred date and character — weekends fill up quickly!",
  },
  {
    q: "Do you perform indoors and outdoors?",
    a: "Yes, both — provided the space is safe and suitable. We just ask for a clean, dry area for our performer and the children.",
  },
  {
    q: "What if my chosen princess is unavailable?",
    a: "We will suggest alternative characters or dates and do our very best to accommodate your wishes.",
  },
];
