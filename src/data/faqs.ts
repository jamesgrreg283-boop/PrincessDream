// ============================================================================
// FAQ entries. These are also used to emit FAQPage schema on the FAQ page.
// ============================================================================

import { MIN_BOOKING_LEAD_DAYS } from "./bookingLeadTime";

export type Faq = { q: string; a: string };

export const FAQS: Faq[] = [
  {
    q: "How do I book a princess party?",
    a: `Complete the booking form and pay the online deposit for your chosen package to secure your date. Please book at least ${MIN_BOOKING_LEAD_DAYS} days (3 weeks) in advance — shorter notice isn't available online. We'll confirm everything by email and message.`,
  },
  {
    q: "How much is the deposit?",
    a: "A fixed online deposit secures your booking: £40 for the 30-minute appearance, and £50 for the 1-hour or 2-hour parties. During our August booking offer (book by 31 August), you get 15% off any package — the discount comes off the cash balance on the day, not the deposit.",
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
    q: "Can I choose my child's favourite princess?",
    a: "Absolutely! Choose your princess at the time of booking. Bookings are subject to character availability on your chosen date.",
  },
  {
    q: "Can I book an extra princess?",
    a: "Yes — you can add a second princess for £50, paid in cash on the day (the online deposit stays the same). If more than 20 children are attending, a second princess is required so every guest gets enough attention.",
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
    a: `A minimum of ${MIN_BOOKING_LEAD_DAYS} days (3 weeks) notice is required for every party and appearance. The online booking form will only let you choose dates from three weeks ahead. We still recommend booking earlier when you can — weekends and popular princesses fill up quickly.`,
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
