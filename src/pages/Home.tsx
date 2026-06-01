import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import SEO from "../components/SEO";
import HeroBackdrop from "../components/HeroBackdrop";
import Sparkles from "../components/Sparkles";
import PrincessBackdrop from "../components/PrincessBackdrop";
import SectionHeading from "../components/SectionHeading";
import CharacterCard from "../components/CharacterCard";
import PackageCard from "../components/PackageCard";
import ReviewCard from "../components/ReviewCard";
import TrustBadges from "../components/TrustBadges";
import { CrownIcon, WandIcon } from "../components/CrownIcon";
import { CHARACTERS } from "../data/characters";
import { PACKAGES } from "../data/packages";
import { REVIEWS } from "../data/reviews";
import { AREAS } from "../data/areas";
import { SITE, TRUST_BADGES } from "../data/site";

const STEPS = [
  { n: "1", title: "Submit booking request", desc: "Fill out our quick magical booking form online." },
  { n: "2", title: "Confirm date & details", desc: "We'll reply quickly to confirm your princess and date." },
  { n: "3", title: "Pay your deposit securely", desc: "Lock in your date with a small, secure online deposit." },
  { n: "4", title: "Princess creates magic", desc: "Sit back as your princess arrives and dazzles the children." },
  { n: "5", title: "Remaining balance on the day", desc: "Pay the balance in cash on the day — that's it!" },
];

export default function Home() {
  return (
    <>
      <SEO
        title="PrincessDream | Princess Parties in Coventry & Warwickshire"
        description="Magical princess parties in Coventry, Leamington Spa, Bedworth, Nuneaton & Kenilworth. Professional, DBS-checked entertainers. Book online from £100."
        path="/"
      />

      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <HeroBackdrop />
        </div>
        <Sparkles count={40} variant="white" className="opacity-90" />

        <div className="relative z-10 container-px max-w-7xl mx-auto py-24 sm:py-32 lg:py-40 text-center text-white">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 border border-white/35 text-white text-xs sm:text-sm font-cinzel uppercase tracking-[0.25em] [text-shadow:0_1px_2px_rgba(0,0,0,0.5)]"
          >
            <CrownIcon className="w-4 h-4" />
            Coventry's Most Magical Princess Parties
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="font-display font-bold text-4xl sm:text-6xl lg:text-7xl mt-6 leading-[1.05] [text-shadow:0_2px_8px_rgba(0,0,0,0.45),0_1px_2px_rgba(0,0,0,0.6)]"
          >
            Make Your Child's Birthday
            <br />
            <span className="text-pink-100 [text-shadow:0_1px_4px_rgba(0,0,0,0.45)]">Truly Magical</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="mt-6 max-w-2xl mx-auto text-base sm:text-lg text-white/95 leading-relaxed [text-shadow:0_1px_3px_rgba(0,0,0,0.45)]"
          >
            Professional princess entertainers bringing unforgettable fairytale
            experiences to Coventry and surrounding areas.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="mt-10 w-full max-w-lg sm:max-w-3xl mx-auto px-1 sm:px-0"
          >
            <div className="flex flex-col sm:flex-row items-stretch justify-center gap-3">
              <Link
                to="/book"
                className="btn-primary text-base w-full sm:flex-1 min-h-[3rem] px-5 justify-center"
              >
                <WandIcon className="w-5 h-5 shrink-0" />
                Check Availability
              </Link>
              <Link
                to="/characters"
                className="btn-secondary text-base w-full sm:flex-1 min-h-[3rem] px-5 justify-center bg-white/95 hover:bg-white border-white/90 text-pinkDeep shadow-soft"
              >
                <CrownIcon className="w-5 h-5 shrink-0" />
                Characters
              </Link>
              <Link
                to="/#packages"
                className="btn-secondary text-base w-full sm:flex-1 min-h-[3rem] px-5 justify-center bg-white/90 hover:bg-white border-white/80"
              >
                See Packages &amp; Pricing
              </Link>
            </div>
          </motion.div>

          <div className="mt-12">
            <TrustBadges items={TRUST_BADGES} variant="dark" />
          </div>
        </div>

        <svg
          aria-hidden
          viewBox="0 0 1440 80"
          className="absolute -bottom-px inset-x-0 w-full text-pagePink z-10"
          preserveAspectRatio="none"
        >
          <path
            fill="currentColor"
            d="M0,40 C320,80 720,0 1080,40 C1260,60 1380,40 1440,30 L1440,80 L0,80 Z"
          />
        </svg>
      </section>

      <section className="section-pad relative overflow-hidden">
        <PrincessBackdrop />
        <Sparkles count={32} variant="white" className="opacity-55" />
        <div className="container-px max-w-7xl mx-auto relative z-10">
          <SectionHeading
            tone="canvas"
            eyebrow="Meet Our Princesses"
            title={
              <>
                Featured <span className="accent-text">Princess</span> Characters
              </>
            }
            subtitle="Each princess is beautifully costumed and lovingly in-character. Choose your child's favourite — or let us suggest a magical surprise!"
          />
          <div className="mt-14 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {CHARACTERS.map((c, i) => (
              <CharacterCard key={c.slug} character={c} index={i} />
            ))}
          </div>
          <div className="mt-12 w-full max-w-md sm:max-w-xl mx-auto flex flex-col sm:flex-row items-stretch justify-center gap-3">
            <Link
              to="/characters"
              className="btn-primary text-base w-full sm:flex-1 min-h-[3rem] justify-center"
            >
              View All Characters
            </Link>
            <Link
              to="/book"
              className="btn-secondary text-base w-full sm:flex-1 min-h-[3rem] justify-center"
            >
              Check Availability
            </Link>
          </div>
        </div>
      </section>

      <section id="packages" className="section-pad bg-white relative overflow-hidden scroll-mt-24">
        <Sparkles count={28} variant="gold" className="opacity-50" />
        <div className="container-px max-w-7xl mx-auto relative z-10">
          <SectionHeading
            tone="white"
            eyebrow="Our Magical Packages"
            title={
              <>
                Pick the Perfect <span className="accent-text">Princess Package</span>
              </>
            }
            subtitle="Three beautifully crafted packages — every one filled with games, songs, magic and memories."
          />
          <div className="mt-14 grid md:grid-cols-3 gap-6 lg:gap-8">
            {PACKAGES.map((p, i) => (
              <PackageCard key={p.slug} pkg={p} index={i} />
            ))}
          </div>
          <div className="mt-12 w-full max-w-lg sm:max-w-2xl mx-auto">
            <div className="flex flex-col sm:flex-row items-stretch justify-center gap-3">
              <Link
                to="/book"
                className="btn-primary text-base w-full sm:flex-1 min-h-[3rem] px-5 justify-center"
              >
                <WandIcon className="w-5 h-5 shrink-0" />
                Check Availability
              </Link>
              <Link
                to="/characters"
                className="btn-secondary text-base w-full sm:flex-1 min-h-[3rem] px-5 justify-center"
              >
                <CrownIcon className="w-5 h-5 shrink-0" />
                Characters
              </Link>
              <Link
                to="/packages"
                className="btn-secondary text-base w-full sm:flex-1 min-h-[3rem] px-5 justify-center"
              >
                See Full Package Details
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="section-pad relative overflow-hidden">
        <PrincessBackdrop />
        <Sparkles count={30} variant="white" className="opacity-50" />
        <div className="container-px max-w-7xl mx-auto relative z-10">
          <SectionHeading
            tone="canvas"
            eyebrow="Simple & Magical"
            title="How Booking Works"
            subtitle="Five sparkling steps to the most magical birthday your child has ever had."
          />
          <ol className="mt-14 grid sm:grid-cols-2 lg:grid-cols-5 gap-5">
            {STEPS.map((s, i) => (
              <motion.li
                key={s.n}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.07 }}
                className="relative card-magical p-6 text-left"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-pinkBlush bg-pinkDeep text-lg font-bold text-white shadow-[0_8px_22px_-6px_rgba(216,27,96,0.55)] font-display ring-2 ring-white">
                  {s.n}
                </div>
                <h3 className="font-display text-lg mt-4 text-ink">{s.title}</h3>
                <p className="text-inkSoft text-sm mt-2 leading-relaxed">
                  {s.desc}
                </p>
              </motion.li>
            ))}
          </ol>
        </div>
      </section>

      <section className="section-pad bg-white relative overflow-hidden">
        <Sparkles count={28} variant="gold" className="opacity-45" />
        <div className="container-px max-w-7xl mx-auto relative z-10">
          <SectionHeading
            tone="white"
            eyebrow="Happy Parents"
            title={
              <>
                Loved by Families Across <span className="accent-text">Coventry</span>
              </>
            }
            subtitle="Five-star reviews from families who've experienced the magic firsthand."
          />
          <div className="mt-14 grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {REVIEWS.slice(0, 3).map((r, i) => (
              <ReviewCard key={i} review={r} index={i} />
            ))}
          </div>
          <div className="text-center mt-12">
            <Link to="/reviews" className="btn-secondary">
              Read More Reviews
            </Link>
          </div>
        </div>
      </section>

      <section className="section-pad relative overflow-hidden">
        <PrincessBackdrop />
        <Sparkles count={32} variant="white" className="opacity-55" />
        <div className="container-px max-w-7xl mx-auto relative z-10">
          <SectionHeading
            tone="canvas"
            eyebrow="Where We Sparkle"
            title={
              <>
                Areas We <span className="accent-text">Cover</span>
              </>
            }
            subtitle="We bring magical princess parties across Coventry and surrounding areas."
          />
          <div className="mt-12 flex flex-wrap justify-center gap-3 sm:gap-4">
            {AREAS.map((a, i) => (
              <motion.div
                key={a.slug}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
              >
                <Link
                  to={`/areas/${a.slug}`}
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-white border border-pinkSoft shadow-soft hover:shadow-magical hover:-translate-y-0.5 transition-all"
                >
                  <span className="text-pinkDeep text-lg leading-none" aria-hidden>
                    ✦
                  </span>
                  <span className="font-medium text-ink">{a.name}</span>
                </Link>
              </motion.div>
            ))}
          </div>
          <div className="text-center mt-10">
            <Link to="/areas" className="btn-ghost text-sm text-white/90 hover:text-white hover:bg-white/10">
              See full coverage →
            </Link>
          </div>
        </div>
      </section>

      <section className="section-pad bg-white relative overflow-hidden">
        <Sparkles count={28} variant="gold" className="opacity-45" />
        <div className="relative z-10 container-px max-w-4xl mx-auto text-center text-ink">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <WandIcon className="w-14 h-14 mx-auto text-pinkDeep" />
            <h2 className="font-display font-bold text-3xl sm:text-5xl mt-4 leading-tight text-ink tracking-tight">
              Ready to Create a <span className="accent-text">Fairytale</span> Birthday?
            </h2>
            <p className="mt-5 text-inkSoft text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
              Secure your date with your online deposit and let us bring the magic
              to your child's special day.
            </p>
            <div className="mt-8 w-full max-w-lg sm:max-w-2xl mx-auto flex flex-col sm:flex-row items-stretch justify-center gap-3">
              <Link
                to="/book"
                className="btn-primary text-base w-full sm:flex-1 min-h-[3rem] justify-center"
              >
                <WandIcon className="w-5 h-5 shrink-0" />
                Check Availability
              </Link>
              <Link
                to="/characters"
                className="btn-secondary text-base w-full sm:flex-1 min-h-[3rem] justify-center"
              >
                <CrownIcon className="w-5 h-5 shrink-0" />
                Characters
              </Link>
              <a
                href={`tel:${SITE.phoneTel}`}
                className="btn-secondary text-base w-full sm:flex-1 min-h-[3rem] justify-center"
              >
                Call {SITE.phone}
              </a>
            </div>
          </motion.div>
        </div>
      </section>
    </>
  );
}
