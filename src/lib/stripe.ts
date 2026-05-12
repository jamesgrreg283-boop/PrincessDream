// ============================================================================
// Stripe Configuration
// ----------------------------------------------------------------------------
// Two ways to enable real Stripe payments:
//
// 1) HOSTED PAYMENT LINKS (easiest — recommended to start):
//    Create three Payment Links in your Stripe Dashboard (one per package),
//    each charging the deposit amount (£40, £50, £50). Paste the URLs below.
//    Stripe will handle the entire checkout, success and cancel flow.
//
// 2) CHECKOUT SESSION (programmatic):
//    Deploy the included Vercel function `api/create-checkout-session.mjs` and
//    set STRIPE_SECRET_KEY in the Vercel project (never in the browser).
//    In `.env.local` set VITE_STRIPE_CHECKOUT_ENDPOINT to your deployed URL,
//    e.g. https://your-site.vercel.app/api/create-checkout-session
//    The client POSTs { currency, packageSlug, booking, returnOrigin }; the
//    server chooses the deposit amount from packageSlug (do not trust client
//    amounts).
//
// During development (no Stripe configured), the booking form simulates a
// successful submission and routes to /booking-success.
// ============================================================================

import type { Package } from "../data/packages";

/** Per-package Stripe Payment Link URLs. Replace `null` with real URLs. */
export const STRIPE_PAYMENT_LINKS: Record<string, string | null> = {
  "30-minute-appearance": null, // e.g. "https://buy.stripe.com/xxxxx"
  "1-hour-party": null,
  "2-hour-party": null,
};

/** Optional API endpoint that creates a Stripe Checkout Session. */
export const CHECKOUT_ENDPOINT: string | undefined = (
  import.meta.env as { VITE_STRIPE_CHECKOUT_ENDPOINT?: string }
).VITE_STRIPE_CHECKOUT_ENDPOINT;

export type BookingPayload = {
  parentName: string;
  email: string;
  phone: string;
  childName: string;
  childAge: string;
  partyDate: string;
  partyTime: string;
  address: string;
  character: string;
  packageSlug: string;
  numChildren: string;
  specialRequests: string;
};

/**
 * Redirect the user to Stripe for the deposit. Strategy:
 * 1. If a Payment Link is configured for the package, use it directly.
 * 2. Otherwise, if a CHECKOUT_ENDPOINT exists, POST and follow the returned url.
 * 3. Otherwise, fallback to a local success page (dev mode).
 */
export async function redirectToDeposit(
  pkg: Package,
  booking: BookingPayload
): Promise<void> {
  // 1. Payment Link
  const link = STRIPE_PAYMENT_LINKS[pkg.slug];
  if (link) {
    // Persist booking locally for follow-up after Stripe returns.
    sessionStorage.setItem("apd_booking", JSON.stringify(booking));
    window.location.href = link;
    return;
  }

  // 2. Checkout Session endpoint
  if (CHECKOUT_ENDPOINT) {
    try {
      sessionStorage.setItem("apd_booking", JSON.stringify(booking));
      const res = await fetch(CHECKOUT_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currency: "gbp",
          packageSlug: pkg.slug,
          booking,
          returnOrigin: window.location.origin,
        }),
      });
      if (res.ok) {
        const data = (await res.json()) as { url?: string };
        if (data.url) {
          window.location.href = data.url;
          return;
        }
      }
    } catch (e) {
      console.error("Stripe checkout failed:", e);
    }
  }

  // 3. Local fallback
  sessionStorage.setItem("apd_booking", JSON.stringify(booking));
  window.location.href = "/booking-success?dev=1";
}
