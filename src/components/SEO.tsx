import { Helmet } from "react-helmet-async";
import { SITE } from "../data/site";

type SEOProps = {
  title: string;
  description: string;
  path?: string;
  image?: string;
  schema?: object | object[];
};

/**
 * Per-page SEO component. Renders title, meta description, canonical link,
 * Open Graph + Twitter cards, and optional JSON-LD structured data.
 */
export default function SEO({
  title,
  description,
  path = "/",
  image = "/hero-collage/01.png?v=collage-v1",
  schema,
}: SEOProps) {
  const fullTitle = title.includes(SITE.name) ? title : `${title} | ${SITE.name}`;
  const url = `${SITE.url}${path}`;
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
      <meta property="og:image" content={image} />
      <meta property="og:type" content="website" />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

      {schemaArr.map((s, i) => (
        <script key={i} type="application/ld+json">
          {JSON.stringify(s)}
        </script>
      ))}
    </Helmet>
  );
}
