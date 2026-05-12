import { motion } from "framer-motion";
import type { Review } from "../data/reviews";
import { StarIcon } from "./CrownIcon";

export default function ReviewCard({
  review,
  index = 0,
}: {
  review: Review;
  index?: number;
}) {
  return (
    <motion.figure
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, delay: index * 0.06 }}
      className="card-magical p-6 sm:p-7 h-full flex flex-col"
    >
      <div className="flex items-center gap-1 text-pink-500">
        {Array.from({ length: review.rating }).map((_, i) => (
          <StarIcon key={i} className="w-4 h-4" />
        ))}
      </div>
      <blockquote className="mt-4 text-ink text-[15px] leading-relaxed flex-1">
        “{review.text}”
      </blockquote>
      <figcaption className="mt-5 pt-4 border-t border-pinkSoft/70 text-sm">
        <div className="font-semibold text-ink">{review.name}</div>
        <div className="text-inkSoft text-xs">
          {review.child ? `${review.child} · ` : ""}
          {review.location} · {review.date}
        </div>
        {review.character && (
          <div className="mt-1 inline-block text-[10px] uppercase tracking-widest font-cinzel text-pinkDeep">
            ✦ {review.character}
          </div>
        )}
      </figcaption>
    </motion.figure>
  );
}
