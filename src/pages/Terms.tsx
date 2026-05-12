import SEO from "../components/SEO";
import PageHeader from "../components/PageHeader";
import Sparkles from "../components/Sparkles";
import { SITE } from "../data/site";

export default function Terms() {
  return (
    <>
      <SEO
        title="Terms & Conditions | PrincessDream"
        description="The terms and conditions that apply to bookings with PrincessDream."
        path="/terms"
      />

      <PageHeader
        eyebrow="Terms & Conditions"
        title={<>Our Terms of Service</>}
        subtitle={`Last updated: January ${SITE.copyrightYear}`}
      />

      <section className="section-pad bg-white relative overflow-hidden">
        <Sparkles count={24} variant="gold" className="opacity-35" />
        <div className="container-px max-w-3xl mx-auto space-y-6 text-ink/90 leading-relaxed relative z-10">
          <h2 className="heading-display text-2xl">1. Booking & deposit</h2>
          <p>
            To secure a booking, a non-refundable online deposit is required at
            the time of booking (the amount shown for your chosen package). Deposits may be transferable to an alternative
            date depending on notice and availability, at our discretion.
          </p>

          <h2 className="heading-display text-2xl">2. Remaining balance</h2>
          <p>
            The remaining balance (package total minus the deposit paid online)
            is payable in cash on the day of the party before the performance
            begins, unless otherwise agreed in writing.
          </p>

          <h2 className="heading-display text-2xl">3. Cancellations</h2>
          <p>
            If you need to cancel, please contact us as soon as possible. The
            deposit is non-refundable but, with sufficient notice, may be
            transferable to a future date subject to availability.
          </p>

          <h2 className="heading-display text-2xl">4. Character availability</h2>
          <p>
            We endeavour to provide your chosen character, however in the
            unlikely event that they become unavailable we will offer an
            alternative character or date. We do not perform officially licensed
            characters; our princesses are inspired by classic fairytales.
          </p>

          <h2 className="heading-display text-2xl">5. Venue & safety</h2>
          <p>
            The party host is responsible for providing a safe, clean
            performance space. Children must be supervised by parents or
            guardians at all times. We are fully insured with public liability
            cover.
          </p>

          <h2 className="heading-display text-2xl">6. Photography</h2>
          <p>
            Photos and videos taken at the party may be requested for use on
            our website and social media. We will only use such media with your
            prior written permission.
          </p>

          <h2 className="heading-display text-2xl">7. Late arrival / overrun</h2>
          <p>
            In the unlikely event of delay due to circumstances outside our
            control (traffic, weather, illness), we will contact you immediately
            and offer a partial refund, rescheduled date or extended performance
            time where possible.
          </p>

          <h2 className="heading-display text-2xl">8. Liability</h2>
          <p>
            Our total liability is limited to the price of the booking. We are
            not liable for indirect or consequential losses.
          </p>

          <h2 className="heading-display text-2xl">9. Governing law</h2>
          <p>
            These terms are governed by the laws of England and Wales. Any
            dispute will be subject to the exclusive jurisdiction of the English
            courts.
          </p>

          <p className="mt-10 italic text-inkSoft">
            Questions? Email{" "}
            <a className="text-pinkDeep" href={`mailto:${SITE.email}`}>
              {SITE.email}
            </a>
            .
          </p>
        </div>
      </section>
    </>
  );
}
