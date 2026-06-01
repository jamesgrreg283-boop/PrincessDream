import { useCallback, useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  BOOKING_DRAFT_CHANGED_EVENT,
  clearBookingDraft,
  formatCountdown,
  formatPartyDateLabel,
  formatPartyTimeLabel,
  holdRemainingMs,
  isDraftValid,
  loadBookingDraft,
  type BookingDraft,
} from "../lib/bookingDraft";

const HIDDEN_PATHS = new Set(["/book", "/contact", "/booking-success"]);

export default function BookingResumeBanner() {
  const { pathname } = useLocation();
  const [draft, setDraft] = useState<BookingDraft | null>(null);
  const [remainingMs, setRemainingMs] = useState(0);

  const refresh = useCallback(() => {
    const loaded = loadBookingDraft();
    if (!isDraftValid(loaded)) {
      setDraft(null);
      return;
    }
    setDraft(loaded);
    setRemainingMs(holdRemainingMs(loaded.slotConfirmedAt));
  }, []);

  useEffect(() => {
    refresh();
    const onChange = () => refresh();
    window.addEventListener(BOOKING_DRAFT_CHANGED_EVENT, onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener(BOOKING_DRAFT_CHANGED_EVENT, onChange);
      window.removeEventListener("storage", onChange);
    };
  }, [refresh, pathname]);

  useEffect(() => {
    if (!draft) return;
    let frame = 0;
    const tick = () => {
      const remaining = holdRemainingMs(draft.slotConfirmedAt);
      setRemainingMs(remaining);
      if (remaining <= 0) {
        clearBookingDraft();
        setDraft(null);
        return;
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [draft]);

  if (!draft || HIDDEN_PATHS.has(pathname)) return null;

  const dateLabel = formatPartyDateLabel(draft.form.partyDate);
  const timeLabel = formatPartyTimeLabel(draft.form.partyTime);
  const urgent = remainingMs <= 5 * 60 * 1000;

  return (
    <div
      className={`relative z-40 border-b ${
        urgent
          ? "bg-amber-50 border-amber-200 text-amber-950"
          : "bg-pinkPale border-pinkSoft text-ink"
      }`}
      role="status"
    >
      <div className="container-px max-w-7xl mx-auto py-2.5 sm:py-3 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
        <div className="flex-1 min-w-0 text-sm leading-snug">
          <span className="font-semibold text-pinkDeep">Booking in progress</span>
          <span className="hidden sm:inline text-inkSoft"> — </span>
          <span className="block sm:inline text-ink/90 mt-0.5 sm:mt-0">
            {dateLabel} at {timeLabel}
          </span>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right">
            <p className="text-[0.65rem] uppercase tracking-wider font-semibold text-inkSoft">
              Time left
            </p>
            <p
              className={`font-display font-bold text-xl tabular-nums leading-none ${
                urgent ? "text-amber-700" : "text-pinkDeep"
              }`}
            >
              {formatCountdown(remainingMs)}
            </p>
          </div>
          <Link
            to="/book"
            className={`btn-primary text-sm py-2.5 px-5 whitespace-nowrap ${
              urgent ? "!bg-amber-600 hover:!bg-amber-700" : ""
            }`}
          >
            Resume booking
          </Link>
        </div>
      </div>
    </div>
  );
}
