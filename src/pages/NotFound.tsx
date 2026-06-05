import { Link } from "react-router-dom";
import SEO from "../components/SEO";
import Sparkles from "../components/Sparkles";
import { WandIcon } from "../components/CrownIcon";

export default function NotFound() {
  return (
    <>
      <SEO
        title="Page Not Found | PrincessDream"
        description="The page you're looking for doesn't exist. Let's get you back to the magic."
        noindex
      />

      <section className="relative section-pad overflow-hidden bg-white">
        <Sparkles count={36} variant="gold" className="opacity-45" />
        <div className="container-px max-w-3xl mx-auto text-center relative z-10">
          <WandIcon className="w-16 h-16 mx-auto" />
          <h1 className="heading-display text-6xl sm:text-8xl mt-6 accent-text">404</h1>
          <p className="heading-display text-2xl sm:text-3xl mt-2 text-ink">
            This page must be in another fairytale...
          </p>
          <p className="mt-5 text-inkSoft">
            We couldn't find the page you were looking for. Let's take you
            somewhere magical instead.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/" className="btn-primary">
              Back to Home
            </Link>
            <Link to="/book" className="btn-secondary">
              Book a Party
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
