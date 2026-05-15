/**
 * Writes public/sitemap.xml and public/robots.txt at build time.
 * Canonical host defaults to https://www.princessdream.co.uk (override with SITE_ORIGIN).
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const publicDir = join(root, "public");

const base = (
  process.env.SITE_ORIGIN ||
  process.env.VITE_SITE_ORIGIN ||
  "https://www.princessdream.co.uk"
)
  .trim()
  .replace(/\/$/, "");

function discoverAreaSlugs() {
  const areasPath = join(root, "src", "data", "areas.ts");
  const text = readFileSync(areasPath, "utf8");
  const slugs = [];
  const re = /slug:\s*"([^"]+)"/g;
  let m;
  while ((m = re.exec(text))) slugs.push(m[1]);
  return slugs;
}

function xmlEscape(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function url(loc) {
  return `${base}${loc === "/" ? "/" : loc}`;
}

const lastmod = new Date().toISOString().slice(0, 10);

/** Core marketing & conversion URLs (plus area detail pages from src/data/areas.ts). */
const staticPaths = [
  { loc: "/", priority: "1.0", changefreq: "weekly" },
  { loc: "/packages", priority: "0.9", changefreq: "monthly" },
  { loc: "/characters", priority: "0.9", changefreq: "monthly" },
  { loc: "/gallery", priority: "0.75", changefreq: "monthly" },
  { loc: "/reviews", priority: "0.75", changefreq: "monthly" },
  { loc: "/faq", priority: "0.75", changefreq: "monthly" },
  { loc: "/contact", priority: "0.9", changefreq: "monthly" },
  { loc: "/book", priority: "0.95", changefreq: "weekly" },
  { loc: "/areas", priority: "0.85", changefreq: "monthly" },
  { loc: "/privacy", priority: "0.3", changefreq: "yearly" },
  { loc: "/terms", priority: "0.3", changefreq: "yearly" },
];

const areaSlugs = discoverAreaSlugs();
const areaPaths = areaSlugs.map((slug) => ({
  loc: `/areas/${slug}`,
  priority: "0.8",
  changefreq: "monthly",
}));

const allPaths = [...staticPaths, ...areaPaths];

const urlEntries = allPaths
  .map(
    ({ loc, priority, changefreq }) => `  <url>
    <loc>${xmlEscape(url(loc))}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`
  )
  .join("\n");

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries}
</urlset>
`;

const robots = `User-agent: *
Allow: /

Sitemap: https://www.princessdream.co.uk/sitemap.xml
`;

writeFileSync(join(publicDir, "sitemap.xml"), sitemap, "utf8");
writeFileSync(join(publicDir, "robots.txt"), robots, "utf8");

console.log(
  `[generate-sitemap-robots] Wrote ${allPaths.length} URLs → public/sitemap.xml (base ${base}) and public/robots.txt`
);
