import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import Sparkles from "./Sparkles";
import { CrownIcon, WandIcon } from "./CrownIcon";

type CheckStep = {
  id: string;
  icon: string;
  durationMs: number;
  shuffle?: boolean;
  message: (dateLabel: string, timeLabel: string) => string;
};

const CHECK_STEPS: CheckStep[] = [
  {
    id: "date",
    icon: "📅",
    durationMs: 1300,
    message: (d) => `Checking ${d} for you…`,
  },
  {
    id: "time",
    icon: "🕐",
    durationMs: 1300,
    message: (_d, t) => `Seeing if ${t} is free…`,
  },
  {
    id: "diary",
    icon: "📋",
    durationMs: 1400,
    message: () => "Reading our party diary…",
  },
  {
    id: "shuffle",
    icon: "↔️",
    durationMs: 3200,
    shuffle: true,
    message: () => "Shuffling visits to fit you in…",
  },
  {
    id: "room",
    icon: "✨",
    durationMs: 1300,
    message: (d) => `Making room on ${d}…`,
  },
  {
    id: "hold",
    icon: "👑",
    durationMs: 1400,
    message: (_d, t) => `Holding ${t} for your party…`,
  },
  {
    id: "done",
    icon: "💫",
    durationMs: 1100,
    message: () => "Your slot's looking good…",
  },
];

/** Minimum time the overlay stays visible — sum of per-step durations. */
export const AVAILABILITY_CHECK_MIN_MS = CHECK_STEPS.reduce((s, step) => s + step.durationMs, 0);

const SHUFFLE_STEP_INDEX = CHECK_STEPS.findIndex((s) => s.shuffle);
const SHUFFLE_CYCLE_MS = 580;

type AvailabilityCheckingOverlayProps = {
  partyTimeLabel: string;
  partyDateLabel: string;
  /** Other diary times to flash during the shuffle step. */
  shuffleTimeLabels: string[];
};

const ORBIT_DOTS = Array.from({ length: 6 }, (_, i) => ({
  id: i,
}));

const FLOAT_BUBBLES = Array.from({ length: 8 }, (_, i) => ({
  id: i,
  left: `${12 + (i * 11) % 76}%`,
  delay: i * 0.4,
  size: 6 + (i % 3) * 4,
}));

export default function AvailabilityCheckingOverlay({
  partyTimeLabel,
  partyDateLabel,
  shuffleTimeLabels,
}: AvailabilityCheckingOverlayProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [displayTimeLabel, setDisplayTimeLabel] = useState(partyTimeLabel);

  const steps = CHECK_STEPS;
  const activeStep = steps[stepIndex] ?? steps[0];
  const isShuffling = stepIndex === SHUFFLE_STEP_INDEX;

  const shuffleSequence = useMemo(() => {
    const others = shuffleTimeLabels.filter((l) => l !== partyTimeLabel);
    return [...others, partyTimeLabel];
  }, [shuffleTimeLabels, partyTimeLabel]);

  const activeMessage = activeStep.message(partyDateLabel, partyTimeLabel);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  /* Advance one step at a time — each step lasts its own duration. */
  useEffect(() => {
    setStepIndex(0);
    setDisplayTimeLabel(partyTimeLabel);
    let cancelled = false;
    const timeouts: ReturnType<typeof setTimeout>[] = [];

    const scheduleFrom = (index: number) => {
      if (cancelled || index >= steps.length) return;
      setStepIndex(index);
      timeouts.push(
        window.setTimeout(() => scheduleFrom(index + 1), steps[index].durationMs)
      );
    };
    scheduleFrom(0);

    return () => {
      cancelled = true;
      timeouts.forEach((t) => window.clearTimeout(t));
    };
  }, [partyTimeLabel, steps]);

  /* Cycle through nearby party times during the shuffle step. */
  useEffect(() => {
    if (!isShuffling || shuffleSequence.length === 0) {
      setDisplayTimeLabel(partyTimeLabel);
      return;
    }
    let i = 0;
    setDisplayTimeLabel(shuffleSequence[0]);
    const id = window.setInterval(() => {
      i = (i + 1) % shuffleSequence.length;
      setDisplayTimeLabel(shuffleSequence[i]);
    }, SHUFFLE_CYCLE_MS);
    return () => window.clearInterval(id);
  }, [isShuffling, shuffleSequence, partyTimeLabel]);

  useEffect(() => {
    const start = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const elapsed = now - start;
      const pct = Math.min(100, (elapsed / AVAILABILITY_CHECK_MIN_MS) * 100);
      setProgress(pct);
      if (pct < 100) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);

  const content = (
    <motion.div
      role="status"
      aria-live="polite"
      aria-busy="true"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35 }}
      className="fixed inset-0 z-[70] flex flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-pinkBlush via-pinkDeep to-rose-900 text-white px-5 py-10 sm:px-8"
    >
      <Sparkles count={56} variant="white" className="opacity-85" />

      {FLOAT_BUBBLES.map((b) => (
        <motion.div
          key={b.id}
          className="absolute rounded-full bg-white/10 border border-white/20 pointer-events-none"
          style={{ left: b.left, width: b.size, height: b.size }}
          initial={{ bottom: "-5%", opacity: 0 }}
          animate={{
            bottom: ["-5%", "105%"],
            opacity: [0, 0.7, 0],
            x: [0, (b.id % 2 === 0 ? 1 : -1) * 24, 0],
          }}
          transition={{
            duration: 5 + b.id * 0.35,
            repeat: Infinity,
            delay: b.delay,
            ease: "easeInOut",
          }}
          aria-hidden
        />
      ))}

      <div
        className="absolute inset-0 opacity-30 pointer-events-none"
        aria-hidden
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% 0%, rgba(255,255,255,0.35), transparent 60%)",
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 28, scale: 0.94 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-md text-center"
      >
        <div className="mx-auto mb-6 relative w-28 h-28">
          {ORBIT_DOTS.map((dot) => (
            <motion.div
              key={dot.id}
              className="absolute left-1/2 top-1/2 w-2 h-2 -ml-1 -mt-1"
              animate={{ rotate: 360 }}
              transition={{
                duration: 4 + dot.id * 0.3,
                repeat: Infinity,
                ease: "linear",
              }}
              style={{ transformOrigin: "0 44px" }}
              aria-hidden
            >
              <motion.span
                className="block w-2 h-2 rounded-full bg-white/80 shadow-[0_0_8px_rgba(255,255,255,0.8)]"
                animate={{ scale: [0.8, 1.2, 0.8], opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.2, repeat: Infinity, delay: dot.id * 0.15 }}
              />
            </motion.div>
          ))}

          {[0, 1, 2].map((ring) => (
            <motion.div
              key={ring}
              className="absolute inset-0 rounded-full border border-white/25"
              initial={{ scale: 0.6, opacity: 0.6 }}
              animate={{ scale: [0.75, 1.35], opacity: [0.45, 0] }}
              transition={{
                duration: 2.2,
                repeat: Infinity,
                delay: ring * 0.65,
                ease: "easeOut",
              }}
              aria-hidden
            />
          ))}

          <motion.div
            className="absolute inset-2 rounded-full bg-white/15 blur-md"
            animate={{ scale: [1, 1.12, 1], opacity: [0.45, 0.9, 0.45] }}
            transition={{ duration: 2, repeat: Infinity }}
          />

          <motion.div
            className="relative flex h-28 w-28 items-center justify-center rounded-full border-2 border-white/45 bg-white/12 backdrop-blur-sm shadow-[0_16px_48px_-10px_rgba(0,0,0,0.4)]"
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
          >
            <motion.div
              animate={{ rotate: isShuffling ? [0, 6, -6, 0] : [0, 8, -8, 0] }}
              transition={{
                duration: isShuffling ? 0.9 : 3,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <CrownIcon className="w-12 h-12 drop-shadow-lg" title="" />
            </motion.div>
          </motion.div>
        </div>

        <motion.p
          className="font-cinzel uppercase tracking-[0.28em] text-[0.68rem] sm:text-xs text-white/85"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
        >
          Working on your booking
        </motion.p>

        <motion.h2
          className="font-display font-bold text-2xl sm:text-3xl mt-2 leading-tight [text-shadow:0_2px_12px_rgba(0,0,0,0.25)]"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.45 }}
        >
          We&apos;re fitting you in
        </motion.h2>

        <motion.p
          className="mt-2 text-sm text-white/85 max-w-sm mx-auto leading-relaxed"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          Our team is checking the diary and adjusting the day so your party can go ahead.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.28, type: "spring", stiffness: 260, damping: 22 }}
          className="mt-5 inline-flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3 px-4 py-3 rounded-2xl bg-white/14 border border-white/30 backdrop-blur-md text-sm sm:text-base shadow-[0_8px_32px_-8px_rgba(0,0,0,0.25)]"
        >
          <span className="inline-flex items-center gap-2 font-medium">
            <span aria-hidden className="text-lg leading-none">
              📅
            </span>
            {partyDateLabel}
          </span>
          <span className="hidden sm:inline text-white/50" aria-hidden>
            ·
          </span>
          <span className="inline-flex items-center gap-2 font-medium min-w-[5.5rem] justify-center sm:justify-start">
            <span aria-hidden className="text-lg leading-none">
              ✨
            </span>
            <AnimatePresence mode="wait">
              <motion.span
                key={displayTimeLabel}
                initial={{ opacity: 0, y: 8, filter: "blur(4px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -8, filter: "blur(4px)" }}
                transition={{ duration: 0.28 }}
                className={isShuffling && displayTimeLabel !== partyTimeLabel ? "text-pink-100" : ""}
              >
                {displayTimeLabel}
              </motion.span>
            </AnimatePresence>
          </span>
        </motion.div>

        {isShuffling && displayTimeLabel !== partyTimeLabel && (
          <motion.p
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-2 text-xs text-white/80"
          >
            Moving <span className="font-semibold text-white">{displayTimeLabel}</span> to make
            room…
          </motion.p>
        )}

        <div className="mt-7 flex justify-center gap-1.5 sm:gap-2 px-1" aria-hidden>
          {steps.map((step, i) => (
            <motion.div
              key={step.id}
              className={`flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-full border text-base ${
                i <= stepIndex
                  ? "bg-white/25 border-white/50"
                  : "bg-white/5 border-white/20 opacity-70"
              }`}
              initial={{ opacity: 0, y: 12 }}
              animate={{
                opacity: 1,
                y: 0,
                scale: i === stepIndex ? [1, 1.1, 1] : 1,
              }}
              transition={{
                delay: i * 0.05,
                scale: i === stepIndex ? { duration: 0.55, repeat: Infinity } : { duration: 0.3 },
              }}
            >
              {i < stepIndex ? (
                <span className="text-sm font-bold">✓</span>
              ) : (
                <span className="text-sm">{step.icon}</span>
              )}
            </motion.div>
          ))}
        </div>

        <div className="mt-5 min-h-[3.25rem] sm:min-h-[3.5rem] flex flex-col items-center justify-center px-2 gap-1">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeStep.id}
              initial={{ opacity: 0, y: 14, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.98 }}
              transition={{ type: "spring", stiffness: 380, damping: 28 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-2 text-center"
            >
              <motion.span
                className="text-2xl shrink-0"
                animate={{ rotate: [0, -10, 10, 0], scale: [1, 1.12, 1] }}
                transition={{ duration: 0.55 }}
              >
                {activeStep.icon}
              </motion.span>
              <p className="font-display text-lg sm:text-xl leading-snug text-white [text-shadow:0_1px_4px_rgba(0,0,0,0.2)] max-w-[18rem] sm:max-w-none">
                {activeMessage}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        <p className="text-xs text-white/75 px-2">
          Real-time calendar — we&apos;re making space for your family.
        </p>

        <div className="mt-6 mx-auto max-w-xs w-full">
          <div className="h-2 rounded-full bg-white/20 overflow-hidden relative">
            <div
              className="h-full rounded-full bg-gradient-to-r from-white via-pink-100 to-white relative overflow-hidden will-change-[width]"
              style={{ width: `${progress}%` }}
            >
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/70 to-transparent"
                animate={{ x: ["-100%", "200%"] }}
                transition={{ duration: 1.4, repeat: Infinity, ease: "linear" }}
              />
            </div>
          </div>
          <motion.p
            className="mt-2 text-xs text-white/70"
            animate={{ opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 1.8, repeat: Infinity }}
          >
            {progress < 88
              ? "Adjusting the schedule for you…"
              : "Nearly ready — thank you for waiting ✦"}
          </motion.p>
        </div>

        <motion.p
          className="mt-6 inline-flex items-center justify-center gap-2 text-xs text-white/55"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0.45, 0.85, 0.45] }}
          transition={{ duration: 2.2, repeat: Infinity, delay: 0.4 }}
        >
          <motion.span
            animate={{ rotate: [0, 15, -15, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <WandIcon className="w-4 h-4 opacity-90" />
          </motion.span>
          <span>PrincessDream</span>
        </motion.p>
      </motion.div>

      <motion.div
        className="absolute bottom-[10%] left-[6%] w-16 h-16 rounded-2xl bg-white/12 border border-white/25 backdrop-blur-sm hidden sm:flex items-center justify-center text-3xl shadow-lg"
        animate={{ rotate: [-4, 4, -4], y: [0, -8, 0] }}
        transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
        aria-hidden
      >
        <motion.span animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 1.5, repeat: Infinity }}>
          📅
        </motion.span>
      </motion.div>
      <motion.div
        className="absolute top-[14%] right-[8%] w-14 h-14 rounded-full bg-white/12 border border-white/25 backdrop-blur-sm hidden sm:flex items-center justify-center text-2xl shadow-lg"
        animate={{ scale: [1, 1.1, 1], rotate: [0, 180, 360] }}
        transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
        aria-hidden
      >
        ✦
      </motion.div>

      <span className="sr-only">
        Checking party availability for {partyDateLabel} at {partyTimeLabel}. Please wait.
      </span>
    </motion.div>
  );

  return createPortal(content, document.body);
}

/** Format YYYY-MM-DD for display in the overlay. */
export function formatPartyDateLabel(isoDate: string): string {
  if (!isoDate) return "your chosen date";
  try {
    return new Date(`${isoDate}T12:00:00`).toLocaleDateString("en-GB", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
  } catch {
    return isoDate;
  }
}
