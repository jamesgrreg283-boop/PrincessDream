import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import SEO from "../components/SEO";
import PageHeader from "../components/PageHeader";
import Sparkles from "../components/Sparkles";
import { FAQS } from "../data/faqs";

export default function FAQ() {
  const [open, setOpen] = useState<number | null>(0);

  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQS.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  return (
    <>
      <SEO
        title="FAQ | Princess Parties Coventry | PrincessDream"
        description="Frequently asked questions about our princess parties — booking, deposits, areas covered, DBS checks, insurance and more."
        path="/faq"
        schema={schema}
      />

      <PageHeader
        eyebrow="Got Questions?"
        title={
          <>
            Frequently Asked <span className="accent-text">Questions</span>
          </>
        }
        subtitle="Everything you need to know about booking your magical princess party — and please reach out if your question isn't here!"
      />

      <section className="section-pad bg-white relative overflow-hidden">
        <Sparkles count={28} variant="gold" className="opacity-40" />
        <div className="container-px max-w-3xl mx-auto relative z-10">
          <div className="space-y-3">
            {FAQS.map((f, i) => {
              const isOpen = open === i;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.03 }}
                  className={`rounded-2xl border bg-white overflow-hidden transition-shadow ${
                    isOpen ? "shadow-magical border-pinkBlush" : "border-pinkSoft shadow-soft"
                  }`}
                >
                  <button
                    onClick={() => setOpen(isOpen ? null : i)}
                    className="w-full flex items-center justify-between gap-4 px-5 sm:px-6 py-5 text-left"
                    aria-expanded={isOpen}
                  >
                    <span className="font-display text-base sm:text-lg text-ink">
                      {f.q}
                    </span>
                    <span
                      className={`flex-shrink-0 w-9 h-9 grid place-items-center rounded-full transition-all ${
                        isOpen
                          ? "bg-accent-btn text-white rotate-45"
                          : "bg-pinkSoft text-pinkDeep"
                      }`}
                      aria-hidden
                    >
                      <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M12 5v14M5 12h14" strokeLinecap="round" />
                      </svg>
                    </span>
                  </button>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="overflow-hidden"
                      >
                        <p className="px-5 sm:px-6 pb-6 text-inkSoft leading-relaxed">
                          {f.a}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>

          <div className="mt-12 text-center card-magical p-7">
            <h3 className="heading-display text-xl">Still have a question?</h3>
            <p className="text-inkSoft text-sm mt-2">
              We'd love to hear from you. Get in touch and we'll respond quickly.
            </p>
            <Link to="/contact" className="btn-primary mt-5 inline-flex">
              Contact Us
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
