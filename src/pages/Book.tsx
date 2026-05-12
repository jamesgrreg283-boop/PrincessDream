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
import MagicalDateField from "../components/MagicalDateField";
import MagicalListbox from "../components/MagicalListbox";
import { redirectToDeposit, type BookingPayload, CHECKOUT_ERROR_STORAGE_KEY } from "../lib/stripe";

/** Party start times: every day, 9:00 am–4:00 pm inclusive, 15-minute steps. */
const PARTY_START_TIME_OPTIONS: { value: string; label: string }[] = (() => {
  const opts: { value: string; label: string }[] = [];
  for (let m = 9 * 60; m <= 16 * 60; m += 15) {
    const h24 = Math.floor(m / 60);
    const min = m % 60;
    const value = `${String(h24).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
    const period = h24 >= 12 ? "pm" : "am";
    const h12 = ((h24 + 11) % 12) + 1;
    opts.push({ value, label: `${h12}:${String(min).padStart(2, "0")} ${period}` });
  }
  return opts;
})();

const PARTY_TIME_VALUE_SET = new Set(PARTY_START_TIME_OPTIONS.map((o) => o.value));

const PARTY_TIME_LIST_OPTIONS = [
  { value: "", label: "Select start time" },
  ...PARTY_START_TIME_OPTIONS,
] as const;

const CHARACTER_LIST_OPTIONS = [
  { value: "", label: "Choose a princess" },
  ...CHARACTERS.map((c) => ({ value: c.slug, label: c.name })),
  { value: "surprise", label: "Surprise me!" },
] as const;

const PACKAGE_LIST_OPTIONS = PACKAGES.map((p) => ({
  value: p.slug,
  label: `${p.name} — £${p.price}`,
}));

function localDateISO(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

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
  const [searchParams, setSearchParams] = useSearchParams();
  const [form, setForm] = useState<FormState>(initialState);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [checkoutErrorBanner, setCheckoutErrorBanner] = useState<string | null>(null);
  const [occupiedTimes, setOccupiedTimes] = useState<string[]>([]);

  const pkgParam = searchParams.get("package");
  const charParam = searchParams.get("character");

  useEffect(() => {
    if (searchParams.get("checkout_error") !== "1") return;
    const msg = sessionStorage.getItem(CHECKOUT_ERROR_STORAGE_KEY);
    sessionStorage.removeItem(CHECKOUT_ERROR_STORAGE_KEY);
    const id = requestAnimationFrame(() => {
      setCheckoutErrorBanner(
        msg ?? "We couldn't start the card payment. Please try again or call us to complete your booking."
      );
    });
    const next = new URLSearchParams(searchParams);
    next.delete("checkout_error");
    setSearchParams(next, { replace: true });
    return () => cancelAnimationFrame(id);
  }, [searchParams, setSearchParams]);

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

  const partyTimeOptions = useMemo(
    () =>
      PARTY_TIME_LIST_OPTIONS.filter(
        (o) => !o.value || !occupiedTimes.includes(o.value)
      ),
    [occupiedTimes]
  );

  useEffect(() => {
    if (!form.partyDate) {
      const id = requestAnimationFrame(() => setOccupiedTimes([]));
      return () => cancelAnimationFrame(id);
    }
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch(
          `${window.location.origin}/api/check-availability?date=${encodeURIComponent(form.partyDate)}`
        );
        if (!res.ok) return;
        const data = (await res.json()) as { occupiedTimes?: string[] };
        if (!cancelled && Array.isArray(data.occupiedTimes)) {
          setOccupiedTimes(data.occupiedTimes);
        }
      } catch {
        if (!cancelled) setOccupiedTimes([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [form.partyDate]);

  useEffect(() => {
    if (!form.partyTime || !occupiedTimes.includes(form.partyTime)) return;
    const id = requestAnimationFrame(() => {
      setForm((f) => ({ ...f, partyTime: "" }));
    });
    return () => cancelAnimationFrame(id);
  }, [occupiedTimes, form.partyTime]);

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
    if (!form.partyTime) e.partyTime = "Please choose a start time";
    else if (!PARTY_TIME_VALUE_SET.has(form.partyTime))
      e.partyTime = "Please choose a time between 9:00 am and 4:00 pm";
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
      try {
        const av = await fetch(
          `${window.location.origin}/api/check-availability?date=${encodeURIComponent(form.partyDate)}&time=${encodeURIComponent(form.partyTime)}`
        );
        let avJson: { available?: boolean; error?: string } = {};
        try {
          avJson = (await av.json()) as { available?: boolean; error?: string };
        } catch {
          /* non-JSON */
        }
        if (!av.ok || avJson.available === false) {
          setErrors((prev) => ({
            ...prev,
            partyTime:
              avJson.error ??
              "That date and time is no longer available. Please choose another slot.",
          }));
          requestAnimationFrame(() => {
            const el = document.querySelector("[data-error='true']");
            el?.scrollIntoView({ behavior: "smooth", block: "center" });
          });
          setSubmitting(false);
          return;
        }
      } catch {
        /* If availability API is unreachable (e.g. local dev), continue — server enforces on checkout */
      }

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

  const today = localDateISO();

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
            {checkoutErrorBanner && (
              <div
                role="alert"
                className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-950 text-sm"
              >
                <strong className="block mb-1">Payment didn&apos;t complete</strong>
                {checkoutErrorBanner}
              </div>
            )}
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
                  className="input-magical input-magical-enhanced"
                  placeholder="5"
                  value={form.childAge}
                  onChange={(e) => update("childAge", e.target.value)}
                />
              </Field>
            </div>

            <h2 className="heading-display text-2xl sm:text-3xl pt-4">Party Details</h2>
            <p className="text-xs text-inkSoft -mt-1">
              Parties can be booked any day of the week. Pick when the visit{" "}
              <strong className="font-semibold text-ink">starts</strong>: we offer arrivals from 9:00
              am to 4:00 pm in 15-minute steps so we can fit bookings around each other. With your
              current package, the princess stays for{" "}
              <strong className="font-semibold text-ink">{selectedPackage.duration}</strong> from
              that start time.
            </p>

            <div className="grid sm:grid-cols-2 gap-5">
              <Field label="Party Date" error={errors.partyDate} htmlFor="partyDate">
                <MagicalDateField
                  id="partyDate"
                  min={today}
                  value={form.partyDate}
                  onChange={(iso) => update("partyDate", iso)}
                  invalid={!!errors.partyDate}
                />
              </Field>
              <Field label="Party Start Time" error={errors.partyTime} htmlFor="partyTime">
                <MagicalListbox
                  id="partyTime"
                  value={form.partyTime}
                  onChange={(v) => update("partyTime", v)}
                  options={[...partyTimeOptions]}
                  placeholder="Select start time"
                  invalid={!!errors.partyTime}
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
                <MagicalListbox
                  id="character"
                  value={form.character}
                  onChange={(v) => update("character", v)}
                  options={[...CHARACTER_LIST_OPTIONS]}
                  placeholder="Choose a princess"
                  invalid={!!errors.character}
                />
              </Field>
              <Field label="Selected Package" error={errors.packageSlug} htmlFor="packageSlug">
                <MagicalListbox
                  id="packageSlug"
                  value={form.packageSlug}
                  onChange={(v) => update("packageSlug", v)}
                  options={PACKAGE_LIST_OPTIONS}
                  placeholder="Choose a package"
                  invalid={!!errors.packageSlug}
                />
              </Field>
            </div>

            <Field label="Number of Children" htmlFor="numChildren">
              <input
                id="numChildren"
                type="number"
                min={1}
                className="input-magical input-magical-enhanced"
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
