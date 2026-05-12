import { Link, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import SEO from "../components/SEO";
import Sparkles from "../components/Sparkles";
import { WandIcon } from "../components/CrownIcon";
import { SITE } from "../data/site";

export default function BookingSuccess() {
  const [params] = useSearchParams();
  const stripeSession = params.get("session_id");
  const dev = params.get("dev") === "1" && !stripeSession;

  return (
    <>
      <SEO
        title="Booking Confirmed | PrincessDream"
        description="Thank you for your booking. We'll be in touch shortly to confirm all the magical details."
        path="/booking-success"
      />

      <section className="relative section-pad overflow-hidden bg-white">
        <Sparkles count={40} variant="gold" className="opacity-45" />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="container-px max-w-3xl mx-auto text-center relative z-10"
        >
          <div className="w-20 h-20 mx-auto rounded-full bg-accent-btn shadow-[0_12px_32px_-10px_rgba(219,39,119,0.45)] grid place-items-center">
            <WandIcon className="w-10 h-10" />
          </div>
          <h1 className="heading-display text-3xl sm:text-5xl mt-6 text-ink">
            Your Booking is{" "}
            <span className="accent-text">on its way!</span>
          </h1>
          <div className="accent-hr mt-5" />
          <p className="mt-6 text-inkSoft text-base sm:text-lg leading-relaxed">
            Thank you for choosing PrincessDream. We've received your booking
            request and will be in touch within 24 hours to confirm all the
            magical details.
          </p>

          {dev && (
            <div className="mt-6 mx-auto max-w-md p-4 rounded-2xl bg-pinkSoft/60 text-sm text-ink">
              <strong>Dev mode:</strong> no live checkout ran (missing Payment
              Link or <code className="bg-white px-1.5 py-0.5 rounded">VITE_STRIPE_CHECKOUT_ENDPOINT</code>
              ). See README for Stripe setup.
            </div>
          )}

          <div className="mt-8 card-magical p-7 text-left">
            <h2 className="font-display text-xl text-center">What happens next?</h2>
            <ol className="mt-5 space-y-3 text-sm text-ink/90">
              <li className="flex gap-3">
                <span className="w-6 h-6 grid place-items-center rounded-full bg-accent-btn text-white text-xs font-bold flex-shrink-0">
                  1
                </span>
                We'll email you a personal confirmation with all your details.
              </li>
              <li className="flex gap-3">
                <span className="w-6 h-6 grid place-items-center rounded-full bg-accent-btn text-white text-xs font-bold flex-shrink-0">
                  2
                </span>
                We'll send a friendly reminder a few days before the big day.
              </li>
              <li className="flex gap-3">
                <span className="w-6 h-6 grid place-items-center rounded-full bg-accent-btn text-white text-xs font-bold flex-shrink-0">
                  3
                </span>
                Your princess arrives ready to make magical memories!
              </li>
            </ol>
          </div>

          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/" className="btn-primary">
              Back to Home
            </Link>
            <a href={`tel:${SITE.phoneTel}`} className="btn-secondary">
              Call {SITE.phone}
            </a>
          </div>
        </motion.div>
      </section>
    </>
  );
}
