import { Link, useParams, Navigate } from "react-router-dom";
import SEO from "../components/SEO";
import PageHeader from "../components/PageHeader";
import Sparkles from "../components/Sparkles";
import { AREAS } from "../data/areas";
import { PACKAGES } from "../data/packages";
import PackageCard from "../components/PackageCard";
import TrustBadges from "../components/TrustBadges";
import { TRUST_BADGES } from "../data/site";

export default function AreaDetail() {
  const { slug } = useParams();
  const area = AREAS.find((a) => a.slug === slug);
  if (!area) return <Navigate to="/areas" replace />;

  return (
    <>
      <SEO
        title={`${area.keyword} | PrincessDream`}
        description={`${area.intro.substring(0, 155)}`}
        path={`/areas/${area.slug}`}
      />

      <PageHeader
        eyebrow={`Serving ${area.name}`}
        title={
          <>
            <span className="accent-text">{area.headline}</span>
          </>
        }
        subtitle={area.intro}
      />

      <section className="section-pad bg-white relative overflow-hidden">
        <Sparkles count={28} variant="gold" className="opacity-40" />
        <div className="container-px max-w-5xl mx-auto relative z-10">
          <div className="card-magical p-7 sm:p-10">
            <h2 className="heading-display text-2xl sm:text-3xl">
              Why families in {area.name} choose PrincessDream
            </h2>
            <div className="accent-hr mx-0 mt-4" />
            <ul className="mt-6 grid sm:grid-cols-2 gap-3">
              {area.bullets.map((b) => (
                <li key={b} className="flex items-start gap-3 text-ink/90">
                  <span className="mt-1 w-5 h-5 grid place-items-center rounded-full bg-accent-btn text-white text-[11px] flex-shrink-0">
                    ✓
                  </span>
                  <span>{b}</span>
                </li>
              ))}
            </ul>
            <div className="mt-8">
              <TrustBadges items={TRUST_BADGES} />
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/book" className="btn-primary">
                Book a Princess Party in {area.name}
              </Link>
              <Link to="/packages" className="btn-secondary">
                View Packages
              </Link>
            </div>
          </div>
        </div>

        <div className="container-px max-w-7xl mx-auto mt-16 relative z-10">
          <h3 className="heading-display text-2xl sm:text-3xl text-center">
            Popular Packages
          </h3>
          <div className="accent-hr mt-4" />
          <div className="mt-10 grid md:grid-cols-3 gap-6">
            {PACKAGES.map((p, i) => (
              <PackageCard key={p.slug} pkg={p} index={i} />
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
