import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { depositFor, type Package } from "../data/packages";
import { CrownIcon } from "./CrownIcon";

export default function PackageCard({
  pkg,
  index = 0,
}: {
  pkg: Package;
  index?: number;
}) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.55, delay: index * 0.08 }}
      className={`relative rounded-3xl p-7 sm:p-8 bg-white border transition-all duration-300
        hover:-translate-y-1 ${
          pkg.popular
            ? "border-transparent shadow-magical ring-2 ring-pinkDeep/35 bg-gradient-to-b from-white to-pinkSoft/40"
            : "border-pinkSoft/70 shadow-soft hover:shadow-magical"
        }`}
    >
      {pkg.popular && (
        <div
          aria-hidden
          className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full text-[11px] font-cinzel uppercase tracking-[0.2em] bg-accent-btn text-white shadow-[0_12px_32px_-10px_rgba(219,39,119,0.45)]"
        >
          ★ Most Popular
        </div>
      )}

      <div className="flex items-center justify-between">
        <CrownIcon className="w-10 h-10" />
        <div className="text-right">
          <div className="font-cinzel uppercase tracking-widest text-[10px] text-pinkDeep">
            {pkg.duration}
          </div>
        </div>
      </div>

      <h3 className="heading-display text-2xl sm:text-3xl mt-4">{pkg.name}</h3>
      <p className="text-inkSoft mt-2 text-sm">{pkg.tagline}</p>

      <div className="mt-6 flex items-baseline gap-2">
        <span className="text-5xl font-display font-bold accent-text">
          £{pkg.price}
        </span>
      </div>
      <div className="text-xs text-inkSoft mt-1">
        Online deposit secures your booking · £{depositFor(pkg)} today
      </div>

      <ul className="mt-6 space-y-2.5">
        {pkg.includes.map((item) => (
          <li key={item} className="flex items-start gap-3 text-sm text-ink">
            <span className="mt-1 w-4 h-4 grid place-items-center rounded-full bg-accent-btn text-white text-[10px] flex-shrink-0">
              ✓
            </span>
            <span>{item}</span>
          </li>
        ))}
      </ul>

      <Link
        to={`/book?package=${pkg.slug}`}
        className={`mt-7 w-full justify-center ${
          pkg.popular ? "btn-primary" : "btn-secondary"
        }`}
      >
        Book This Package
      </Link>
    </motion.article>
  );
}
