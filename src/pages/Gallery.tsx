import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import SEO from "../components/SEO";
import PageHeader from "../components/PageHeader";
import Sparkles from "../components/Sparkles";

/** Real party and character photos only — files live in `public/gallery/`. Optional `video` per item is supported if needed later. */
const GALLERY: {
  src: string;
  alt: string;
  tall?: boolean;
  video?: string;
}[] = [
  {
    src: "/gallery/01.png",
    alt: "Ice princess performer crouching to sing with a young guest in a matching blue dress at an outdoor party",
    tall: true,
  },
  {
    src: "/gallery/02.png",
    alt: "Travelling princess performer in teal dress and purple cloak smiling in front of an enchanted forest backdrop",
    tall: true,
  },
  {
    src: "/gallery/03.png",
    alt: "Ice princess and birthday child posing by a Happy Birthday backdrop with pink and red balloons",
    tall: true,
  },
  {
    src: "/gallery/04.png",
    alt: "Ice princess kneeling with a smiling birthday child on a patterned rug with party balloons",
    tall: true,
  },
  {
    src: "/gallery/05.png",
    alt: "Ice princess entertaining toddlers and families at a Wild & Three themed birthday celebration",
    tall: true,
  },
  {
    src: "/gallery/06.png",
    alt: "Ice princess hugging a delighted birthday child in a sparkly tutu and tiara at a party hall",
    tall: true,
  },
  {
    src: "/gallery/07.png",
    alt: "Ice princess with a group of young guests in princess dresses at a celebration",
    tall: true,
  },
  {
    src: "/gallery/08.png",
    alt: "Mermaid performer sitting in a circle with children for songs and games at an indoor party",
    tall: true,
  },
  {
    src: "/gallery/09.png",
    alt: "Mermaid performer sharing the microphone with a child singing at a birthday party",
    tall: true,
  },
  {
    src: "/gallery/10.png",
    alt: "Fairy performer leading a garden circle activity with children on a sunny lawn",
    tall: true,
  },
  {
    src: "/gallery/11.png",
    alt: "Fairy performer with children seated on the grass at an outdoor fairytale party",
    tall: true,
  },
  {
    src: "/gallery/12.png",
    alt: "Ice princess in a magical forest pose with sparkles and lanterns",
    tall: true,
  },
  {
    src: "/gallery/13.png",
    alt: "Travelling princess and ice princess performers back-to-back in an enchanted forest scene",
    tall: true,
  },
  {
    src: "/gallery/14.png",
    alt: "Mermaid performer in a sequined tail standing in a whimsical enchanted forest setting",
    tall: true,
  },
  {
    src: "/gallery/15.png",
    alt: "Long-haired princess performer with floral braid in a fairytale forest backdrop",
    tall: true,
  },
  {
    src: "/gallery/16.png",
    alt: "Golden-gown princess performer reading a storybook in an enchanted garden scene",
    tall: true,
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
