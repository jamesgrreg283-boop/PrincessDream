import { useMemo } from "react";

/**
 * Darker pink canvas (global `pagePink` body) + soft white cloud bokeh and
 * white sparkle stars. No pink hearts — clouds + stars only.
 */

type Props = {
  opacity?: number;
  className?: string;
};

/** White / pearl cloud cores — read as fluffy clouds on dusty rose */
const CLOUD_COLORS = [
  "rgba(255, 255, 255, 0.52)",
  "rgba(255, 252, 250, 0.48)",
  "rgba(255, 248, 252, 0.58)",
  "rgba(255, 255, 255, 0.38)",
  "rgba(252, 245, 250, 0.45)",
];

const STAR_FILLS = [
  "rgba(255, 255, 255, 0.98)",
  "rgba(255, 255, 255, 0.88)",
  "rgba(255, 252, 254, 0.92)",
  "rgba(255, 255, 255, 0.72)",
];

const STAR_PATH =
  "M12 1.2l2.1 7.9 8.1 2.2-8.1 2.1L12 21l-2.1-7.5-8.1-2.1 8.1-2.2z";

const STAR_GLOW = "drop-shadow(0 0 4px rgba(255,255,255,0.85))";

export default function PrincessBackdrop({
  opacity = 1,
  className = "",
}: Props) {
  const decor = useMemo(() => {
    const clouds = (() => {
      const rng = mulberry32(7779311);
      return Array.from({ length: 12 }, (_, i) => ({
        id: `c${i}`,
        i,
        top: rng() * 100,
        left: rng() * 100,
        size: 200 + rng() * 440,
        color: CLOUD_COLORS[Math.floor(rng() * CLOUD_COLORS.length)],
        blur: 6 + rng() * 8,
        layerOpacity: 0.5 + rng() * 0.38,
      }));
    })();

    const stars = (() => {
      const rng = mulberry32(9912345);
      return Array.from({ length: 28 }, (_, i) => ({
        id: `s${i}`,
        top: rng() * 100,
        left: rng() * 100,
        size: 5 + rng() * 12,
        fill: STAR_FILLS[Math.floor(rng() * STAR_FILLS.length)],
        duration: 3 + rng() * 2.6,
        delay: rng() * 5,
      }));
    })();

    return { clouds, stars };
  }, []);

  return (
    <div
      aria-hidden
      className={`absolute inset-0 pointer-events-none overflow-hidden z-0 contain-paint ${className}`}
      style={{ opacity }}
    >
      {/* Slight depth without washing out the darker pink */}
      <div
        className="absolute inset-0 bg-gradient-to-b from-white/[0.06] via-transparent to-white/[0.04]"
        aria-hidden
      />
      {decor.clouds.map((c) => (
        <div
          key={c.id}
          className="absolute rounded-full"
          style={{
            top: `${c.top}%`,
            left: `${c.left}%`,
            width: c.size,
            height: c.size * (0.72 + (c.i % 5) * 0.04),
            marginTop: -(c.size * 0.36) / 2,
            marginLeft: -c.size / 2,
            background: `radial-gradient(ellipse 70% 65% at 50% 48%, ${c.color} 0%, transparent 72%)`,
            opacity: c.layerOpacity,
            filter: `blur(${c.blur}px)`,
          }}
        />
      ))}

      {decor.stars.map((s) => (
        <svg
          key={s.id}
          viewBox="0 0 24 24"
          className="absolute apd-backdrop-star"
          style={{
            top: `${s.top}%`,
            left: `${s.left}%`,
            width: s.size,
            height: s.size,
            marginTop: -s.size / 2,
            marginLeft: -s.size / 2,
            fill: s.fill,
            filter: STAR_GLOW,
            animation: `apd-pulse-star ${s.duration}s ease-in-out ${s.delay}s infinite`,
          }}
        >
          <path d={STAR_PATH} />
        </svg>
      ))}
    </div>
  );
}

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
