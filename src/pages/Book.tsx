import { useEffect, useMemo, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import SEO from "../components/SEO";
import PageHeader from "../components/PageHeader";
import Sparkles from "../components/Sparkles";
import AvailabilityCheckingOverlay, {
  AVAILABILITY_CHECK_MIN_MS,
  formatPartyDateLabel,
} from "../components/AvailabilityCheckingOverlay";
import { PACKAGES, depositFor, discountFor, isAugustOfferActive, remainingFor, standardRemainingFor, totalFor } from "../data/packages";
import { AUGUST_OFFER } from "../data/augustOffer";
import { CHARACTERS, characterLabelForSlug } from "../data/characters";
import {
  EXTRA_PRINCESS_FEE_GBP,
  EXTRA_PRINCESS_REQUIRED_ABOVE,
  extraPrincessFee,
  extraPrincessRequired,
} from "../data/extraPrincess";
import { SITE, TRUST_BADGES } from "../data/site";
import TrustBadges from "../components/TrustBadges";
import MagicalDateField from "../components/MagicalDateField";
import MagicalListbox from "../components/MagicalListbox";
import { redirectToDeposit, type BookingPayload, CHECKOUT_ERROR_STORAGE_KEY } from "../lib/stripe";
import {
  SLOT_HOLD_MINUTES,
  clearBookingDraft,
  formatCountdown,
  holdRemainingMs as getHoldRemainingMs,
  isDraftValid,
  loadBookingDraft,
  normaliseDraftForm,
  saveBookingDraft,
} from "../lib/bookingDraft";
import { checkServicePostcode } from "../lib/serviceArea";
import {
  DEFAULT_OCCASION,
  OCCASION_OPTIONS,
  occasionFieldCopy,
  type OccasionType,
} from "../data/occasions";
import {
  BOOKING_LEAD_TIME_MESSAGE,
  earliestBookableDateISO,
  isPartyDateTooSoon,
  MIN_BOOKING_LEAD_DAYS,
} from "../data/bookingLeadTime";

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

/** Nearby slot labels shown during the loading-screen shuffle step (excludes user's time). */
function buildShuffleTimeLabels(selectedValue: string, selectedLabel: string): string[] {
  const idx = PARTY_START_TIME_OPTIONS.findIndex((o) => o.value === selectedValue);
  if (idx < 0) {
    return ["10:00 am", "12:30 pm", "2:00 pm", "3:30 pm"].filter((l) => l !== selectedLabel);
  }
  const labels: string[] = [];
  for (const off of [3, -2, 2, -3, 4, -1, 5, 1, -4]) {
    const slot = PARTY_START_TIME_OPTIONS[idx + off];
    if (slot && slot.label !== selectedLabel && !labels.includes(slot.label)) {
      labels.push(slot.label);
    }
  }
  return labels.slice(0, 5);
}

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
  label: isAugustOfferActive()
    ? `${p.name} — £${totalFor(p)} (was £${p.price})`
    : `${p.name} — £${p.price}`,
}));

type BookingFlowStep = "pick-slot" | "checking" | "form";

type FormState = BookingPayload & { agreeTerms: boolean };

const initialState: FormState = {
  occasionType: DEFAULT_OCCASION,
  parentName: "",
  email: "",
  phone: "",
  childName: "",
  childAge: "",
  partyDate: "",
  partyTime: "",
  address: "",
  postcode: "",
  character: "",
  extraCharacter: "",
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
  const [noticeBanner, setNoticeBanner] = useState<string | null>(null);
  const [occupiedTimes, setOccupiedTimes] = useState<string[]>([]);
  const [flowStep, setFlowStep] = useState<BookingFlowStep>("pick-slot");
  const [slotCheckError, setSlotCheckError] = useState<string | null>(null);
  const [slotConfirmedAt, setSlotConfirmedAt] = useState<number | null>(null);
  const [holdRemainingMs, setHoldRemainingMs] = useState(SLOT_HOLD_MINUTES * 60 * 1000);

  const pkgParam = searchParams.get("package");
  const charParam = searchParams.get("character");

  /** Restore in-progress booking after browsing other pages (same tab). */
  useEffect(() => {
    const draft = loadBookingDraft();
    if (!isDraftValid(draft)) return;
    const id = requestAnimationFrame(() => {
      setForm(normaliseDraftForm(draft.form));
      setSlotConfirmedAt(draft.slotConfirmedAt);
      setHoldRemainingMs(getHoldRemainingMs(draft.slotConfirmedAt));
      setFlowStep("form");
    });
    return () => cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    if (flowStep !== "form" || !slotConfirmedAt) return;
    if (getHoldRemainingMs(slotConfirmedAt) <= 0) {
      clearBookingDraft();
      return;
    }
    saveBookingDraft({
      version: 1,
      form: { ...form },
      slotConfirmedAt,
      flowStep: "form",
    });
  }, [form, flowStep, slotConfirmedAt]);

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
      const charOk =
        charParam &&
        (CHARACTERS.some((c) => c.slug === charParam) || charParam === "surprise");
      setForm((f) => ({
        ...f,
        packageSlug:
          pkgParam && PACKAGES.some((p) => p.slug === pkgParam) ? pkgParam : f.packageSlug,
        character: charOk ? charParam : f.character,
      }));
    });
    return () => cancelAnimationFrame(id);
  }, [pkgParam, charParam]);

  /** Stripe sends users here with ?canceled=1&session_id=… — release pending hold immediately. */
  useEffect(() => {
    if (searchParams.get("canceled") !== "1") return;
    const sessionId = searchParams.get("session_id")?.trim();
    if (!sessionId) return;
    const partyDate = form.partyDate;
    const packageSlug = form.packageSlug;
    let cancelled = false;
    void (async () => {
      try {
        await fetch(`${window.location.origin}/api/cancel-checkout`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ session_id: sessionId }),
        });
      } catch {
        /* ignore */
      }
      if (cancelled) return;
      if (partyDate) {
        try {
          const r = await fetch(
            `${window.location.origin}/api/check-availability?date=${encodeURIComponent(partyDate)}&packageSlug=${encodeURIComponent(packageSlug)}`
          );
          if (r.ok) {
            const data = (await r.json()) as { occupiedTimes?: string[] };
            if (!cancelled && Array.isArray(data.occupiedTimes)) {
              setOccupiedTimes(data.occupiedTimes);
            }
          }
        } catch {
          /* ignore */
        }
      }
      if (cancelled) return;
      const next = new URLSearchParams(searchParams);
      next.delete("canceled");
      next.delete("session_id");
      setSearchParams(next, { replace: true });
      setNoticeBanner(
        "Checkout was cancelled — we’ve released that time slot. You can book the same time again if it’s still free."
      );
    })();
    return () => {
      cancelled = true;
    };
  }, [searchParams, setSearchParams, form.partyDate, form.packageSlug]);

  const selectedPackage = useMemo(
    () => PACKAGES.find((p) => p.slug === form.packageSlug) ?? PACKAGES[1],
    [form.packageSlug]
  );

  const occasionCopy = useMemo(
    () => occasionFieldCopy(form.occasionType as OccasionType),
    [form.occasionType]
  );

  const partyTimeOptions = useMemo(
    () =>
      PARTY_TIME_LIST_OPTIONS.map((o) =>
        o.value === ""
          ? { ...o }
          : {
              ...o,
              disabled: occupiedTimes.includes(o.value),
              label: occupiedTimes.includes(o.value) ? `${o.label} (booked)` : o.label,
            }
      ),
    [occupiedTimes]
  );

  const selectedPartyTimeLabel = useMemo(
    () =>
      PARTY_START_TIME_OPTIONS.find((o) => o.value === form.partyTime)?.label ?? form.partyTime,
    [form.partyTime]
  );

  const selectedPartyDateLabel = useMemo(
    () => formatPartyDateLabel(form.partyDate),
    [form.partyDate]
  );

  const shuffleTimeLabels = useMemo(
    () => buildShuffleTimeLabels(form.partyTime, selectedPartyTimeLabel),
    [form.partyTime, selectedPartyTimeLabel]
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
          `${window.location.origin}/api/check-availability?date=${encodeURIComponent(form.partyDate)}&packageSlug=${encodeURIComponent(form.packageSlug)}`
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
  }, [form.partyDate, form.packageSlug]);

  useEffect(() => {
    if (!form.partyTime || !occupiedTimes.includes(form.partyTime)) return;
    const id = requestAnimationFrame(() => {
      setForm((f) => ({ ...f, partyTime: "" }));
    });
    return () => cancelAnimationFrame(id);
  }, [occupiedTimes, form.partyTime]);

  useEffect(() => {
    if (!slotConfirmedAt || flowStep !== "form") return;
    const endAt = slotConfirmedAt + SLOT_HOLD_MINUTES * 60 * 1000;
    let frame = 0;
    const tick = () => {
      const remaining = Math.max(0, endAt - Date.now());
      setHoldRemainingMs(remaining);
      if (remaining <= 0) {
        clearBookingDraft();
        setSlotConfirmedAt(null);
        setNoticeBanner(
          "Your reservation window has ended. Please check availability again to confirm your slot before paying."
        );
        return;
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [slotConfirmedAt, flowStep]);

  const extraFee = extraPrincessFee(form.extraCharacter);
  const hasExtra = extraFee > 0;
  const extraNeeded = extraPrincessRequired(form.numChildren);
  const extraPrincessName = hasExtra ? characterLabelForSlug(form.extraCharacter) : "";
  const packageListTotal = selectedPackage.price;
  const packagePromoTotal = totalFor(selectedPackage);
  const packageListBalance = standardRemainingFor(selectedPackage);
  const packagePromoBalance = remainingFor(selectedPackage);
  const deposit = depositFor(selectedPackage);
  const balance = packagePromoBalance + extraFee;
  const listBalance = packageListBalance + extraFee;
  const grandTotal = packagePromoTotal + extraFee;
  const offerOn = isAugustOfferActive();
  const saved = discountFor(selectedPackage);

  const extraPrincessOptions = useMemo(() => {
    const taken = form.character.trim().toLowerCase();
    return [
      {
        value: "",
        label: extraNeeded ? "Choose a second princess" : "No extra princess",
        disabled: extraNeeded,
      },
      ...CHARACTERS.filter((c) => c.slug !== taken).map((c) => ({
        value: c.slug,
        label: c.name,
      })),
      ...(taken === "surprise"
        ? []
        : [{ value: "surprise", label: "Surprise me!" }]),
    ];
  }, [form.character, extraNeeded]);

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => {
      const next = { ...f, [key]: value };
      if (
        (key === "character" || key === "extraCharacter") &&
        next.extraCharacter &&
        next.character &&
        next.extraCharacter === next.character
      ) {
        next.extraCharacter = "";
      }
      return next;
    });

  const validatePickSlot = (): boolean => {
    const e: Partial<Record<keyof FormState, string>> = {};
    if (!form.partyDate) e.partyDate = "Please choose a date";
    else if (isPartyDateTooSoon(form.partyDate)) e.partyDate = BOOKING_LEAD_TIME_MESSAGE;
    if (!form.partyTime) e.partyTime = "Please choose a start time";
    else if (!PARTY_TIME_VALUE_SET.has(form.partyTime))
      e.partyTime = "Please choose a time between 9:00 am and 4:00 pm";
    else if (occupiedTimes.includes(form.partyTime))
      e.partyTime = "That time is already booked — pick another slot";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleCheckSlot = async () => {
    if (!validatePickSlot()) return;
    setSlotCheckError(null);
    setFlowStep("checking");

    const minDelay = new Promise((resolve) =>
      window.setTimeout(resolve, AVAILABILITY_CHECK_MIN_MS)
    );
    const checkPromise = fetch(
      `${window.location.origin}/api/check-availability?date=${encodeURIComponent(form.partyDate)}&time=${encodeURIComponent(form.partyTime)}&packageSlug=${encodeURIComponent(form.packageSlug)}`
    );

    try {
      const [, avRes] = await Promise.all([minDelay, checkPromise]);
      let avJson: { available?: boolean; error?: string } = {};
      try {
        avJson = (await avRes.json()) as { available?: boolean; error?: string };
      } catch {
        /* non-JSON */
      }
      if (!avRes.ok || avJson.available === false) {
        setFlowStep("pick-slot");
        setSlotCheckError(
          avJson.error ??
            "That date and time is no longer available. Please choose another slot."
        );
        setErrors((prev) => ({
          ...prev,
          partyTime:
            avJson.error ??
            "That date and time is no longer available. Please choose another slot.",
        }));
        return;
      }
      setSlotConfirmedAt(Date.now());
      setHoldRemainingMs(SLOT_HOLD_MINUTES * 60 * 1000);
      setFlowStep("form");
    } catch {
      /* API unreachable (e.g. local dev) — server enforces on checkout */
      setSlotConfirmedAt(Date.now());
      setHoldRemainingMs(SLOT_HOLD_MINUTES * 60 * 1000);
      setFlowStep("form");
    }
  };

  const validate = (): boolean => {
    const e: Partial<Record<keyof FormState, string>> = {};
    if (!form.parentName.trim()) e.parentName = "Please enter your name";
    if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = "Please enter a valid email";
    if (!form.phone.trim() || form.phone.replace(/\D/g, "").length < 7)
      e.phone = "Please enter a valid phone number";
    if (!form.childName.trim()) e.childName = "Please fill in this field";
    if (form.occasionType === "child_birthday") {
      if (!form.childAge.trim()) e.childAge = "Please enter your child's age";
    }
    if (!form.partyDate) e.partyDate = "Please choose a date";
    else if (isPartyDateTooSoon(form.partyDate)) e.partyDate = BOOKING_LEAD_TIME_MESSAGE;
    if (!form.partyTime) e.partyTime = "Please choose a start time";
    else if (!PARTY_TIME_VALUE_SET.has(form.partyTime))
      e.partyTime = "Please choose a time between 9:00 am and 4:00 pm";
    else if (occupiedTimes.includes(form.partyTime))
      e.partyTime = "That time is already booked — pick another slot";
    if (!form.address.trim()) e.address = "Please enter the address";
    const postcodeCheck = checkServicePostcode(form.postcode);
    if (!postcodeCheck.ok) e.postcode = postcodeCheck.error;
    if (!form.character.trim()) e.character = "Please choose a princess";
    else if (
      form.character !== "surprise" &&
      !CHARACTERS.some((c) => c.slug === form.character)
    ) {
      e.character = "Please choose a princess";
    }
    const extra = form.extraCharacter.trim();
    if (extra && extra !== "surprise" && !CHARACTERS.some((c) => c.slug === extra)) {
      e.extraCharacter = "Please choose a princess";
    }
    if (extra && extra === form.character.trim()) {
      e.extraCharacter = "Please choose a different princess from your first entertainer";
    }
    if (extraPrincessRequired(form.numChildren) && !extra) {
      e.extraCharacter = `Parties with more than ${EXTRA_PRINCESS_REQUIRED_ABOVE} children need a second princess (£${EXTRA_PRINCESS_FEE_GBP} on the day)`;
    }
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
          `${window.location.origin}/api/check-availability?date=${encodeURIComponent(form.partyDate)}&time=${encodeURIComponent(form.partyTime)}&packageSlug=${encodeURIComponent(form.packageSlug)}`
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

      const postcodeCheck = checkServicePostcode(form.postcode);
      const normalisedPostcode = postcodeCheck.ok ? postcodeCheck.normalised : form.postcode.trim();
      const payload: BookingPayload = {
        occasionType: form.occasionType,
        parentName: form.parentName,
        email: form.email,
        phone: form.phone,
        childName: form.childName,
        childAge: form.childAge,
        partyDate: form.partyDate,
        partyTime: form.partyTime,
        address: form.address.trim(),
        postcode: normalisedPostcode,
        character: form.character,
        extraCharacter: form.extraCharacter.trim(),
        packageSlug: form.packageSlug,
        numChildren: form.numChildren,
        specialRequests: form.specialRequests,
      };
      await redirectToDeposit(selectedPackage, payload);
    } finally {
      setSubmitting(false);
    }
  };

  const earliestDate = earliestBookableDateISO();

  return (
    <>
      <AnimatePresence>
        {flowStep === "checking" && (
          <AvailabilityCheckingOverlay
            key="availability-check"
            partyDateLabel={selectedPartyDateLabel}
            partyTimeLabel={selectedPartyTimeLabel || "your chosen time"}
            shuffleTimeLabels={shuffleTimeLabels}
          />
        )}
      </AnimatePresence>

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
        subtitle={
          flowStep === "pick-slot" || flowStep === "checking"
            ? "First, choose your party date and start time — we'll check the calendar and then you can complete your booking."
            : "Fill out the form below to request your magical party. We'll respond quickly to confirm details and secure your date with your online deposit."
        }
      />

      <section className="section-pad bg-white relative overflow-hidden">
        <Sparkles count={32} variant="gold" className="opacity-40" />
        <div className="container-px max-w-6xl mx-auto grid min-w-0 lg:grid-cols-[1.5fr_1fr] gap-8 lg:gap-10 relative z-10">
          {/* ============================ FORM ============================ */}
          <motion.form
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            onSubmit={handleSubmit}
            className="card-magical min-w-0 p-5 sm:p-8 lg:p-10 space-y-5"
            noValidate
          >
            {checkoutErrorBanner && flowStep === "form" && (
              <div
                role="alert"
                className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-950 text-sm"
              >
                <strong className="block mb-1">Payment didn&apos;t complete</strong>
                {checkoutErrorBanner}
              </div>
            )}
            {noticeBanner && flowStep === "form" && (
              <div
                role="status"
                className="p-4 rounded-xl bg-sky-50 border border-sky-200 text-sky-950 text-sm"
              >
                {noticeBanner}
              </div>
            )}

            {flowStep === "pick-slot" && (
              <>
                <h2 className="heading-display text-2xl sm:text-3xl">Check Availability</h2>
                <p className="text-sm text-inkSoft -mt-1 leading-relaxed">
                  Parties can be booked any day of the week, with at least{" "}
                  <strong className="font-semibold text-ink">
                    {MIN_BOOKING_LEAD_DAYS} days&apos; (3 weeks&apos;) notice
                  </strong>
                  . Pick when the visit{" "}
                  <strong className="font-semibold text-ink">starts</strong> — arrivals from 9:00
                  am to 4:00 pm in 15-minute steps.
                </p>
                {slotCheckError && (
                  <div
                    role="alert"
                    className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-950 text-sm"
                  >
                    {slotCheckError}
                  </div>
                )}
                <div className="grid sm:grid-cols-2 gap-5">
                  <Field label="Party Date" error={errors.partyDate} htmlFor="partyDate">
                    <MagicalDateField
                      id="partyDate"
                      min={earliestDate}
                      value={form.partyDate}
                      onChange={(iso) => update("partyDate", iso)}
                      invalid={!!errors.partyDate}
                    />
                    <p className="mt-1.5 text-xs text-inkSoft leading-snug">
                      Earliest online booking date:{" "}
                      {formatPartyDateLabel(earliestDate)} (3 weeks&apos; notice).
                    </p>
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
                    <p className="mt-1.5 text-xs text-inkSoft leading-snug">
                      Times shown in grey are already booked. Pick a free slot to continue.
                    </p>
                  </Field>
                </div>
                <button
                  type="button"
                  onClick={() => void handleCheckSlot()}
                  className="btn-primary w-full justify-center text-base py-4"
                >
                  Check Availability
                </button>
              </>
            )}

            {flowStep === "form" && slotConfirmedAt && (
              <div
                role="status"
                className="p-4 sm:p-5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950 text-sm space-y-3"
              >
                <p className="font-display text-lg text-emerald-900">
                  Great news — your chosen time is available!
                </p>
                <p className="leading-relaxed">
                  Fill in the details below to secure your booking with a deposit.
                </p>
                <SlotHoldTimer remainingMs={holdRemainingMs} />
                <p className="text-emerald-900/90 leading-relaxed text-xs sm:text-sm">
                  This date and time is popular — other families may be looking at the same slot.
                  Complete your booking before the timer ends to keep your chosen time.
                </p>
                <p className="text-emerald-900/80 text-xs sm:text-sm leading-relaxed border-t border-emerald-200/80 pt-2">
                  Want to compare packages or characters first?{" "}
                  <Link to="/packages" className="text-pinkDeep font-semibold underline">
                    Browse packages
                  </Link>
                  ,{" "}
                  <Link to="/characters" className="text-pinkDeep font-semibold underline">
                    meet our princesses
                  </Link>
                  , or use the menu — your form, date, time, and{" "}
                  <strong className="font-semibold tabular-nums">
                    {formatCountdown(holdRemainingMs)}
                  </strong>{" "}
                  timer stay saved. Tap <strong className="font-semibold">Resume booking</strong> on
                  any page to return.
                </p>
              </div>
            )}

            {flowStep === "form" && (
              <>
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

            <Field label="Type of occasion" htmlFor="occasionType">
              <MagicalListbox
                id="occasionType"
                value={form.occasionType}
                onChange={(v) => {
                  const next = v as OccasionType;
                  setForm((f) => ({
                    ...f,
                    occasionType: next,
                    ...(next !== "family_celebration" && next !== "child_birthday"
                      ? { childAge: "" }
                      : {}),
                  }));
                  setErrors((prev) => {
                    const { childAge: _a, ...rest } = prev;
                    return rest;
                  });
                }}
                options={[...OCCASION_OPTIONS]}
                placeholder="Choose occasion type"
              />
            </Field>

            <h2 className="heading-display text-2xl sm:text-3xl pt-2">{occasionCopy.sectionTitle}</h2>
            <p className="text-sm text-inkSoft -mt-1 leading-relaxed">{occasionCopy.sectionBlurb}</p>

            <div
              className={
                occasionCopy.showAge ? "grid sm:grid-cols-[2fr_1fr] gap-5" : "grid gap-5"
              }
            >
              <Field
                label={occasionCopy.primaryLabel}
                error={errors.childName}
                htmlFor="childName"
              >
                <input
                  id="childName"
                  type="text"
                  className="input-magical"
                  placeholder={occasionCopy.primaryPlaceholder}
                  value={form.childName}
                  onChange={(e) => update("childName", e.target.value)}
                />
              </Field>
              {occasionCopy.showAge && (
                <Field
                  label={occasionCopy.secondaryLabel}
                  error={errors.childAge}
                  htmlFor="childAge"
                >
                  <input
                    id="childAge"
                    type="number"
                    min={1}
                    max={99}
                    className="input-magical input-magical-enhanced"
                    placeholder={occasionCopy.secondaryPlaceholder}
                    value={form.childAge}
                    onChange={(e) => update("childAge", e.target.value)}
                  />
                </Field>
              )}
            </div>

            <h2 className="heading-display text-2xl sm:text-3xl pt-4">Party Details</h2>
            <p className="text-xs text-inkSoft -mt-1">
              Parties need at least{" "}
              <strong className="font-semibold text-ink">
                {MIN_BOOKING_LEAD_DAYS} days&apos; (3 weeks&apos;) notice
              </strong>
              . Pick when the visit{" "}
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
                  min={earliestDate}
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
                <p className="mt-1.5 text-xs text-inkSoft leading-snug">
                  Times shown in grey are already booked — it helps show how popular we are. Pick
                  a free slot to continue.
                </p>
              </Field>
            </div>

            <div className="grid sm:grid-cols-2 gap-5">
              <Field label={occasionCopy.addressLabel} error={errors.address} htmlFor="address">
                <input
                  id="address"
                  type="text"
                  autoComplete="street-address"
                  className="input-magical"
                  placeholder={occasionCopy.addressPlaceholder}
                  value={form.address}
                  onChange={(e) => update("address", e.target.value)}
                />
              </Field>
              <Field label="Postcode" error={errors.postcode} htmlFor="postcode">
                <input
                  id="postcode"
                  type="text"
                  autoComplete="postal-code"
                  inputMode="text"
                  className="input-magical"
                  placeholder="e.g. CV2 5EJ"
                  value={form.postcode}
                  onChange={(e) => update("postcode", e.target.value)}
                />
                <p className="mt-1.5 text-xs text-inkSoft leading-snug">
                  We cover Coventry and nearby towns within about 40 minutes (Bedworth,
                  Nuneaton, Leamington Spa, Southam, Warwick).
                </p>
              </Field>
            </div>

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

            <Field label={occasionCopy.childrenCountLabel} error={errors.numChildren} htmlFor="numChildren">
              <input
                id="numChildren"
                type="number"
                min={1}
                className="input-magical input-magical-enhanced"
                placeholder="10"
                value={form.numChildren}
                onChange={(e) => update("numChildren", e.target.value)}
              />
              <p className="mt-1.5 text-xs text-inkSoft leading-snug">
                More than {EXTRA_PRINCESS_REQUIRED_ABOVE} children? A second princess is required
                (£{EXTRA_PRINCESS_FEE_GBP} added to the cash balance on the day).
              </p>
            </Field>

            <Field
              label={extraNeeded ? "Extra princess (required)" : "Extra princess (optional)"}
              error={errors.extraCharacter}
              htmlFor="extraCharacter"
            >
              <MagicalListbox
                id="extraCharacter"
                value={form.extraCharacter}
                onChange={(v) => update("extraCharacter", v)}
                options={extraPrincessOptions}
                placeholder={
                  extraNeeded ? "Choose a second princess" : "No extra princess"
                }
                invalid={!!errors.extraCharacter}
              />
              <p className="mt-1.5 text-xs text-inkSoft leading-snug">
                {extraNeeded
                  ? `Because more than ${EXTRA_PRINCESS_REQUIRED_ABOVE} children are attending, please add a second entertainer. The extra £${EXTRA_PRINCESS_FEE_GBP} is paid in cash on the day — your online deposit stays the same.`
                  : `Add a second entertainer for £${EXTRA_PRINCESS_FEE_GBP}, paid in cash on the day. Your online deposit does not change.`}
              </p>
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
                  Terms & Booking Policy
                </Link>{" "}
                and{" "}
                <Link to="/privacy" className="text-pinkDeep underline">
                  Privacy Policy
                </Link>
                . I understand the online deposit is non-refundable, and that
                bookings need at least 3 weeks&apos; notice.
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
              </>
            )}
          </motion.form>

          {/* ============================ SUMMARY ============================ */}
          {/* Sidebar: stick the whole column so summary + chat never overlap */}
          <aside className="min-w-0 space-y-6 lg:sticky lg:top-24 lg:z-10 lg:self-start lg:max-h-[calc(100dvh-6.5rem)] lg:overflow-y-auto lg:overscroll-contain">
            {flowStep === "pick-slot" || flowStep === "checking" ? (
              <div className="card-magical p-5 sm:p-7">
                <div className="heading-eyebrow">Step 1</div>
                <h3 className="font-display text-2xl mt-2">Choose date &amp; time</h3>
                <p className="text-sm text-inkSoft mt-2 leading-relaxed">
                  We use the same live calendar as our team — unavailable slots are greyed out so
                  you only pick times that are genuinely free.
                </p>
                <div className="mt-6 pt-6 border-t border-pinkSoft">
                  <TrustBadges items={TRUST_BADGES} />
                </div>
              </div>
            ) : (
            <div className="card-magical p-5 sm:p-7">
              <div className="heading-eyebrow">Booking Summary</div>
              <h3 className="font-display text-2xl mt-2">{selectedPackage.name}</h3>
              <p className="text-sm text-inkSoft mt-1">{selectedPackage.tagline}</p>

              {(form.partyDate || form.partyTime) && (
                <div className="mt-4 p-3 rounded-xl bg-pinkPale/50 border border-pinkSoft text-sm space-y-1">
                  {form.partyDate && (
                    <p>
                      <span className="text-inkSoft">Date: </span>
                      <span className="font-medium text-ink">{selectedPartyDateLabel}</span>
                    </p>
                  )}
                  {form.partyTime && (
                    <p>
                      <span className="text-inkSoft">Start: </span>
                      <span className="font-medium text-ink">{selectedPartyTimeLabel}</span>
                    </p>
                  )}
                </div>
              )}

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
                {offerOn && (
                  <div className="mb-3 rounded-xl bg-pinkPale/60 border border-pinkSoft px-3 py-2.5 text-xs text-ink leading-snug">
                    <span className="font-semibold text-pinkDeep">{AUGUST_OFFER.title}</span>
                    {" — "}
                    15% off the package, applied to your cash balance. Deposit stays the same.
                    Extra princess is a flat £{EXTRA_PRINCESS_FEE_GBP} on the day.
                  </div>
                )}
                <Row
                  label="Package"
                  value={
                    offerOn ? (
                      <span className="inline-flex items-baseline gap-2">
                        <span className="line-through text-inkSoft/70 font-normal text-sm">
                          £{packageListTotal}
                        </span>
                        <span>£{packagePromoTotal}</span>
                      </span>
                    ) : (
                      `£${packageListTotal}`
                    )
                  }
                />
                {hasExtra && (
                  <Row
                    label={`Extra princess${extraPrincessName ? ` (${extraPrincessName})` : ""}`}
                    value={`+ £${EXTRA_PRINCESS_FEE_GBP}`}
                  />
                )}
                <Row label="Deposit (online)" value={`£${deposit}`} highlight />
                <Row
                  label="Balance on day (cash)"
                  value={
                    offerOn ? (
                      <span className="inline-flex items-baseline gap-2">
                        <span className="line-through text-inkSoft/70 font-normal text-sm">
                          £{listBalance}
                        </span>
                        <span className="text-pinkDeep">£{balance}</span>
                      </span>
                    ) : (
                      `£${balance}`
                    )
                  }
                />
                <Row label="Grand total" value={`£${grandTotal}`} />
                {offerOn && (
                  <p className="text-[11px] text-pinkDeep font-medium pt-1">
                    You save £{saved} on the package (extra princess is not discounted)
                  </p>
                )}
              </div>

              <p className="mt-5 text-xs text-inkSoft">
                Your deposit secures the date and chosen princess. The remaining
                balance is paid in cash on the day.
                {offerOn &&
                  " During our August offer, the discount comes off this cash balance — not your deposit."}
              </p>
            </div>
            )}

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
  value: React.ReactNode;
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

function SlotHoldTimer({ remainingMs }: { remainingMs: number }) {
  const totalMs = SLOT_HOLD_MINUTES * 60 * 1000;
  const clampedMs = Math.max(0, Math.min(totalMs, remainingMs));
  const pct = (clampedMs / totalMs) * 100;
  const urgent = clampedMs <= 5 * 60 * 1000;
  const displaySec = Math.ceil(clampedMs / 1000);
  const minutes = Math.floor(displaySec / 60);
  const seconds = displaySec % 60;

  const shellClass = urgent
    ? "border-amber-400 bg-gradient-to-br from-amber-50 via-white to-amber-50/80 shadow-[0_8px_28px_-6px_rgba(217,119,6,0.35)]"
    : "border-pinkDeep bg-gradient-to-br from-pinkPale via-white to-pinkPale/40 shadow-[0_8px_28px_-6px_rgba(216,27,96,0.3)]";

  const digitClass = urgent ? "text-amber-700" : "text-pinkDeep";
  const labelClass = urgent ? "text-amber-800" : "text-pinkDeep";

  const digits = (
    <div
      className={`font-display font-bold tabular-nums tracking-tight leading-none text-5xl sm:text-6xl ${digitClass}`}
      aria-hidden
    >
      <span>{minutes}</span>
      <span className="mx-0.5 sm:mx-1 opacity-80">:</span>
      <span>{String(seconds).padStart(2, "0")}</span>
    </div>
  );

  return (
    <div
      className={`rounded-2xl border-2 p-4 sm:p-5 ${shellClass}`}
      aria-label={`${minutes} minutes and ${seconds} seconds left to secure your slot`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
        <div className="flex-1 text-center sm:text-left">
          <p className={`font-cinzel uppercase tracking-[0.22em] text-xs font-semibold ${labelClass}`}>
            Secure your slot
          </p>
          <p className="mt-1 text-sm text-ink/80 leading-relaxed">
            Complete your booking before this countdown finishes.
          </p>
          <div className="mt-3 h-2 rounded-full bg-white/80 overflow-hidden border border-pinkSoft/80">
            <div
              className={`h-full w-full rounded-full origin-left will-change-transform ${urgent ? "bg-amber-500" : "bg-pinkDeep"}`}
              style={{ transform: `scaleX(${pct / 100})` }}
            />
          </div>
        </div>
        <div className="flex flex-col items-center justify-center shrink-0 min-w-[9rem] px-4 py-3 rounded-xl bg-white/90 border border-white shadow-inner">
          <span className={`text-[0.65rem] font-semibold uppercase tracking-wider ${labelClass}`}>
            Time remaining
          </span>
          {digits}
          <span className="text-xs text-inkSoft mt-1.5">min : sec</span>
        </div>
      </div>
    </div>
  );
}
