import type { BookingPayload } from "./stripe";
import { DEFAULT_OCCASION, type OccasionType } from "../data/occasions";

export const BOOKING_DRAFT_STORAGE_KEY = "apd_booking_draft";
export const BOOKING_DRAFT_CHANGED_EVENT = "apd-booking-draft-changed";

export const SLOT_HOLD_MINUTES = 15;

export type BookingDraftForm = BookingPayload & { agreeTerms: boolean; postcode: string };

export type BookingDraft = {
  version: 1;
  form: BookingDraftForm;
  slotConfirmedAt: number;
  flowStep: "form";
};

export function holdExpiresAt(slotConfirmedAt: number): number {
  return slotConfirmedAt + SLOT_HOLD_MINUTES * 60 * 1000;
}

export function holdRemainingMs(slotConfirmedAt: number): number {
  return Math.max(0, holdExpiresAt(slotConfirmedAt) - Date.now());
}

export function isDraftValid(draft: BookingDraft | null | undefined): draft is BookingDraft {
  if (!draft || draft.version !== 1 || draft.flowStep !== "form") return false;
  if (!draft.form.partyDate?.trim() || !draft.form.partyTime?.trim()) return false;
  if (!draft.slotConfirmedAt) return false;
  return holdRemainingMs(draft.slotConfirmedAt) > 0;
}

export function loadBookingDraft(): BookingDraft | null {
  try {
    const raw = sessionStorage.getItem(BOOKING_DRAFT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as BookingDraft;
    if (!isDraftValid(parsed)) {
      sessionStorage.removeItem(BOOKING_DRAFT_STORAGE_KEY);
      return null;
    }
    return parsed;
  } catch {
    sessionStorage.removeItem(BOOKING_DRAFT_STORAGE_KEY);
    return null;
  }
}

export function saveBookingDraft(draft: BookingDraft): void {
  sessionStorage.setItem(BOOKING_DRAFT_STORAGE_KEY, JSON.stringify(draft));
  notifyDraftChanged();
}

export function clearBookingDraft(): void {
  sessionStorage.removeItem(BOOKING_DRAFT_STORAGE_KEY);
  notifyDraftChanged();
}

export function notifyDraftChanged(): void {
  window.dispatchEvent(new Event(BOOKING_DRAFT_CHANGED_EVENT));
}

/** Format HH:mm (24h) for banner display. */
export function formatPartyTimeLabel(value: string): string {
  const m = /^(\d{2}):(\d{2})$/.exec(value.trim());
  if (!m) return value;
  const h24 = Number(m[1]);
  const min = m[2];
  const period = h24 >= 12 ? "pm" : "am";
  const h12 = ((h24 + 11) % 12) + 1;
  return `${h12}:${min} ${period}`;
}

export function formatPartyDateLabel(isoDate: string): string {
  if (!isoDate) return "";
  try {
    return new Date(`${isoDate}T12:00:00`).toLocaleDateString("en-GB", {
      weekday: "short",
      day: "numeric",
      month: "short",
    });
  } catch {
    return isoDate;
  }
}

export function formatCountdown(remainingMs: number): string {
  const totalSec = Math.ceil(remainingMs / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function isOccasionType(v: unknown): v is OccasionType {
  return typeof v === "string";
}

/** Normalise stored JSON into a safe draft form object. */
export function normaliseDraftForm(raw: Partial<BookingDraftForm>): BookingDraftForm {
  return {
    occasionType: isOccasionType(raw.occasionType) ? raw.occasionType : DEFAULT_OCCASION,
    parentName: String(raw.parentName ?? ""),
    email: String(raw.email ?? ""),
    phone: String(raw.phone ?? ""),
    childName: String(raw.childName ?? ""),
    childAge: String(raw.childAge ?? ""),
    partyDate: String(raw.partyDate ?? ""),
    partyTime: String(raw.partyTime ?? ""),
    address: String(raw.address ?? ""),
    postcode: String(raw.postcode ?? ""),
    character: String(raw.character ?? ""),
    packageSlug: String(raw.packageSlug ?? "1-hour-party"),
    numChildren: String(raw.numChildren ?? ""),
    specialRequests: String(raw.specialRequests ?? ""),
    agreeTerms: Boolean(raw.agreeTerms),
  };
}
