/** Display names for booking emails — mirror `src/data/characters.ts` slugs. */
const MAP = {
  belle: "Belle",
  ariel: "Ariel",
  elsa: "Elsa",
  rapunzel: "Rapunzel",
  "fairy-sparkles": "Fairy Sparkles",
  anna: "Anna",
  surprise: "Surprise me!",
};

export function characterLabel(slug) {
  if (!slug) return "";
  const k = String(slug).toLowerCase();
  return MAP[k] ?? slug;
}
