import { Link, useLocation } from "react-router-dom";

/**
 * Persistent bottom Book Now button — mobile only.
 * Hidden on the booking page itself.
 */
export default function StickyMobileCTA() {
  const { pathname } = useLocation();
  if (pathname.startsWith("/book")) return null;

  return (
    <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 px-4 pb-4 pt-3 bg-gradient-to-t from-white via-white/95 to-white/70 backdrop-blur-md border-t border-pinkSoft">
      <Link
        to="/book"
        className="btn-primary w-full justify-center text-base py-4 shadow-magical"
      >
        Book Your Magical Party
      </Link>
    </div>
  );
}
