/** Display names for booking emails — mirror `src/data/characters.ts` slugs. */
const MAP = {
  "glass-slipper-princess": "Glass Slipper Princess",
  "sleepy-princess": "Sleepy Princess",
  belle: "Princess Beauty",
  rapunzel: "Tower Princess",
  ariel: "Mermaid Princess",
  elsa: "Snow Queen",
  anna: "Snow Princess",
  "fairy-sparkles": "Fairy Sparkles",
  "good-witch": "Glinda — The Good Witch",
  "movie-barbie": "Movie Barbie",
  surprise: "Surprise me!",
};

export function characterLabel(slug) {
  if (!slug) return "";
  const k = String(slug).toLowerCase();
  return MAP[k] ?? slug;
}
