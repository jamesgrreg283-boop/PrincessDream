// ============================================================================
// Princess characters (inspired fairytale performers — not licensed brands).
// Images live in `/public/characters/<slug>.png` and are referenced by
// absolute URL so they work everywhere (cards, hero, gallery).
// Replace any image by overwriting the file in /public/characters/.
// ============================================================================

export type Character = {
  slug: string;
  name: string;
  shortDesc: string;
  bio: string;
  image: string;
  color: string; // accent color used behind the card
  /** Optional object-position to keep faces in frame on portrait crops. */
  objectPosition?: string;
};

export const CHARACTERS: Character[] = [
  {
    slug: "glass-slipper-princess",
    name: "Glass Slipper Princess",
    shortDesc:
      "A graceful princess who believes every child deserves a touch of ballroom magic.",
    bio: "The Glass Slipper Princess brings elegant storytime, gentle dances, and sparkling moments that make little guests feel like royalty. Perfect for birthdays filled with wonder, kindness, and happily-ever-after smiles.",
    image: "/characters/glass-slipper-princess.png",
    color: "#E8D4F0",
    objectPosition: "center 20%",
  },
  {
    slug: "rapunzel",
    name: "Tower Princess",
    shortDesc:
      "An adventurous princess with golden hair, brimming with creativity and joy.",
    bio: "The Tower Princess brings a tower of fun — from painting and craft activities to playful games and radiant sing-alongs. She loves discovering brave new friends and sparking imagination wherever she goes.",
    image: "/characters/rapunzel.png",
    color: "#F8BBD0",
    objectPosition: "center 20%",
  },
  {
    slug: "ariel",
    name: "Mermaid Princess",
    shortDesc:
      "A curious mermaid princess with a heart full of ocean songs and seaside dreams.",
    bio: "The Mermaid Princess sweeps in with sparkling stories, sing-alongs, and dreamy dances. Children will love discovering seaside treasures, joining her ocean songs, and learning what makes the shore so magical.",
    image: "/characters/ariel.png",
    color: "#9FE3D8",
    objectPosition: "center 25%",
  },
  {
    slug: "elsa",
    name: "Snow Queen",
    shortDesc:
      "A regal snow queen with an icy spell of wonder, ready to dazzle at every party.",
    bio: "The Snow Queen arrives with the shimmer of snowflakes and the wisdom of a true royal. Expect frosty sing-alongs, royal dance lessons, and a magical wish that will make your child's heart sparkle for years to come.",
    image: "/characters/elsa.png",
    color: "#BFE4F2",
    objectPosition: "center 20%",
  },
  {
    slug: "anna",
    name: "Snow Princess",
    shortDesc:
      "A warm, joyful princess with the biggest heart — perfect for lively parties.",
    bio: "The Snow Princess's laughter is as bright as her smile. She loves games, hugs, and bringing everyone together. Expect dancing, sing-alongs, and a celebration filled with warmth and wholehearted fun.",
    image: "/characters/anna.png",
    color: "#F8C8B8",
    objectPosition: "center 20%",
  },
  {
    slug: "fairy-sparkles",
    name: "Fairy Sparkles",
    shortDesc:
      "A glittering fairy who grants magical wishes and showers parties in fairy dust.",
    bio: "Fairy Sparkles flutters in with twinkling wings and a pocketful of pixie dust. Children make wishes, learn tiny spells of kindness, and dance through a glittering sing-along they'll never forget.",
    image: "/characters/fairy-sparkles.png",
    color: "#F3E5F5",
    objectPosition: "center 30%",
  },
];

/** Labels for retired characters (kept so older bookings still display nicely). */
const RETIRED_CHARACTER_LABELS: Record<string, string> = {
  "sleepy-princess": "Sleepy Princess",
  "good-witch": "Glinda — The Good Witch",
  "movie-barbie": "Movie Barbie",
  belle: "Princess Beauty",
};

/** Friendly label for booking slugs (admin table, emails on server use `api/_lib/characters.mjs`). */
export function characterLabelForSlug(slug: string | null | undefined): string {
  if (!slug) return "—";
  const k = String(slug).trim().toLowerCase();
  if (k === "surprise") return "Surprise me!";
  const fromList = CHARACTERS.find((c) => c.slug === k);
  if (fromList) return fromList.name;
  return RETIRED_CHARACTER_LABELS[k] ?? slug;
}
