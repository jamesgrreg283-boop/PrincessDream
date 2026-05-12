import { useMemo } from "react";

type SparklesProps = {
  count?: number;
  className?: string;
  /**
   * `white` — bright white sparkles for dusty pink / dark overlays (default).
   * `gold` — warm gold sparkles; use only on white / very light section backgrounds.
   */
  variant?: "white" | "gold";
};

function mulberry32(seed: number) {
  let t = seed;
  return function () {
    t |= 0;
    t = (t + 0x6d2b79f5) | 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Lightweight CSS-only sparkles (no Framer Motion per dot — avoids hundreds of
 * concurrent JS-driven animations). Parent must be `position: relative`.
 */
export default function Sparkles({
  count = 28,
  className = "",
  variant = "white",
}: SparklesProps) {
  const items = useMemo(() => {
    const seed = variant === "gold" ? 888888 + count : 424242 + count * 997;
    const rng = mulberry32(seed);
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      top: `${rng() * 100}%`,
      left: `${rng() * 100}%`,
      size: variant === "gold" ? 3 + rng() * 8 : 4 + rng() * 12,
      /* Slightly longer, staggered cycles feel smoother than many short sync pulses */
      delay: rng() * 5,
      duration: 3.2 + rng() * 3.6,
    }));
  }, [count, variant]);

  const dotClass = variant === "gold" ? "sparkle-gold" : "sparkle";

  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute inset-0 overflow-hidden contain-paint ${className}`}
    >
      {items.map((s) => (
        <span
          key={s.id}
          className={dotClass}
          style={{
            top: s.top,
            left: s.left,
            width: s.size,
            height: s.size,
            animationDuration: `${s.duration}s`,
            animationDelay: `${s.delay}s`,
          }}
        />
      ))}
    </div>
  );
}
