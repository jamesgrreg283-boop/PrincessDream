import { motion } from "framer-motion";
import type { ReactNode } from "react";
import Sparkles from "./Sparkles";
import { WandIcon } from "./CrownIcon";

type Props = {
  eyebrow?: string;
  title: ReactNode;
  subtitle?: ReactNode;
};

export default function PageHeader({ eyebrow, title, subtitle }: Props) {
  return (
    <section className="relative overflow-hidden bg-white">
      <Sparkles count={28} variant="gold" className="opacity-50" />
      <div className="container-px max-w-5xl mx-auto pt-20 sm:pt-28 pb-16 sm:pb-20 text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <WandIcon className="w-12 h-12 mx-auto" />
          {eyebrow && <div className="heading-eyebrow mt-4">{eyebrow}</div>}
          <h1 className="heading-display text-4xl sm:text-5xl lg:text-6xl mt-3 text-ink">
            {title}
          </h1>
          <div className="accent-hr mt-5" />
          {subtitle && (
            <p className="mt-5 max-w-2xl mx-auto text-inkSoft text-base sm:text-lg leading-relaxed">
              {subtitle}
            </p>
          )}
        </motion.div>
      </div>
    </section>
  );
}
