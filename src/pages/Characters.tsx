import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import SEO from "../components/SEO";
import PageHeader from "../components/PageHeader";
import Sparkles from "../components/Sparkles";
import { CHARACTERS } from "../data/characters";
import { CrownIcon } from "../components/CrownIcon";

export default function Characters() {
  return (
    <>
      <SEO
        title="Our Princesses | PrincessDream Coventry"
        description="Meet our magical fairytale entertainers — princesses, fairies, the Good Witch, Movie Barbie and more. Book your favourite for parties in Coventry & Warwickshire."
        path="/characters"
      />

      <PageHeader
        eyebrow="Meet The Princesses"
        title={
          <>
            Choose Your Child's <span className="accent-text">Favourite Princess</span>
          </>
        }
        subtitle="Each of our princesses brings their own brand of magic — beautifully costumed, lovingly in-character, and adored by children of all ages."
      />

      <section className="section-pad bg-white relative overflow-hidden">
        <Sparkles count={28} variant="gold" className="opacity-40" />
        <div className="container-px max-w-7xl mx-auto space-y-16 sm:space-y-24 relative z-10">
          {CHARACTERS.map((c, i) => (
            <motion.article
              key={c.slug}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.6 }}
              className={`grid md:grid-cols-2 gap-8 lg:gap-14 items-center ${
                i % 2 === 1 ? "md:[&>*:first-child]:order-2" : ""
              }`}
            >
              <div className="relative">
                <div className="rounded-3xl overflow-hidden shadow-magical">
                  <img
                    src={c.image}
                    alt={`${c.name} — princess party entertainer`}
                    style={{ objectPosition: c.objectPosition ?? "center" }}
                    className="w-full aspect-[4/5] object-cover"
                    loading="lazy"
                  />
                </div>
                <div
                  aria-hidden
                  className="hidden md:block absolute -z-10 -inset-4 rounded-[2.5rem] opacity-30"
                  style={{ background: `linear-gradient(135deg, ${c.color}, transparent)` }}
                />
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <CrownIcon className="w-8 h-8" />
                  <div className="heading-eyebrow">Princess</div>
                </div>
                <h2 className="heading-display text-3xl sm:text-4xl lg:text-5xl mt-3">
                  {c.name}
                </h2>
                <div className="accent-hr mx-0 mt-4" />
                <p className="mt-5 text-ink/85 text-base leading-relaxed">{c.bio}</p>
                <p className="mt-4 text-inkSoft text-sm italic">{c.shortDesc}</p>
                <div className="mt-7 flex flex-wrap gap-3">
                  <Link
                    to={`/book?character=${c.slug}`}
                    className="btn-primary"
                  >
                    Book {c.name}
                  </Link>
                  <Link to="/packages" className="btn-secondary">
                    View Packages
                  </Link>
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      </section>
    </>
  );
}
