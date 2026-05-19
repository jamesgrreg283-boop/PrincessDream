/**
 * Google Ads conversion events — uses `window.gtag` from `index.html` (Google tag loads
 * AW-18168449127 + GA4). Conversion `send_to` uses env vars; do not hardcode the label.
 */

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

function getAdsId(): string | undefined {
  const v = import.meta.env.NEXT_PUBLIC_GOOGLE_ADS_ID;
  return typeof v === "string" && v.trim() ? v.trim() : undefined;
}

function getConversionLabel(): string | undefined {
  const v = import.meta.env.NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_LABEL;
  return typeof v === "string" && v.trim() ? v.trim() : undefined;
}

export function isGoogleAdsConversionConfigured(): boolean {
  return Boolean(getAdsId() && getConversionLabel());
}

/** Stripe deposit success — value in GBP, transaction_id = Checkout Session id (`cs_…`). */
export function fireGoogleAdsDepositConversion(params: {
  value: number;
  transactionId: string;
}): void {
  const id = getAdsId();
  const label = getConversionLabel();
  if (!id || !label || typeof window.gtag !== "function") return;
  window.gtag("event", "conversion", {
    send_to: `${id}/${label}`,
    value: params.value,
    currency: "GBP",
    transaction_id: params.transactionId,
  });
}
