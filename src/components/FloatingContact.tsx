import { motion } from "framer-motion";
import { SITE } from "../data/site";

/**
 * Persistent floating Call + Email buttons (desktop & mobile).
 * Bottom-right, with a small offset above the mobile sticky CTA.
 */
export default function FloatingContact() {
  return (
    <div className="fixed right-4 bottom-24 lg:bottom-6 z-40 flex flex-col gap-3">
      <motion.a
        href={`tel:${SITE.phoneTel}`}
        aria-label={`Call ${SITE.name}`}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        className="w-14 h-14 rounded-full bg-accent-btn shadow-[0_12px_32px_-10px_rgba(219,39,119,0.45)] grid place-items-center text-white"
      >
        <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor" aria-hidden>
          <path d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.3 1.2.4 2.4.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1A18 18 0 0 1 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.3 1l-2.2 2.2z" />
        </svg>
      </motion.a>
      <motion.a
        href={`mailto:${SITE.email}`}
        aria-label={`Email ${SITE.name}`}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        className="w-14 h-14 rounded-full bg-white border-2 border-pinkBlush shadow-soft grid place-items-center text-pinkDeep"
      >
        <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <path d="M3 7l9 6 9-6" />
        </svg>
      </motion.a>
    </div>
  );
}
