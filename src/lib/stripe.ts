// ============================================================================
// Stripe Configuration
// ----------------------------------------------------------------------------
// Two ways to enable real Stripe payments:
//
// 1) HOSTED PAYMENT LINKS (easiest — recommended to start):
//    Create three Payment Links in your Stripe Dashboard (one per package),
//    each charging the deposit amount (£1 test / £50 / £50 for 30-min / 1hr / 2hr). Paste the URLs below.
//    Stripe will handle the entire checkout, success and cancel flow.
//
// 2) CHECKOUT SESSION (programmatic):
//    Deploy `api/create-checkout-session.mjs` (e.g. on Vercel) and set
//    STRIPE_SECRET_KEY (+ optional STRIPE_PRICE_* ) on the host.
//    In production, if `VITE_STRIPE_CHECKOUT_ENDPOINT` is unset, the client
//    POSTs to same-origin `/api/create-checkout-session` (works on Vercel
//    with the API in this repo). Override with `VITE_STRIPE_CHECKOUT_ENDPOINT`
//    when the API lives on another domain.
//
// During development (no Stripe configured), the booking form simulates a
// successful submission and routes to /booking-success.
// ============================================================================

import type { Package } from "../data/packages";

/** Shown on `/book?checkout_error=1` after a failed Checkout Session POST. */
export const CHECKOUT_ERROR_STORAGE_KEY = "apd_checkout_error";

/** Per-package Stripe Payment Link URLs. Replace `null` with real URLs. */
export const STRIPE_PAYMENT_LINKS: Record<string, string | null> = {
  "30-minute-appearance": null, // e.g. "https://buy.stripe.com/xxxxx"
  "1-hour-party": null,
  "2-hour-party": null,
};

/**
 * `VITE_STRIPE_CHECKOUT_ENDPOINT` must be the full URL to the API route, e.g.
 * `https://example.com/api/create-checkout-session`. If it is only the site
 * root (missing `/api/...`), we ignore it so POST does not hit the homepage.
 */
function viteCheckoutOverride(): string | undefined {
  const raw = (
    import.meta.env as { VITE_STRIPE_CHECKOUT_ENDPOINT?: string }
  ).VITE_STRIPE_CHECKOUT_ENDPOINT?.trim();
  if (!raw) return undefined;
  try {
    const u = new URL(raw);
    if (!u.pathname.includes("create-checkout-session")) return undefined;
    return u.href.replace(/\/$/, "");
  } catch {
    return undefined;
  }
}

/**
 * Where to POST to create a Stripe Checkout Session.
 * - Optional `VITE_STRIPE_CHECKOUT_ENDPOINT` when the API is on another host.
 * - In production builds, default to same-origin `/api/...` on Vercel.
 */
function checkoutSessionUrl(): string | undefined {
  const fromEnv = viteCheckoutOverride();
  if (fromEnv) return fromEnv;
  if (import.meta.env.PROD) {
    return `${window.location.origin}/api/create-checkout-session`;
  }
  return undefined;
}

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
 * 2. Otherwise POST to the Checkout Session URL (see `checkoutSessionUrl()`).
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
  const checkoutUrl = checkoutSessionUrl();
  if (checkoutUrl) {
    try {
      sessionStorage.setItem("apd_booking", JSON.stringify(booking));
      const res = await fetch(checkoutUrl, {
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
        sessionStorage.setItem(
          CHECKOUT_ERROR_STORAGE_KEY,
          "The payment service did not return a checkout link. Please try again or call us."
        );
      } else {
        let msg = `Payment could not start (error ${res.status}). Please try again or call us.`;
        try {
          const errBody = (await res.json()) as { error?: string; message?: string };
          if (errBody?.message) msg = errBody.message;
          else if (errBody?.error) msg = errBody.error;
          else if (res.status === 409) {
            msg =
              "That date and time is no longer available. Please choose another slot.";
          }
        } catch {
          if (res.status === 409) {
            msg =
              "That date and time is no longer available. Please choose another slot.";
          }
        }
        sessionStorage.setItem(CHECKOUT_ERROR_STORAGE_KEY, msg);
      }
      window.location.href = "/book?checkout_error=1";
      return;
    } catch (e) {
      console.error("Stripe checkout failed:", e);
      sessionStorage.setItem(
        CHECKOUT_ERROR_STORAGE_KEY,
        "We couldn't reach the payment service. Check your connection and try again, or call us to book."
      );
      window.location.href = "/book?checkout_error=1";
      return;
    }
  }

  // 3. Local fallback (no API URL — e.g. `npm run dev` without env)
  sessionStorage.setItem("apd_booking", JSON.stringify(booking));
  window.location.href = "/booking-success?dev=1";
}
