import SEO from "../components/SEO";
import PageHeader from "../components/PageHeader";
import Sparkles from "../components/Sparkles";
import { SITE } from "../data/site";

export default function Privacy() {
  return (
    <>
      <SEO
        title="Privacy Policy | PrincessDream"
        description="How PrincessDream collects, uses and protects your personal information."
        path="/privacy"
      />

      <PageHeader
        eyebrow="Privacy Policy"
        title={<>Your Privacy Matters</>}
        subtitle={`Last updated: January ${SITE.copyrightYear}`}
      />

      <section className="section-pad bg-white relative overflow-hidden">
        <Sparkles count={24} variant="gold" className="opacity-35" />
        <div className="container-px max-w-3xl mx-auto prose prose-pink space-y-6 text-ink/90 leading-relaxed relative z-10">
          <h2 className="heading-display text-2xl">Who we are</h2>
          <p>
            PrincessDream ("we", "our", "us") operates this website and provides
            children's party entertainment services across Coventry and the West
            Midlands. You can reach us at{" "}
            <a className="text-pinkDeep" href={`mailto:${SITE.email}`}>
              {SITE.email}
            </a>{" "}
            or{" "}
            <a className="text-pinkDeep" href={`tel:${SITE.phoneTel}`}>
              {SITE.phone}
            </a>
            .
          </p>

          <h2 className="heading-display text-2xl">What we collect</h2>
          <p>
            When you complete our booking form we collect: your name, email,
            phone number, party address, child's name and age, chosen
            character, package, party date and any special requests.
          </p>

          <h2 className="heading-display text-2xl">Why we collect it</h2>
          <p>
            We use your information solely to provide the entertainment service
            you've booked, to contact you about your booking, and to take
            payment for your deposit.
          </p>

          <h2 className="heading-display text-2xl">Payment data</h2>
          <p>
            Card payments are processed securely by Stripe. We never see or
            store your card details. See Stripe's privacy policy at{" "}
            <a className="text-pinkDeep" href="https://stripe.com/gb/privacy">
              stripe.com/gb/privacy
            </a>
            .
          </p>

          <h2 className="heading-display text-2xl">How long we keep it</h2>
          <p>
            We retain booking records for up to 7 years to satisfy UK tax and
            accounting obligations, after which they are securely deleted.
          </p>

          <h2 className="heading-display text-2xl">Your rights</h2>
          <p>
            Under UK GDPR you have the right to access, correct or delete your
            personal data, and to object to or restrict its processing. Email{" "}
            <a className="text-pinkDeep" href={`mailto:${SITE.email}`}>
              {SITE.email}
            </a>{" "}
            at any time and we'll respond within 30 days.
          </p>

          <h2 className="heading-display text-2xl">Cookies</h2>
          <p>
            Our website uses only essential cookies required for the booking
            form and analytics. We do not use advertising cookies.
          </p>

          <h2 className="heading-display text-2xl">Changes to this policy</h2>
          <p>
            We may occasionally update this policy. The "last updated" date at
            the top of this page will reflect any changes.
          </p>
        </div>
      </section>
    </>
  );
}
