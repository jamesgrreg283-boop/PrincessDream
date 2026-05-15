import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import SEO from "../components/SEO";
import PageHeader from "../components/PageHeader";
import Sparkles from "../components/Sparkles";
import { AREAS } from "../data/areas";
import { CrownIcon } from "../components/CrownIcon";

export default function Areas() {
  return (
    <>
      <SEO
        title="Areas We Cover | Princess Parties Coventry & Warwickshire"
        description="We bring princess parties to Coventry, Leamington Spa, Bedworth, Nuneaton, Kenilworth and surrounding areas. Professional DBS-checked entertainers."
        path="/areas"
      />

      <PageHeader
        eyebrow="Where We Sparkle"
        title={
          <>
            Princess Parties Across <span className="accent-text">Coventry</span> & Warwickshire
          </>
        }
        subtitle="We bring magical princess parties across Coventry and surrounding areas — including Leamington Spa, Bedworth, Nuneaton and Kenilworth."
      />

      <section className="section-pad bg-white relative overflow-hidden">
        <Sparkles count={28} variant="gold" className="opacity-40" />
        <div className="container-px max-w-7xl mx-auto relative z-10">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {AREAS.map((a, i) => (
              <motion.div
                key={a.slug}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.06 }}
                className="card-magical p-7 flex flex-col"
              >
                <CrownIcon className="w-10 h-10" />
                <h2 className="heading-display text-2xl mt-3">{a.headline}</h2>
                <div className="accent-hr mx-0 mt-3" />
                <p className="text-inkSoft mt-4 text-sm leading-relaxed flex-1">
                  {a.intro}
                </p>
                <Link
                  to={`/areas/${a.slug}`}
                  className="btn-secondary mt-6 text-sm py-3"
                >
                  Learn More
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
