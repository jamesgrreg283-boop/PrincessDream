import { Link } from "react-router-dom";
import { AUGUST_OFFER, isAugustOfferActive } from "../data/augustOffer";

/**
 * Site-wide promo strip. Renders nothing when the August offer is inactive.
 */
export default function AugustOfferBanner() {
  if (!isAugustOfferActive()) return null;

  return (
    <div className="relative z-[60] bg-[#9d174d] text-white shadow-[inset_0_-1px_0_rgba(0,0,0,0.12)]">
      <div className="absolute inset-0 bg-gradient-to-b from-black/10 to-transparent pointer-events-none" aria-hidden />
      <div className="relative container-px max-w-7xl mx-auto py-3.5 sm:py-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 lg:gap-6">
        <div className="min-w-0 text-center lg:text-left">
          <p className="font-cinzel text-[11px] sm:text-xs uppercase tracking-[0.22em] font-semibold text-white">
            {AUGUST_OFFER.title}
          </p>
          <p className="font-display text-base sm:text-lg md:text-xl font-bold leading-snug mt-1 text-white [text-shadow:0_1px_2px_rgba(0,0,0,0.25)]">
            {AUGUST_OFFER.headline}
          </p>
          <ul className="mt-2.5 flex flex-col sm:flex-row sm:flex-wrap justify-center lg:justify-start gap-1.5 sm:gap-x-5 sm:gap-y-1.5 text-[13px] sm:text-sm font-medium text-white leading-snug">
            {AUGUST_OFFER.bullets.map((b) => (
              <li key={b} className="inline-flex items-start sm:items-center gap-2 justify-center lg:justify-start">
                <span
                  aria-hidden
                  className="mt-0.5 sm:mt-0 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-white text-[#9d174d] text-[10px] font-bold"
                >
                  ✓
                </span>
                <span>{b}</span>
              </li>
            ))}
          </ul>
        </div>
        <Link
          to="/book"
          className="shrink-0 self-center lg:self-auto inline-flex items-center justify-center rounded-full bg-white text-[#9d174d] font-semibold text-sm px-5 py-2.5 shadow-md hover:bg-pinkPale transition-colors"
        >
          Book &amp; save 15%
        </Link>
      </div>
    </div>
  );
}
