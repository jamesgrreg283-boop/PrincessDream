import sharp from "sharp";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const png = path.join(root, "public", "hero-header.png");
const webp = path.join(root, "public", "hero-header.webp");

await sharp(png)
  .webp({
    quality: 95,
    nearLossless: true,
    effort: 6,
  })
  .toFile(webp);
console.log("Wrote", webp);
