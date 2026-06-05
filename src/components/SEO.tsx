import { Helmet } from "react-helmet-async";
import { SITE, absoluteSiteUrl } from "../data/site";

type SEOProps = {
  title: string;
  description?: string;
  path?: string;
  image?: string;
  schema?: object | object[];
  /** When true, adds robots noindex,nofollow (e.g. admin pages). */
  noindex?: boolean;
};

/**
 * Per-page SEO component. Renders title, meta description, canonical link,
 * Open Graph + Twitter cards, and optional JSON-LD structured data.
 */
export default function SEO({
  title,
  description = "Magical princess parties in Coventry and surrounding areas.",
  path = "/",
  image = "/hero-collage/01.png?v=collage-v1",
  schema,
  noindex = false,
}: SEOProps) {
  const fullTitle = title.includes(SITE.name) ? title : `${title} | ${SITE.name}`;
  const url = absoluteSiteUrl(path);
  const imageUrl = absoluteSiteUrl(image);
  const schemaArr = schema
    ? Array.isArray(schema)
      ? schema
      : [schema]
    : [];

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />

      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={imageUrl} />
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content={SITE.name} />
      <meta property="og:locale" content="en_GB" />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={imageUrl} />

      {noindex && <meta name="robots" content="noindex, nofollow" />}

      {schemaArr.map((s, i) => (
        <script key={i} type="application/ld+json">
          {JSON.stringify(s)}
        </script>
      ))}
    </Helmet>
  );
}
