import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import SEO from "../components/SEO";
import Sparkles from "../components/Sparkles";
import { WandIcon } from "../components/CrownIcon";
import { SITE } from "../data/site";
import {
  fireGoogleAdsDepositConversion,
  isGoogleAdsConversionConfigured,
} from "../lib/googleAds";
import { clearBookingDraft } from "../lib/bookingDraft";

type StatusPayload = {
  status?: string;
  bookingId?: string;
  partyDate?: string;
  partyTime?: string;
  depositAmount?: number | null;
};

async function copyText(label: string, text: string, onDone: (msg: string) => void) {
  try {
    await navigator.clipboard.writeText(text);
    onDone(`${label} copied`);
  } catch {
    onDone("Could not copy — select and copy manually");
  }
}

export default function BookingSuccess() {
  useEffect(() => {
    clearBookingDraft();
  }, []);

  const [params] = useSearchParams();
  const stripeSession = params.get("session_id");
  const dev = params.get("dev") === "1" && !stripeSession;
  const [recordStatus, setRecordStatus] = useState<"unknown" | "pending" | "confirmed">(
    stripeSession ? "unknown" : "confirmed"
  );
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [depositAmount, setDepositAmount] = useState<number | null>(null);
  const [slowPoll, setSlowPoll] = useState(false);
  const [copyHint, setCopyHint] = useState<string | null>(null);
  const ensureEmailsOnce = useRef(false);

  const showCopyHint = useCallback((msg: string) => {
    setCopyHint(msg);
    window.setTimeout(() => setCopyHint(null), 2500);
  }, []);

  useEffect(() => {
    if (!stripeSession) return;

    let cancelled = false;
    let attempts = 0;
    const maxAttempts = 30;

    const poll = async () => {
      if (cancelled || attempts >= maxAttempts) {
        if (!cancelled && attempts >= maxAttempts) setSlowPoll(true);
        return;
      }
      attempts += 1;
      try {
        const r = await fetch(
          `${window.location.origin}/api/booking-status?session_id=${encodeURIComponent(stripeSession)}`
        );
        if (!r.ok) {
          setTimeout(poll, 2000);
          return;
        }
        const j = (await r.json()) as StatusPayload;
        if (cancelled) return;
        if (j.bookingId) setBookingId(j.bookingId);
        if (typeof j.depositAmount === "number" && Number.isFinite(j.depositAmount)) {
          setDepositAmount(j.depositAmount);
        }
        if (j.status === "confirmed") {
          setRecordStatus("confirmed");
          return;
        }
        if (j.status === "pending") {
          setRecordStatus("pending");
        }
      } catch {
        /* transient network — keep polling */
      }
      setTimeout(poll, 2000);
    };

    poll();
    return () => {
      cancelled = true;
    };
  }, [stripeSession]);

  useEffect(() => {
    if (!stripeSession || recordStatus !== "confirmed" || ensureEmailsOnce.current) {
      return;
    }
    ensureEmailsOnce.current = true;
    const origin = window.location.origin;
    void fetch(`${origin}/api/ensure-booking-emails`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId: stripeSession }),
    }).catch(() => {
      /* non-blocking backup if Stripe webhook was delayed or Resend failed once */
    });
  }, [stripeSession, recordStatus]);

  useEffect(() => {
    if (!stripeSession || recordStatus !== "confirmed") return;
    if (!isGoogleAdsConversionConfigured()) return;
    if (depositAmount == null || !(depositAmount > 0)) return;
    const storageKey = `apd_gads_deposit_conv:${stripeSession}`;
    if (sessionStorage.getItem(storageKey)) return;
    sessionStorage.setItem(storageKey, "1");
    fireGoogleAdsDepositConversion({
      value: depositAmount,
      transactionId: stripeSession,
    });
  }, [stripeSession, recordStatus, depositAmount]);

  const mailSupportHref = `mailto:${SITE.email}?subject=${encodeURIComponent(
    `Booking help — ref ${bookingId ?? stripeSession ?? "unknown"}`
  )}`;

  return (
    <>
      <SEO
        title="Thank you for your booking"
        description="Your PrincessDream party deposit is received. Save your booking reference and watch for your confirmation email."
        path="/booking-success"
        noindex
      />

      <section className="relative overflow-hidden bg-magic-gradient py-10 sm:py-12 lg:py-14">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/40 via-transparent to-lavender/35" />
        <Sparkles count={40} variant="gold" className="opacity-45" />
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="container-px w-full max-w-3xl mx-auto relative z-10 space-y-8 sm:space-y-10"
        >
          <div className="text-center space-y-4 sm:space-y-5">
            <div className="mx-auto w-[4.5rem] h-[4.5rem] sm:w-20 sm:h-20 rounded-full bg-accent-btn shadow-accent grid place-items-center ring-2 ring-white/90 ring-offset-2 ring-offset-pinkSoft/30">
              <WandIcon className="w-9 h-9 sm:w-10 sm:h-10 text-white drop-shadow-sm" />
            </div>

            <h1 className="font-display text-3xl sm:text-4xl md:text-5xl text-ink leading-tight px-1">
              Thank you —{" "}
              <span className="bg-gradient-to-r from-pinkDeep via-pinkDeep to-goldDeep bg-clip-text text-transparent">
                you&apos;re officially on the calendar!
              </span>
            </h1>
            <p className="accent-hr max-w-xs mx-auto" />

            <p className="text-ink text-base sm:text-lg leading-relaxed font-medium max-w-2xl mx-auto px-1">
              Your payment went through beautifully. We&apos;re already looking forward to
              making your party magical.
            </p>
          </div>

          {stripeSession && recordStatus === "pending" && (
            <p className="text-sm text-inkSoft max-w-2xl mx-auto bg-white/80 rounded-2xl px-4 py-3 border border-pinkBlush/35 leading-relaxed text-center sm:text-left">
              We&apos;re confirming your payment — this usually takes a few seconds. Your
              booking reference will appear below as soon as we&apos;ve linked everything.
            </p>
          )}
          {stripeSession && slowPoll && recordStatus !== "confirmed" && (
            <p className="text-sm text-amber-950 max-w-2xl mx-auto bg-amber-50/95 rounded-2xl px-4 py-3 border border-amber-200 leading-relaxed text-center sm:text-left">
              Confirmation is taking longer than usual. If you have a Stripe receipt, your
              payment went through — email{" "}
              <a href={mailSupportHref} className="text-pinkDeep font-semibold underline">
                {SITE.email}
              </a>{" "}
              with your <strong>name</strong>, <strong>party date</strong>, and the{" "}
              <strong>email you used at checkout</strong>, or call{" "}
              <a href={`tel:${SITE.phoneTel}`} className="text-pinkDeep underline font-semibold">
                {SITE.phone}
              </a>
              .
            </p>
          )}

          <div className="rounded-3xl border border-pinkBlush/50 bg-white/95 shadow-soft backdrop-blur-sm text-left overflow-hidden">
            {stripeSession && (
              <div className="p-6 sm:p-8 md:p-10 space-y-6 sm:space-y-8">
                <div className="text-center sm:text-left space-y-2">
                  <div className="flex items-center gap-2 justify-center sm:justify-start">
                    <span className="text-xl" aria-hidden>
                      ✨
                    </span>
                    <h2 className="font-display text-xl sm:text-2xl text-ink">
                      Save your booking reference
                    </h2>
                  </div>
                  <p className="text-sm sm:text-base text-inkSoft leading-relaxed max-w-2xl mx-auto sm:mx-0">
                    Please <strong className="text-ink">keep a screenshot or note</strong> of
                    your reference — it helps us find your party quickly if you ever email us.
                  </p>
                </div>

                <div className="rounded-2xl bg-gradient-to-br from-pinkSoft/80 via-white to-lavender/40 border border-pinkBlush/45 p-5 sm:p-6">
                  <p className="text-xs font-semibold uppercase tracking-wider text-pinkDeep mb-2">
                    Booking reference
                  </p>
                  <p className="font-mono text-sm sm:text-base text-ink break-all bg-white/95 rounded-xl px-4 py-3.5 border border-pinkBlush/50 leading-snug">
                    {bookingId ?? (recordStatus === "pending" ? "Loading…" : "—")}
                  </p>
                  {bookingId && (
                    <button
                      type="button"
                      className="mt-3 text-sm font-semibold text-pinkDeep underline underline-offset-2 hover:text-pinkDeep/90"
                      onClick={() => void copyText("Booking reference", bookingId, showCopyHint)}
                    >
                      Copy booking reference
                    </button>
                  )}
                  {copyHint && (
                    <p className="mt-2 text-sm text-pinkDeep font-medium" role="status">
                      {copyHint}
                    </p>
                  )}
                </div>

                <div className="rounded-2xl border border-gold/30 bg-cream/95 px-5 py-5 sm:px-6 sm:py-6 text-sm sm:text-base text-ink/90 leading-relaxed space-y-3">
                  <p className="font-semibold text-ink text-center sm:text-left">
                    Confirmation email
                  </p>
                  <p>
                    We&apos;re sending a <strong>confirmation email</strong> to the address
                    you used at checkout (check your <strong>inbox and spam</strong> folder).
                  </p>
                  <p>
                    If nothing arrives within a little while, email{" "}
                    <a
                      href={mailSupportHref}
                      className="text-pinkDeep font-semibold underline underline-offset-2 break-all"
                    >
                      {SITE.email}
                    </a>{" "}
                    and include your <strong className="text-ink">booking reference</strong>
                    {bookingId ? " above" : " once it appears above"}.
                  </p>
                </div>
              </div>
            )}

            <div
              className={`${stripeSession ? "border-t border-pinkBlush/40" : ""} p-6 sm:p-8 md:p-10`}
            >
              <h2 className="font-display text-xl sm:text-2xl text-center text-ink">
                What happens next?
              </h2>
              <ol className="mt-5 sm:mt-6 space-y-4 text-sm sm:text-base text-ink/90 max-w-2xl mx-auto">
                <li className="flex gap-3 sm:gap-4">
                  <span className="w-9 h-9 shrink-0 grid place-items-center rounded-full bg-accent-btn text-white text-sm font-bold shadow-accent">
                    1
                  </span>
                  <span className="leading-relaxed pt-0.5">
                    <strong className="text-ink">Your inbox sparkles next</strong> — look for
                    our confirmation with every party detail we have on file.
                  </span>
                </li>
                <li className="flex gap-3 sm:gap-4">
                  <span className="w-9 h-9 shrink-0 grid place-items-center rounded-full bg-accent-btn text-white text-sm font-bold shadow-accent">
                    2
                  </span>
                  <span className="leading-relaxed pt-0.5">
                    <strong className="text-ink">A gentle reminder</strong> closer to the big
                    day so the magic stays stress-free.
                  </span>
                </li>
                <li className="flex gap-3 sm:gap-4">
                  <span className="w-9 h-9 shrink-0 grid place-items-center rounded-full bg-accent-btn text-white text-sm font-bold shadow-accent">
                    3
                  </span>
                  <span className="leading-relaxed pt-0.5">
                    <strong className="text-ink">Showtime!</strong> Your princess arrives
                    ready to celebrate.
                  </span>
                </li>
              </ol>
            </div>
          </div>

          {dev && (
            <div className="max-w-2xl mx-auto p-5 sm:p-6 rounded-2xl bg-white/90 border border-pinkBlush/50 text-sm text-ink text-left shadow-soft leading-relaxed">
              <strong className="block mb-2 text-pinkDeep">Demo visit (no online payment)</strong>
              <p className="mb-2">
                The <code className="bg-pinkSoft px-1.5 rounded text-xs">?dev=1</code> in the
                address means the card step was skipped — it does <em>not</em> put the whole
                site in developer mode.
              </p>
              <p>
                After a real payment you&apos;ll see your <strong>booking reference</strong>{" "}
                in the highlighted box on this page. Try{" "}
                <Link to="/book" className="text-pinkDeep underline font-medium">
                  Book again
                </Link>{" "}
                for a full checkout test.
              </p>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 justify-center flex-wrap pt-2">
            <Link to="/" className="btn-primary min-h-[3rem]">
              Back to Home
            </Link>
            <a href={`tel:${SITE.phoneTel}`} className="btn-secondary min-h-[3rem]">
              Call {SITE.phone}
            </a>
            <a href={mailSupportHref} className="btn-secondary min-h-[3rem]">
              Email us
            </a>
          </div>
        </motion.div>
      </section>
    </>
  );
}
