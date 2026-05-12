import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import SEO from "../components/SEO";
import PageHeader from "../components/PageHeader";
import Sparkles from "../components/Sparkles";

/**
 * Gallery uses royalty-free placeholder images. Replace `GALLERY` items with
 * real photos & video thumbnails. Each item supports an optional video URL.
 */
const GALLERY: {
  src: string;
  alt: string;
  tall?: boolean;
  video?: string;
}[] = [
  { src: "/characters/anna-elsa.png", alt: "Anna and Elsa together", tall: true },
  { src: "/characters/belle.png", alt: "Princess Belle reading a storybook" },
  { src: "/characters/elsa.png", alt: "Elsa the Snow Queen", tall: true },
  { src: "/characters/fairy-sparkles.png", alt: "Fairy Sparkles meeting children at a garden party" },
  { src: "/characters/ariel.png", alt: "Princess Ariel in her enchanted forest", tall: true },
  { src: "/characters/rapunzel.png", alt: "Princess Rapunzel with her long golden braid" },
  { src: "/characters/anna.png", alt: "Princess Anna in her travelling cloak", tall: true },
  {
    src: "https://images.unsplash.com/photo-1530973428-5bf2db2e4d71?w=900&q=80&auto=format&fit=crop",
    alt: "Sparkly princess wand and tiara",
  },
  {
    src: "https://images.unsplash.com/photo-1542037104857-ffbb0b9155fb?w=900&q=80&auto=format&fit=crop",
    alt: "Birthday cake with candles",
  },
  {
    src: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=900&q=80&auto=format&fit=crop",
    alt: "Magical fairy lights and stars",
  },
];

export default function Gallery() {
  const [lightbox, setLightbox] = useState<number | null>(null);

  return (
    <>
      <SEO
        title="Gallery | PrincessDream Princess Parties Coventry"
        description="A glimpse of the magic — photos from our princess parties across Coventry, Leamington Spa, Bedworth, Nuneaton and Kenilworth."
        path="/gallery"
      />

      <PageHeader
        eyebrow="A Sprinkle of Magic"
        title={
          <>
            Our <span className="accent-text">Magical Moments</span> Gallery
          </>
        }
        subtitle="A glimpse of the smiles, sparkles and fairytale memories we've helped create."
      />

      <section className="section-pad bg-white relative overflow-hidden">
        <Sparkles count={32} variant="gold" className="opacity-40" />
        <div className="container-px max-w-7xl mx-auto relative z-10">
          <div className="masonry">
            {GALLERY.map((g, i) => (
              <motion.button
                key={i}
                onClick={() => setLightbox(i)}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45, delay: (i % 6) * 0.05 }}
                className="block w-full overflow-hidden rounded-2xl shadow-soft hover:shadow-magical hover:-translate-y-0.5 transition-all duration-300 group"
                aria-label={`Open image: ${g.alt}`}
              >
                <img
                  src={g.src}
                  alt={g.alt}
                  loading="lazy"
                  className={`w-full object-cover transition-transform duration-700 group-hover:scale-105 ${
                    g.tall ? "aspect-[3/4]" : "aspect-[4/3]"
                  }`}
                />
              </motion.button>
            ))}
          </div>

          <div className="mt-14 text-center">
            <p className="text-inkSoft mb-6">
              Want your party featured here? Tag us when you share your magical day!
            </p>
            <Link to="/book" className="btn-primary">
              Book Your Magical Party
            </Link>
          </div>
        </div>
      </section>

      {/* Lightbox */}
      <AnimatePresence>
        {lightbox !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setLightbox(null)}
            className="fixed inset-0 z-[60] bg-ink/85 backdrop-blur-sm grid place-items-center p-4 cursor-zoom-out"
          >
            <motion.img
              key={lightbox}
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              src={GALLERY[lightbox].src}
              alt={GALLERY[lightbox].alt}
              className="max-h-[88vh] max-w-[92vw] rounded-2xl shadow-2xl"
            />
            <button
              aria-label="Close"
              onClick={(e) => {
                e.stopPropagation();
                setLightbox(null);
              }}
              className="absolute top-4 right-4 w-11 h-11 grid place-items-center rounded-full bg-white text-ink"
            >
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
