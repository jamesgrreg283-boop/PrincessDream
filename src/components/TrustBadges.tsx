import type { ReactElement } from "react";
import { motion } from "framer-motion";

const ICONS: Record<string, ReactElement> = {
  shield: (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M12 2l8 3v6c0 5-3.5 9-8 11-4.5-2-8-6-8-11V5l8-3z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  ),
  check: (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <circle cx="12" cy="12" r="10" />
      <path d="M8 12l3 3 5-6" />
    </svg>
  ),
  star: (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor" aria-hidden>
      <path d="M12 2l2.9 6.9L22 10l-5.5 4.8L18.2 22 12 18.3 5.8 22l1.7-7.2L2 10l7.1-1.1L12 2z" />
    </svg>
  ),
  sparkles: (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor" aria-hidden>
      <path d="M12 2l1.5 5 5 1.5-5 1.5L12 15l-1.5-5-5-1.5 5-1.5L12 2zM19 14l.8 2.2 2.2.8-2.2.8L19 20l-.8-2.2-2.2-.8 2.2-.8L19 14zM5 14l.8 2.2 2.2.8-2.2.8L5 20l-.8-2.2L2 17l2.2-.8L5 14z" />
    </svg>
  ),
};

type Item = { label: string; icon: string };

export default function TrustBadges({
  items,
  variant = "light",
  className = "",
}: {
  items: ReadonlyArray<Item>;
  variant?: "light" | "dark";
  className?: string;
}) {
  return (
    <ul
      className={`flex flex-wrap items-center justify-center gap-2 sm:gap-3 ${className}`}
    >
      {items.map((b, i) => (
        <motion.li
          key={b.label}
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.07 }}
          className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-medium
            ${variant === "light"
              ? "bg-white/85 backdrop-blur-sm text-ink border border-pinkSoft shadow-soft"
              : "bg-white/15 text-white border border-white/30"
            }`}
        >
          <span className={variant === "light" ? "text-pinkDeep" : "text-white"}>
            {ICONS[b.icon]}
          </span>
          {b.label}
        </motion.li>
      ))}
    </ul>
  );
}
