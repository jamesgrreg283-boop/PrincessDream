import { Link } from "react-router-dom";
import SEO from "../components/SEO";
import PageHeader from "../components/PageHeader";
import Sparkles from "../components/Sparkles";
import ReviewCard from "../components/ReviewCard";
import { REVIEWS } from "../data/reviews";
import { StarIcon } from "../components/CrownIcon";

export default function Reviews() {
  const avg =
    REVIEWS.reduce((acc, r) => acc + r.rating, 0) / Math.max(REVIEWS.length, 1);

  return (
    <>
      <SEO
        title="Reviews | PrincessDream Princess Parties Coventry"
        description="See what parents are saying about PrincessDream — 5-star reviews from happy families across Coventry, Leamington Spa, Bedworth, Nuneaton and Kenilworth."
        path="/reviews"
      />

      <PageHeader
        eyebrow="Happy Families"
        title={
          <>
            <span className="accent-text">5-Star</span> Reviews From Real Parents
          </>
        }
        subtitle="We're proud of every magical moment we create. Read what families across Coventry & Warwickshire have said about our princess parties."
      />

      <section className="section-pad bg-white relative overflow-hidden">
        <Sparkles count={30} variant="gold" className="opacity-40" />
        <div className="container-px max-w-7xl mx-auto relative z-10">
          {/* Rating summary */}
          <div className="max-w-md mx-auto text-center card-magical p-8 mb-14">
            <div className="font-display text-6xl font-bold accent-text">
              {avg.toFixed(1)}
            </div>
            <div className="flex items-center justify-center gap-1 mt-2 text-pink-500">
              {Array.from({ length: 5 }).map((_, i) => (
                <StarIcon key={i} className="w-5 h-5" />
              ))}
            </div>
            <div className="text-inkSoft text-sm mt-3">
              Based on {REVIEWS.length}+ reviews from delighted families
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {REVIEWS.map((r, i) => (
              <ReviewCard key={i} review={r} index={i} />
            ))}
          </div>

          {/* TODO: Replace this block with a live Google Business Profile widget
              when API credentials are available. */}
          <div className="mt-14 text-center max-w-2xl mx-auto card-magical p-7">
            <h3 className="heading-display text-xl">Coming Soon: Google Reviews</h3>
            <p className="text-inkSoft text-sm mt-2">
              We're integrating live Google reviews directly on our website.
              Want to leave one? We'd love to hear about your magical experience.
            </p>
            <Link to="/contact" className="btn-secondary mt-5 inline-flex">
              Contact Us
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
