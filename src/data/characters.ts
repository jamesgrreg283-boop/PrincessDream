// ============================================================================
// Princess characters.
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
    slug: "belle",
    name: "Belle",
    shortDesc:
      "A book-loving princess who finds beauty in every story — and in every child she meets.",
    bio: "Belle adores tales of adventure and friendship. From storytime to graceful waltzes, she brings warmth, kindness, and a sprinkle of enchantment to every celebration. Children love singing along to her favourite songs and twirling in her golden ballroom dance.",
    image: "/characters/belle.png",
    color: "#F1D87A",
    objectPosition: "center 20%",
  },
  {
    slug: "ariel",
    name: "Ariel",
    shortDesc:
      "A curious mermaid princess with a heart full of ocean songs and seaside dreams.",
    bio: "Ariel sweeps in from under the sea with sparkling stories, sing-alongs, and dreamy dances. Children will love discovering her treasures, joining her ocean songs, and learning what makes the surface world so magical.",
    image: "/characters/ariel.png",
    color: "#9FE3D8",
    objectPosition: "center 25%",
  },
  {
    slug: "elsa",
    name: "Elsa",
    shortDesc:
      "The Snow Queen with an icy spell of wonder, ready to let it go at every party.",
    bio: "Elsa arrives with the shimmer of snowflakes and the wisdom of a true queen. Expect frosty sing-alongs, royal dance lessons, and a magical wish that will make your child's heart sparkle for years to come.",
    image: "/characters/elsa.png",
    color: "#BFE4F2",
    objectPosition: "center 20%",
  },
  {
    slug: "rapunzel",
    name: "Rapunzel",
    shortDesc:
      "An adventurous princess with golden hair, brimming with creativity and joy.",
    bio: "Rapunzel brings a tower of fun — from painting and craft activities to playful games and her radiant signature song. She loves discovering brave new friends and sparking imagination wherever she goes.",
    image: "/characters/rapunzel.png",
    color: "#F8BBD0",
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
  {
    slug: "anna",
    name: "Anna",
    shortDesc:
      "A warm, fearless princess with the biggest heart — perfect for joyful parties.",
    bio: "Anna's laughter is as bright as her smile. She loves games, hugs, and bringing everyone together. Expect dancing, sing-alongs, and a celebration filled with sisterly warmth and wholehearted fun.",
    image: "/characters/anna.png",
    color: "#F8C8B8",
    objectPosition: "center 20%",
  },
];
