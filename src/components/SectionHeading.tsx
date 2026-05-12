import { motion } from "framer-motion";
import type { ReactNode } from "react";

type Props = {
  eyebrow?: string;
  title: ReactNode;
  subtitle?: ReactNode;
  center?: boolean;
  className?: string;
  /** `canvas`: dusty-rose / sparkle sections (light text). `white`: white cards / white bands. */
  tone?: "canvas" | "white";
};

export default function SectionHeading({
  eyebrow,
  title,
  subtitle,
  center = true,
  className = "",
  tone = "white",
}: Props) {
  const onCanvas = tone === "canvas";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.6 }}
      className={`${center ? "text-center mx-auto max-w-3xl" : ""} ${className}`}
    >
      {eyebrow && (
        <div
          className={
            onCanvas
              ? "font-cinzel uppercase tracking-[0.3em] text-[0.72rem] text-white/90 font-semibold mb-3 drop-shadow-sm"
              : "heading-eyebrow mb-3"
          }
        >
          {eyebrow}
        </div>
      )}
      <h2
        className={`font-display font-bold tracking-tight text-3xl sm:text-4xl md:text-5xl leading-tight ${
          onCanvas ? "text-white drop-shadow-[0_2px_14px_rgba(45,20,35,0.25)]" : "text-ink"
        }`}
      >
        {title}
      </h2>
      <div
        className={`mt-5 h-px w-24 rounded-full bg-gradient-to-r from-transparent to-transparent ${
          onCanvas ? "via-white/50" : "via-pinkDeep/50"
        } ${center ? "mx-auto" : "mx-0"}`}
      />
      {subtitle && (
        <p
          className={`mt-5 text-base sm:text-lg leading-relaxed ${
            onCanvas ? "text-white/88" : "text-inkSoft"
          }`}
        >
          {subtitle}
        </p>
      )}
    </motion.div>
  );
}
