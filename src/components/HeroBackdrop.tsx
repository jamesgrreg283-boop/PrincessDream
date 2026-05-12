/**
 * Hero “collage”: six sharp portrait panels (local PNGs) + brand-colour wash.
 * No backdrop-filter / mix-blend / blur on the stack — only gradients for text contrast.
 */
const PANEL_Q = "?v=collage-v1";

const PANELS = [
  `/hero-collage/01.png${PANEL_Q}`,
  `/hero-collage/02.png${PANEL_Q}`,
  `/hero-collage/03.png${PANEL_Q}`,
  `/hero-collage/04.png${PANEL_Q}`,
  `/hero-collage/05.png${PANEL_Q}`,
  `/hero-collage/06.png${PANEL_Q}`,
] as const;

export default function HeroBackdrop() {
  return (
    <div className="absolute inset-0 overflow-hidden" aria-hidden>
      {/* Base wash (twilight rose) — fills seams if any panel is slow to paint */}
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(
            165deg,
            #1a0f18 0%,
            #4a1535 28%,
            #9d2460 52%,
            #c995ae 100%
          )`,
        }}
      />

      <div className="absolute inset-0 grid h-full min-h-[20rem] grid-cols-3 grid-rows-2 gap-px bg-ink/80 sm:min-h-0 sm:grid-cols-6 sm:grid-rows-1">
        {PANELS.map((src, i) => (
          <div key={i} className="relative min-h-0 min-w-0 overflow-hidden">
            <img
              src={src}
              alt=""
              loading={i < 3 ? "eager" : "lazy"}
              decoding="async"
              fetchPriority={i === 0 ? "high" : undefined}
              className="absolute inset-0 h-full w-full object-cover object-center"
              sizes="(max-width: 640px) 34vw, 17vw"
            />
          </div>
        ))}
      </div>

      {/* Unify + keep existing palette: magenta rose, ink, gold hint — no blur */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: `
            linear-gradient(
              180deg,
              rgba(18, 10, 20, 0.52) 0%,
              rgba(42, 27, 45, 0.12) 38%,
              rgba(216, 27, 96, 0.18) 72%,
              rgba(42, 27, 45, 0.55) 100%
            )
          `,
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-80"
        style={{
          background: `
            radial-gradient(ellipse 100% 55% at 50% -5%, rgba(252, 228, 236, 0.22) 0%, transparent 50%),
            radial-gradient(ellipse 45% 35% at 92% 30%, rgba(241, 216, 122, 0.12) 0%, transparent 55%),
            radial-gradient(ellipse 40% 30% at 8% 35%, rgba(219, 39, 119, 0.14) 0%, transparent 50%)
          `,
        }}
      />

      {/* Pinkish veil — stronger text legibility on white copy */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: `
            linear-gradient(
              195deg,
              rgba(190, 24, 93, 0.42) 0%,
              rgba(216, 27, 96, 0.28) 35%,
              rgba(248, 187, 208, 0.22) 62%,
              rgba(252, 228, 236, 0.14) 100%
            )
          `,
        }}
      />

      {/* Sparkle accents (vector only) */}
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full text-white/75"
        viewBox="0 0 1440 900"
        preserveAspectRatio="xMidYMid slice"
      >
        <g fill="currentColor" opacity={0.4}>
          <circle cx="100" cy="120" r="2" />
          <circle cx="310" cy="80" r="1.5" />
          <circle cx="520" cy="160" r="2" />
          <circle cx="720" cy="70" r="1.5" />
          <circle cx="940" cy="130" r="2.5" />
          <circle cx="1180" cy="90" r="1.5" />
          <circle cx="1340" cy="150" r="2" />
        </g>
        <g fill="currentColor" opacity={0.5}>
          <path d="M1320 80l2.5 7 7 2-7 2-2.5 7-2.5-7-7-2 7-2z" />
          <path d="M160 240l2 5 5 1.5-5 1.5-2 5-2-5-5-1.5 5-1.5z" />
        </g>
      </svg>
    </div>
  );
}
