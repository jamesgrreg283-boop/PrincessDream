import { useEffect, useMemo, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import SEO from "../components/SEO";
import PageHeader from "../components/PageHeader";
import Sparkles from "../components/Sparkles";
import { PACKAGES, depositFor, remainingFor } from "../data/packages";
import { CHARACTERS } from "../data/characters";
import { SITE, TRUST_BADGES } from "../data/site";
import TrustBadges from "../components/TrustBadges";
import { redirectToDeposit, type BookingPayload } from "../lib/stripe";

type FormState = BookingPayload & { agreeTerms: boolean };

const initialState: FormState = {
  parentName: "",
  email: "",
  phone: "",
  childName: "",
  childAge: "",
  partyDate: "",
  partyTime: "",
  address: "",
  character: "",
  packageSlug: "1-hour-party",
  numChildren: "",
  specialRequests: "",
  agreeTerms: false,
};

export default function Book() {
  const [searchParams] = useSearchParams();
  const [form, setForm] = useState<FormState>(initialState);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [submitting, setSubmitting] = useState(false);

  const pkgParam = searchParams.get("package");
  const charParam = searchParams.get("character");

  // Pre-select from query string (deferred setState avoids cascading-render lint)
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      setForm((f) => ({
        ...f,
        packageSlug:
          pkgParam && PACKAGES.some((p) => p.slug === pkgParam) ? pkgParam : f.packageSlug,
        character: charParam ? charParam : f.character,
      }));
    });
    return () => cancelAnimationFrame(id);
  }, [pkgParam, charParam]);

  const selectedPackage = useMemo(
    () => PACKAGES.find((p) => p.slug === form.packageSlug) ?? PACKAGES[1],
    [form.packageSlug]
  );

  const deposit = depositFor(selectedPackage);
  const balance = remainingFor(selectedPackage);

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const validate = (): boolean => {
    const e: Partial<Record<keyof FormState, string>> = {};
    if (!form.parentName.trim()) e.parentName = "Please enter your name";
    if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = "Please enter a valid email";
    if (!form.phone.trim() || form.phone.replace(/\D/g, "").length < 7)
      e.phone = "Please enter a valid phone number";
    if (!form.childName.trim()) e.childName = "Please enter your child's name";
    if (!form.childAge.trim()) e.childAge = "Please enter your child's age";
    if (!form.partyDate) e.partyDate = "Please choose a date";
    if (!form.partyTime) e.partyTime = "Please choose a time";
    if (!form.address.trim()) e.address = "Please enter the party address";
    if (!form.character.trim()) e.character = "Please choose a princess";
    if (!form.packageSlug) e.packageSlug = "Please choose a package";
    if (!form.agreeTerms) e.agreeTerms = "Please agree to the terms";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) {
      // Scroll to first error
      requestAnimationFrame(() => {
        const el = document.querySelector("[data-error='true']");
        el?.scrollIntoView({ behavior: "smooth", block: "center" });
      });
      return;
    }
    setSubmitting(true);
    try {
      // TODO: optionally POST `form` to your CRM / email service (Formspree, Resend, etc.)
      const payload: BookingPayload = {
        parentName: form.parentName,
        email: form.email,
        phone: form.phone,
        childName: form.childName,
        childAge: form.childAge,
        partyDate: form.partyDate,
        partyTime: form.partyTime,
        address: form.address,
        character: form.character,
        packageSlug: form.packageSlug,
        numChildren: form.numChildren,
        specialRequests: form.specialRequests,
      };
      await redirectToDeposit(selectedPackage, payload);
    } finally {
      setSubmitting(false);
    }
  };

  const today = new Date().toISOString().split("T")[0];

  return (
    <>
      <SEO
        title="Book a Princess Party | PrincessDream Coventry"
        description="Book a magical princess party online. Quick form, secure deposit, instant confirmation. Coventry, Leamington Spa, Bedworth, Nuneaton & Kenilworth."
        path="/book"
      />

      <PageHeader
        eyebrow="Book Your Party"
        title={
          <>
            Let's Make <span className="accent-text">Magic</span> Happen
          </>
        }
        subtitle="Fill out the form below to request your magical party. We'll respond quickly to confirm details and secure your date with your online deposit."
      />

      <section className="section-pad bg-white relative overflow-hidden">
        <Sparkles count={32} variant="gold" className="opacity-40" />
        <div className="container-px max-w-6xl mx-auto grid lg:grid-cols-[1.5fr_1fr] gap-10 relative z-10">
          {/* ============================ FORM ============================ */}
          <motion.form
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            onSubmit={handleSubmit}
            className="card-magical p-6 sm:p-8 lg:p-10 space-y-5"
            noValidate
          >
            <h2 className="heading-display text-2xl sm:text-3xl">Your Details</h2>

            <Field label="Parent Name" error={errors.parentName} htmlFor="parentName">
              <input
                id="parentName"
                type="text"
                autoComplete="name"
                className="input-magical"
                placeholder="Jane Smith"
                value={form.parentName}
                onChange={(e) => update("parentName", e.target.value)}
              />
            </Field>

            <div className="grid sm:grid-cols-2 gap-5">
              <Field label="Email" error={errors.email} htmlFor="email">
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  className="input-magical"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={(e) => update("email", e.target.value)}
                />
              </Field>
              <Field label="Phone Number" error={errors.phone} htmlFor="phone">
                <input
                  id="phone"
                  type="tel"
                  autoComplete="tel"
                  inputMode="tel"
                  className="input-magical"
                  placeholder="07871 796024"
                  value={form.phone}
                  onChange={(e) => update("phone", e.target.value)}
                />
              </Field>
            </div>

            <h2 className="heading-display text-2xl sm:text-3xl pt-4">Birthday Child</h2>

            <div className="grid sm:grid-cols-[2fr_1fr] gap-5">
              <Field label="Child's Name" error={errors.childName} htmlFor="childName">
                <input
                  id="childName"
                  type="text"
                  className="input-magical"
                  placeholder="Lily"
                  value={form.childName}
                  onChange={(e) => update("childName", e.target.value)}
                />
              </Field>
              <Field label="Child's Age" error={errors.childAge} htmlFor="childAge">
                <input
                  id="childAge"
                  type="number"
                  min={1}
                  max={15}
                  className="input-magical"
                  placeholder="5"
                  value={form.childAge}
                  onChange={(e) => update("childAge", e.target.value)}
                />
              </Field>
            </div>

            <h2 className="heading-display text-2xl sm:text-3xl pt-4">Party Details</h2>

            <div className="grid sm:grid-cols-2 gap-5">
              <Field label="Party Date" error={errors.partyDate} htmlFor="partyDate">
                <input
                  id="partyDate"
                  type="date"
                  min={today}
                  className="input-magical"
                  value={form.partyDate}
                  onChange={(e) => update("partyDate", e.target.value)}
                />
              </Field>
              <Field label="Party Start Time" error={errors.partyTime} htmlFor="partyTime">
                <input
                  id="partyTime"
                  type="time"
                  className="input-magical"
                  value={form.partyTime}
                  onChange={(e) => update("partyTime", e.target.value)}
                />
              </Field>
            </div>

            <Field label="Party Address" error={errors.address} htmlFor="address">
              <input
                id="address"
                type="text"
                autoComplete="street-address"
                className="input-magical"
                placeholder="1 Royal Lane, Coventry, CV1 1AA"
                value={form.address}
                onChange={(e) => update("address", e.target.value)}
              />
            </Field>

            <div className="grid sm:grid-cols-2 gap-5">
              <Field label="Selected Princess" error={errors.character} htmlFor="character">
                <select
                  id="character"
                  className="input-magical appearance-none pr-10"
                  value={form.character}
                  onChange={(e) => update("character", e.target.value)}
                >
                  <option value="">Choose a princess</option>
                  {CHARACTERS.map((c) => (
                    <option key={c.slug} value={c.slug}>
                      {c.name}
                    </option>
                  ))}
                  <option value="surprise">Surprise me!</option>
                </select>
              </Field>
              <Field label="Selected Package" error={errors.packageSlug} htmlFor="packageSlug">
                <select
                  id="packageSlug"
                  className="input-magical appearance-none pr-10"
                  value={form.packageSlug}
                  onChange={(e) => update("packageSlug", e.target.value)}
                >
                  {PACKAGES.map((p) => (
                    <option key={p.slug} value={p.slug}>
                      {p.name} — £{p.price}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <Field label="Number of Children" htmlFor="numChildren">
              <input
                id="numChildren"
                type="number"
                min={1}
                className="input-magical"
                placeholder="10"
                value={form.numChildren}
                onChange={(e) => update("numChildren", e.target.value)}
              />
            </Field>

            <Field label="Special Requests" htmlFor="specialRequests">
              <textarea
                id="specialRequests"
                rows={4}
                className="input-magical resize-none"
                placeholder="Any favourite songs, themes, allergies or details we should know about?"
                value={form.specialRequests}
                onChange={(e) => update("specialRequests", e.target.value)}
              />
            </Field>

            <label
              className="flex items-start gap-3 pt-2"
              data-error={errors.agreeTerms ? "true" : undefined}
            >
              <input
                type="checkbox"
                checked={form.agreeTerms}
                onChange={(e) => update("agreeTerms", e.target.checked)}
                className="mt-1 w-5 h-5 rounded border-pinkBlush text-pinkDeep focus:ring-pinkBlush"
              />
              <span className="text-sm text-inkSoft">
                I agree to the{" "}
                <Link to="/terms" className="text-pinkDeep underline">
                  Terms & Conditions
                </Link>{" "}
                and{" "}
                <Link to="/privacy" className="text-pinkDeep underline">
                  Privacy Policy
                </Link>
                . I understand the online deposit is non-refundable.
              </span>
            </label>
            {errors.agreeTerms && (
              <p className="text-pinkDeep text-xs -mt-3">{errors.agreeTerms}</p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="btn-primary w-full justify-center text-base py-4 disabled:opacity-70"
            >
              {submitting
                ? "Preparing secure checkout..."
                : `Pay £${deposit} Deposit & Confirm Booking`}
            </button>

            <p className="text-xs text-center text-inkSoft">
              Secure payments by Stripe. Your details are never shared.
            </p>
          </motion.form>

          {/* ============================ SUMMARY ============================ */}
          {/* Sidebar: stick the whole column so summary + chat never overlap */}
          <aside className="space-y-6 lg:sticky lg:top-24 lg:z-10 lg:self-start lg:max-h-[calc(100dvh-6.5rem)] lg:overflow-y-auto lg:overscroll-contain">
            <div className="card-magical p-7">
              <div className="heading-eyebrow">Booking Summary</div>
              <h3 className="font-display text-2xl mt-2">{selectedPackage.name}</h3>
              <p className="text-sm text-inkSoft mt-1">{selectedPackage.tagline}</p>

              <ul className="mt-5 space-y-2 text-sm">
                {selectedPackage.includes.slice(0, 5).map((i) => (
                  <li key={i} className="flex items-start gap-2 text-ink/85">
                    <span className="text-pinkDeep">✦</span>
                    {i}
                  </li>
                ))}
                {selectedPackage.includes.length > 5 && (
                  <li className="text-xs text-inkSoft italic">
                    + {selectedPackage.includes.length - 5} more magical extras
                  </li>
                )}
              </ul>

              <div className="mt-6 pt-6 border-t border-pinkSoft space-y-2">
                <Row label="Total" value={`£${selectedPackage.price}`} />
                <Row
                  label="Deposit (online)"
                  value={`£${deposit}`}
                  highlight
                />
                <Row label="Balance on day (cash)" value={`£${balance}`} />
              </div>

              <p className="mt-5 text-xs text-inkSoft">
                Your deposit secures the date and chosen princess. The remaining
                balance is paid in cash on the day.
              </p>
            </div>

            <div className="card-magical p-6">
              <h4 className="font-display text-lg">Prefer to chat?</h4>
              <p className="text-sm text-inkSoft mt-1">
                Give us a call or send a message — we're happy to help.
              </p>
              <div className="mt-4 space-y-2 text-sm">
                <a
                  href={`tel:${SITE.phoneTel}`}
                  className="block text-pinkDeep font-semibold hover:underline"
                >
                  📞 {SITE.phone}
                </a>
                <a
                  href={`mailto:${SITE.email}`}
                  className="block text-pinkDeep font-semibold hover:underline break-all"
                >
                  ✉ {SITE.email}
                </a>
              </div>
              <div className="mt-5">
                <TrustBadges items={TRUST_BADGES} />
              </div>
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}

// ============================== Helpers ====================================

function Field({
  label,
  htmlFor,
  error,
  children,
}: {
  label: string;
  htmlFor?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div data-error={error ? "true" : undefined}>
      <label htmlFor={htmlFor} className="block text-sm font-medium text-ink mb-2">
        {label}
      </label>
      {children}
      {error && <p className="mt-1.5 text-xs text-pinkDeep">{error}</p>}
    </div>
  );
}

function Row({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`flex justify-between items-center text-sm ${
        highlight ? "text-pinkDeep font-bold text-base" : "text-ink"
      }`}
    >
      <span className={highlight ? "" : "text-inkSoft"}>{label}</span>
      <span>{value}</span>
    </div>
  );
}
