import { randomUUID } from "node:crypto";
import { packageBySlug } from "./packages.mjs";
import {
  augustPromoRemaining,
  augustPromoTotal,
  isAugustOfferActive,
} from "./augustOffer.mjs";

/**
 * In-memory row only — not inserted into Supabase. Matches booking shape used by email templates.
 * @param {{ packageSlug: string; customerEmail: string }} opts
 */
export function buildSyntheticTestBooking(opts) {
  const packageSlug = String(opts?.packageSlug || "").trim();
  const customerEmail = String(opts?.customerEmail || "").trim();
  const pkg = packageBySlug(packageSlug);
  if (!pkg || !customerEmail) return null;

  const party = new Date();
  party.setDate(party.getDate() + 14);
  const party_date = party.toISOString().slice(0, 10);

  const deposit = pkg.depositOnline;
  const total = isAugustOfferActive() ? augustPromoTotal(pkg) : pkg.price;
  const remaining = isAugustOfferActive()
    ? augustPromoRemaining(pkg)
    : pkg.price - pkg.depositOnline;

  return {
    id: randomUUID(),
    parent_name: "Test Parent",
    email: customerEmail,
    phone: "07871111222",
    child_name: "Test Child",
    child_age: "5",
    party_date,
    party_start_time: "12:00",
    address: "123 Example Street, Coventry",
    postcode: "CV1 1AA",
    selected_character: "elsa",
    selected_package: packageSlug,
    total_price: total,
    deposit_amount: deposit,
    remaining_balance: remaining,
    notes: "[TEST] Synthetic booking — sent from admin email test tool. Not a live Stripe payment.",
    status: "confirmed",
    stripe_session_id: null,
    stripe_payment_intent_id: null,
    created_at: new Date().toISOString(),
    confirmation_emails_sent_at: null,
    hold_expires_at: null,
  };
}
