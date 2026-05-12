import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import type { Character } from "../data/characters";

export default function CharacterCard({
  character,
  index = 0,
}: {
  character: Character;
  index?: number;
}) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.55, delay: index * 0.06 }}
      className="card-magical flex flex-col group"
    >
      <div className="relative aspect-[4/5] overflow-hidden">
        <img
          src={character.image}
          alt={`${character.name} princess entertainer`}
          loading="lazy"
          style={{ objectPosition: character.objectPosition ?? "center" }}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        <div
          className="absolute inset-0 opacity-30 mix-blend-soft-light"
          style={{ background: `linear-gradient(135deg, ${character.color} 0%, transparent 60%)` }}
          aria-hidden
        />
        <div
          aria-hidden
          className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-[10px] font-cinzel tracking-widest uppercase bg-white/90 text-pinkDeep shadow-soft"
        >
          ✦ Princess
        </div>
      </div>
      <div className="p-6 flex-1 flex flex-col">
        <h3 className="heading-display text-2xl text-ink">{character.name}</h3>
        <div className="accent-hr mx-0 mt-3" />
        <p className="text-inkSoft mt-4 text-sm leading-relaxed flex-1">
          {character.shortDesc}
        </p>
        <Link
          to={`/book?character=${character.slug}`}
          className="btn-secondary mt-6 text-sm py-3"
        >
          Book {character.name}
        </Link>
      </div>
    </motion.article>
  );
}
