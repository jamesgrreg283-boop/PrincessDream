import SEO from "../components/SEO";
import PageHeader from "../components/PageHeader";
import Sparkles from "../components/Sparkles";
import { SITE } from "../data/site";
import { MIN_BOOKING_LEAD_DAYS } from "../data/bookingLeadTime";

export default function Terms() {
  return (
    <>
      <SEO
        title="Terms & Booking Policy | PrincessDream"
        description="Booking policy and terms for PrincessDream parties and appearances, including our 3-week minimum notice."
        path="/terms"
      />

      <PageHeader
        eyebrow="Terms & Booking Policy"
        title={<>Our Terms of Service</>}
        subtitle={`Last updated: August ${SITE.copyrightYear}`}
      />

      <section className="section-pad bg-white relative overflow-hidden">
        <Sparkles count={24} variant="gold" className="opacity-35" />
        <div className="container-px max-w-3xl mx-auto space-y-6 text-ink/90 leading-relaxed relative z-10">
          <h2 className="heading-display text-2xl">1. Booking notice (3 weeks minimum)</h2>
          <p>
            All parties and appearances must be booked at least{" "}
            <strong className="font-semibold text-ink">
              {MIN_BOOKING_LEAD_DAYS} days (3 weeks) in advance
            </strong>
            . Online bookings for dates sooner than this are not accepted. This
            notice period lets us confirm your princess, prepare costumes and
            props, and plan travel around our diary.
          </p>
          <p>
            If you need something sooner, please{" "}
            <a className="text-pinkDeep" href={`mailto:${SITE.email}`}>
              email us
            </a>{" "}
            or message via Instagram — we may be able to help at our discretion
            when diary space allows, but short-notice dates are not guaranteed.
          </p>

          <h2 className="heading-display text-2xl">2. Booking & deposit</h2>
          <p>
            To secure a booking, a non-refundable online deposit is required at
            the time of booking (the amount shown for your chosen package). Deposits may be transferable to an alternative
            date depending on notice and availability, at our discretion.
          </p>

          <h2 className="heading-display text-2xl">3. Remaining balance</h2>
          <p>
            The remaining balance (package total minus the deposit paid online)
            is payable in cash on the day of the party before the performance
            begins, unless otherwise agreed in writing.
          </p>

          <h2 className="heading-display text-2xl">4. Cancellations</h2>
          <p>
            If you need to cancel, please contact us as soon as possible. The
            deposit is non-refundable but, with sufficient notice, may be
            transferable to a future date subject to availability.
          </p>

          <h2 className="heading-display text-2xl">5. Character availability</h2>
          <p>
            We endeavour to provide your chosen character, however in the
            unlikely event that they become unavailable we will offer an
            alternative character or date. We do not perform officially licensed
            characters; our princesses are inspired by classic fairytales.
          </p>

          <h2 className="heading-display text-2xl">6. Venue & safety</h2>
          <p>
            The party host is responsible for providing a safe, clean
            performance space. Children must be supervised by parents or
            guardians at all times. All performers are DBS checked.
          </p>

          <h2 className="heading-display text-2xl">7. Photography</h2>
          <p>
            Photos and videos taken at the party may be requested for use on
            our website and social media. We will only use such media with your
            prior written permission.
          </p>

          <h2 className="heading-display text-2xl">8. Late arrival / overrun</h2>
          <p>
            In the unlikely event of delay due to circumstances outside our
            control (traffic, weather, illness), we will contact you immediately
            and offer a partial refund, rescheduled date or extended performance
            time where possible.
          </p>

          <h2 className="heading-display text-2xl">9. Liability</h2>
          <p>
            Our total liability is limited to the price of the booking. We are
            not liable for indirect or consequential losses.
          </p>

          <h2 className="heading-display text-2xl">10. Governing law</h2>
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
