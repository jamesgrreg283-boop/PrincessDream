import { useCallback, useEffect, useMemo, useState } from "react";
import SEO from "../components/SEO";
import PageHeader from "../components/PageHeader";
import { PACKAGES } from "../data/packages";
import { CHARACTERS } from "../data/characters";

const origin = () =>
  typeof window !== "undefined" ? window.location.origin : "";

const fetchOpts: RequestInit = { credentials: "include" };

const PARTY_START_TIMES: { value: string; label: string }[] = (() => {
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

/** Matches server “full bookable day” block (9am–4pm grid). */
const BLOCK_WHOLE_DAY_START = "09:00";
const BLOCK_WHOLE_DAY_END = "16:00";

function blockIsWholeDay(bl: BlockRow): boolean {
  return (
    bl.party_start_time === BLOCK_WHOLE_DAY_START && bl.party_end_time === BLOCK_WHOLE_DAY_END
  );
}

function formatBlockWhen(bl: BlockRow): string {
  if (bl.party_end_date && bl.party_end_date !== bl.party_date) {
    return `${bl.party_date} → ${bl.party_end_date}`;
  }
  return bl.party_date;
}

function formatBlockCoverage(bl: BlockRow): string {
  if (blockIsWholeDay(bl)) return "Whole day (unbookable)";
  if (!bl.party_end_time || bl.party_end_time === bl.party_start_time) {
    return `${bl.party_start_time} only`;
  }
  return `${bl.party_start_time} – ${bl.party_end_time}`;
}

type BookingRow = {
  id: string;
  parent_name: string;
  email: string;
  phone: string;
  child_name: string;
  child_age: string;
  party_date: string;
  party_start_time: string;
  address: string;
  selected_character: string;
  selected_package: string;
  total_price: number;
  deposit_amount: number;
  remaining_balance: number;
  notes: string | null;
  status: string;
  stripe_session_id: string | null;
  stripe_payment_intent_id: string | null;
  created_at: string;
};

type BlockRow = {
  id: string;
  party_date: string;
  party_end_date: string | null;
  party_start_time: string;
  party_end_time: string | null;
  notes: string | null;
  created_at: string;
};

type ManualForm = {
  parentName: string;
  email: string;
  phone: string;
  childName: string;
  childAge: string;
  partyDate: string;
  partyTime: string;
  address: string;
  character: string;
  packageSlug: string;
  numChildren: string;
  specialRequests: string;
  adminNotes: string;
};

const emptyManual: ManualForm = {
  parentName: "",
  email: "",
  phone: "",
  childName: "",
  childAge: "",
  partyDate: "",
  partyTime: "",
  address: "",
  character: "",
  packageSlug: PACKAGES[1]?.slug ?? "1-hour-party",
  numChildren: "",
  specialRequests: "",
  adminNotes: "",
};

function paymentLabel(b: BookingRow): string {
  if (b.status === "cancelled") return "—";
  if (b.status === "confirmed") {
    return b.stripe_payment_intent_id ? "Stripe deposit paid" : "Confirmed (manual)";
  }
  if (b.stripe_session_id) return "Awaiting payment";
  return "Pending hold";
}

export default function AdminBookings() {
  const [sessionChecked, setSessionChecked] = useState(false);
  const [authed, setAuthed] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [bookings, setBookings] = useState<BookingRow[] | null>(null);
  const [blocks, setBlocks] = useState<BlockRow[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [manual, setManual] = useState<ManualForm>(emptyManual);
  const [manualMsg, setManualMsg] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [statusDrafts, setStatusDrafts] = useState<Record<string, string>>({});
  const [blockForm, setBlockForm] = useState({
    partyDate: "",
    partyEndDate: "",
    partyTime: "",
    partyEndTime: "",
    notes: "",
    wholeDays: true,
  });
  const [blockMsg, setBlockMsg] = useState<string | null>(null);
  const [bookingDeleteConfirmId, setBookingDeleteConfirmId] = useState<string | null>(null);

  const characterOptions = useMemo(
    () => [
      ...CHARACTERS.map((c) => ({ value: c.slug, label: c.name })),
      { value: "surprise", label: "Surprise me!" },
    ],
    []
  );

  const loadAll = useCallback(async () => {
    setLoadError(null);
    setBookings(null);
    setBlocks(null);
    try {
      const [rb, rs] = await Promise.all([
        fetch(`${origin()}/api/bookings`, { ...fetchOpts }),
        fetch(`${origin()}/api/blocked-slots`, { ...fetchOpts }),
      ]);
      if (!rb.ok) {
        const j = (await rb.json().catch(() => ({}))) as { error?: string };
        throw new Error(j.error || `Bookings HTTP ${rb.status}`);
      }
      if (!rs.ok) {
        const j = (await rs.json().catch(() => ({}))) as { error?: string };
        throw new Error(j.error || `Blocks HTTP ${rs.status}`);
      }
      const bJson = (await rb.json()) as { bookings: BookingRow[] };
      const sJson = (await rs.json()) as { blocks: BlockRow[] };
      const list = bJson.bookings ?? [];
      setBookings(list);
      const drafts: Record<string, string> = {};
      for (const b of list) drafts[b.id] = b.status;
      setStatusDrafts(drafts);
      setBlocks(sJson.blocks ?? []);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "Failed to load");
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const r = await fetch(`${origin()}/api/admin/me`, { ...fetchOpts });
        const j = (await r.json()) as { ok?: boolean };
        if (!cancelled && j.ok) setAuthed(true);
      } catch {
        /* */
      } finally {
        if (!cancelled) setSessionChecked(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!authed) return;
    const id = requestAnimationFrame(() => {
      void loadAll();
    });
    return () => cancelAnimationFrame(id);
  }, [authed, loadAll]);

  const login = async (ev: React.FormEvent) => {
    ev.preventDefault();
    setLoginError(null);
    try {
      const r = await fetch(`${origin()}/api/admin/login`, {
        method: "POST",
        ...fetchOpts,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: passwordInput }),
      });
      if (!r.ok) {
        setLoginError("Incorrect password.");
        return;
      }
      setPasswordInput("");
      setAuthed(true);
      void loadAll();
    } catch {
      setLoginError("Could not reach server.");
    }
  };

  const logout = async () => {
    try {
      await fetch(`${origin()}/api/admin/logout`, { method: "POST", ...fetchOpts });
    } catch {
      /* still clear UI */
    }
    setAuthed(false);
    setBookings(null);
    setBlocks(null);
  };

  const saveStatus = async (id: string) => {
    const status = statusDrafts[id];
    if (!status) return;
    try {
      const r = await fetch(`${origin()}/api/bookings`, {
        method: "PATCH",
        ...fetchOpts,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      const j = (await r.json().catch(() => ({}))) as { error?: string };
      if (!r.ok) {
        window.alert(j.error || `Update failed (${r.status})`);
        return;
      }
      void loadAll();
    } catch {
      window.alert("Network error");
    }
  };

  const resendEmail = async (id: string) => {
    try {
      const r = await fetch(`${origin()}/api/send-confirmation-email`, {
        method: "POST",
        ...fetchOpts,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId: id }),
      });
      const j = (await r.json().catch(() => ({}))) as { error?: string };
      if (!r.ok) {
        window.alert(j.error || `Send failed (${r.status})`);
        return;
      }
      window.alert("Confirmation emails sent.");
    } catch {
      window.alert("Network error");
    }
  };

  const submitManual = async (ev: React.FormEvent) => {
    ev.preventDefault();
    setManualMsg(null);
    setSaving(true);
    try {
      const res = await fetch(`${origin()}/api/bookings`, {
        method: "POST",
        ...fetchOpts,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          parentName: manual.parentName,
          email: manual.email,
          phone: manual.phone,
          childName: manual.childName,
          childAge: manual.childAge,
          partyDate: manual.partyDate,
          partyTime: manual.partyTime,
          address: manual.address,
          character: manual.character,
          packageSlug: manual.packageSlug,
          numChildren: manual.numChildren,
          specialRequests: manual.specialRequests,
          notes: manual.adminNotes || undefined,
        }),
      });
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setManualMsg(j.error || `Could not save (${res.status})`);
        return;
      }
      setManualMsg("Booking saved.");
      setManual(emptyManual);
      void loadAll();
    } catch {
      setManualMsg("Network error.");
    } finally {
      setSaving(false);
    }
  };

  const deleteBooking = async (id: string) => {
    try {
      const r = await fetch(`${origin()}/api/bookings?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
        ...fetchOpts,
      });
      if (!r.ok) {
        const j = (await r.json().catch(() => ({}))) as { error?: string };
        window.alert(j.error || `Delete failed (${r.status})`);
        return;
      }
      setBookingDeleteConfirmId(null);
      void loadAll();
    } catch {
      window.alert("Network error");
    }
  };

  const addBlock = async (ev: React.FormEvent) => {
    ev.preventDefault();
    setBlockMsg(null);
    const whole = blockForm.wholeDays;
    let partyTime: string;
    let partyEndTime: string | undefined;
    if (whole) {
      partyTime = BLOCK_WHOLE_DAY_START;
      partyEndTime = BLOCK_WHOLE_DAY_END;
    } else {
      partyTime = blockForm.partyTime;
      if (!partyTime) {
        setBlockMsg("Choose a start time, or turn on “Block whole days”.");
        return;
      }
      partyEndTime = blockForm.partyEndTime.trim() || undefined;
    }
    try {
      const r = await fetch(`${origin()}/api/blocked-slots`, {
        method: "POST",
        ...fetchOpts,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          partyDate: blockForm.partyDate,
          partyEndDate: blockForm.partyEndDate.trim() || undefined,
          partyTime,
          partyEndTime,
          notes: blockForm.notes || undefined,
        }),
      });
      const j = (await r.json().catch(() => ({}))) as { error?: string };
      if (!r.ok) {
        setBlockMsg(j.error || `Could not block (${r.status})`);
        return;
      }
      setBlockMsg("Saved. Those dates/times are hidden on the public booking form.");
      setBlockForm({
        partyDate: "",
        partyEndDate: "",
        partyTime: "",
        partyEndTime: "",
        notes: "",
        wholeDays: true,
      });
      void loadAll();
    } catch {
      setBlockMsg("Network error.");
    }
  };

  const deleteBlock = async (id: string) => {
    if (!window.confirm("Remove this block?")) return;
    try {
      const r = await fetch(`${origin()}/api/blocked-slots?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
        ...fetchOpts,
      });
      if (!r.ok) {
        window.alert("Could not remove block");
        return;
      }
      void loadAll();
    } catch {
      window.alert("Network error");
    }
  };

  if (!sessionChecked) {
    return (
      <section className="section-pad bg-white">
        <div className="container-px max-w-xl mx-auto text-sm text-inkSoft">Loading…</div>
      </section>
    );
  }

  if (!authed) {
    return (
      <>
        <SEO
          title="Admin — Bookings"
          description="Staff-only booking list."
          path="/admin/bookings"
          noindex
        />
        <PageHeader
          eyebrow="Staff"
          title="Admin sign-in"
          subtitle="Enter the admin password configured on the server (ADMIN_PASSWORD)."
        />
        <section className="section-pad bg-white">
          <form
            onSubmit={login}
            className="container-px max-w-md mx-auto card-magical p-8 space-y-4"
          >
            {loginError && (
              <p className="text-sm text-pinkDeep" role="alert">
                {loginError}
              </p>
            )}
            <label className="block text-sm font-medium text-ink mb-2">Password</label>
            <input
              type="password"
              autoComplete="current-password"
              className="input-magical"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
            />
            <button type="submit" className="btn-primary w-full justify-center">
              Sign in
            </button>
          </form>
        </section>
      </>
    );
  }

  return (
    <>
      <SEO
        title="Admin — Bookings"
        description="Staff-only booking list."
        path="/admin/bookings"
        noindex
      />
      <PageHeader
        eyebrow="Staff"
        title="Bookings"
        subtitle="View bookings, update status, add manual entries, and block dates on the public calendar."
      />

      <section className="section-pad bg-white space-y-12 pb-24">
        <div className="container-px max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <button type="button" className="btn-secondary" onClick={() => void loadAll()}>
            Refresh
          </button>
          <button
            type="button"
            className="btn-ghost text-pinkDeep font-medium"
            onClick={() => void logout()}
          >
            Log out
          </button>
        </div>

        {loadError && (
          <div className="container-px max-w-6xl mx-auto p-4 rounded-xl bg-red-50 border border-red-200 text-red-900 text-sm">
            {loadError}
          </div>
        )}

        <div className="container-px max-w-6xl mx-auto">
          <h2 className="heading-display text-xl mb-3">All bookings</h2>
          <div className="overflow-x-auto card-magical p-4 sm:p-6">
            <table className="min-w-full text-sm text-left">
              <thead>
                <tr className="border-b border-pinkSoft text-inkSoft">
                  <th className="py-2 pr-3">Date</th>
                  <th className="py-2 pr-3">Time</th>
                  <th className="py-2 pr-3">Parent</th>
                  <th className="py-2 pr-3">Child</th>
                  <th className="py-2 pr-3">Email</th>
                  <th className="py-2 pr-3">Status</th>
                  <th className="py-2 pr-3">Payment</th>
                  <th className="py-2 pr-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {(bookings ?? []).map((b) => (
                  <tr key={b.id} className="border-b border-pinkSoft/60 align-top">
                    <td className="py-2 pr-3 whitespace-nowrap">{b.party_date}</td>
                    <td className="py-2 pr-3 whitespace-nowrap">{b.party_start_time}</td>
                    <td className="py-2 pr-3">{b.parent_name}</td>
                    <td className="py-2 pr-3">{b.child_name}</td>
                    <td className="py-2 pr-3 break-all max-w-[9rem]">{b.email}</td>
                    <td className="py-2 pr-3">
                      <select
                        className="input-magical py-2 text-xs min-w-[8rem]"
                        value={statusDrafts[b.id] ?? b.status}
                        onChange={(e) =>
                          setStatusDrafts((d) => ({ ...d, [b.id]: e.target.value }))
                        }
                      >
                        <option value="pending">pending</option>
                        <option value="confirmed">confirmed</option>
                        <option value="cancelled">cancelled</option>
                      </select>
                    </td>
                    <td className="py-2 pr-3 text-xs text-inkSoft whitespace-nowrap">
                      {paymentLabel(b)}
                    </td>
                    <td className="py-2 pr-3 space-y-1">
                      <button
                        type="button"
                        className="block text-xs text-pinkDeep underline"
                        onClick={() => void saveStatus(b.id)}
                      >
                        Save status
                      </button>
                      {b.status === "confirmed" && (
                        <button
                          type="button"
                          className="block text-xs text-inkSoft underline"
                          onClick={() => void resendEmail(b.id)}
                        >
                          Resend emails
                        </button>
                      )}
                      {bookingDeleteConfirmId === b.id ? (
                        <div className="mt-2 pt-2 border-t border-pinkSoft/50 space-y-1">
                          <p className="text-xs text-amber-900 font-medium">Delete this booking?</p>
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              className="text-xs font-semibold text-red-700 underline"
                              onClick={() => void deleteBooking(b.id)}
                            >
                              Confirm delete
                            </button>
                            <button
                              type="button"
                              className="text-xs text-inkSoft underline"
                              onClick={() => setBookingDeleteConfirmId(null)}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          type="button"
                          className="block text-xs text-red-700/90 underline mt-1"
                          onClick={() => setBookingDeleteConfirmId(b.id)}
                        >
                          Delete booking
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {bookings && bookings.length === 0 && (
              <p className="text-inkSoft text-sm py-6 text-center">No bookings yet.</p>
            )}
          </div>
        </div>

        <div className="container-px max-w-6xl mx-auto">
          <h2 className="heading-display text-xl mb-3">Block dates on the public form</h2>
          <p className="text-sm text-inkSoft mb-4 max-w-xl">
            <strong className="text-ink">Whole days</strong> is the default: pick the first day, optionally
            a last day for a holiday week, and save — no times needed. Turn it off only if you need to
            block part of a day (e.g. one afternoon).
          </p>
          <div className="grid lg:grid-cols-2 gap-8">
            <form onSubmit={addBlock} className="card-magical p-6 space-y-4 max-w-md">
              <h3 className="font-display text-lg">Add a block</h3>
              {blockMsg && <p className="text-sm text-pinkDeep">{blockMsg}</p>}

              <label className="flex items-start gap-3 cursor-pointer rounded-xl border border-pinkSoft/80 bg-pinkSoft/10 p-3">
                <input
                  type="checkbox"
                  className="mt-1 w-4 h-4 rounded border-pinkBlush text-pinkDeep"
                  checked={blockForm.wholeDays}
                  onChange={(e) =>
                    setBlockForm((f) => ({
                      ...f,
                      wholeDays: e.target.checked,
                      ...(e.target.checked ? { partyTime: "", partyEndTime: "" } : {}),
                    }))
                  }
                />
                <span className="text-sm text-ink leading-snug">
                  <strong className="font-semibold">Block whole days</strong> — the same hours the
                  booking form normally offers (9:00 am–4:00 pm) are closed on every day in the range.
                </span>
              </label>

              <div>
                <label className="block text-xs font-medium text-inkSoft mb-1">First day</label>
                <input
                  type="date"
                  required
                  className="input-magical"
                  value={blockForm.partyDate}
                  onChange={(e) => setBlockForm((f) => ({ ...f, partyDate: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-inkSoft mb-1">
                  Last day <span className="font-normal text-inkSoft">(leave blank = one day only)</span>
                </label>
                <input
                  type="date"
                  className="input-magical"
                  min={blockForm.partyDate || undefined}
                  value={blockForm.partyEndDate}
                  onChange={(e) => setBlockForm((f) => ({ ...f, partyEndDate: e.target.value }))}
                />
              </div>

              {!blockForm.wholeDays && (
                <div className="space-y-3 pt-1 border-t border-pinkSoft/60">
                  <p className="text-xs text-inkSoft">Part of the day only:</p>
                  <div>
                    <label className="block text-xs font-medium text-inkSoft mb-1">From</label>
                    <select
                      required={!blockForm.wholeDays}
                      className="input-magical"
                      value={blockForm.partyTime}
                      onChange={(e) => setBlockForm((f) => ({ ...f, partyTime: e.target.value }))}
                    >
                      <option value="">Select start</option>
                      {PARTY_START_TIMES.map((t) => (
                        <option key={t.value} value={t.value}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-inkSoft mb-1">
                      To <span className="font-normal">(optional — one slot if empty)</span>
                    </label>
                    <select
                      className="input-magical"
                      value={blockForm.partyEndTime}
                      onChange={(e) => setBlockForm((f) => ({ ...f, partyEndTime: e.target.value }))}
                    >
                      <option value="">Same as “From”</option>
                      {PARTY_START_TIMES.map((t) => (
                        <option key={t.value} value={t.value}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-inkSoft mb-1">Note (optional)</label>
                <input
                  className="input-magical"
                  placeholder="e.g. Summer break"
                  value={blockForm.notes}
                  onChange={(e) => setBlockForm((f) => ({ ...f, notes: e.target.value }))}
                />
              </div>
              <button type="submit" className="btn-secondary w-full sm:w-auto">
                Save block
              </button>
            </form>

            <div className="card-magical p-6 overflow-x-auto">
              <h3 className="font-display text-lg mb-3">Current blocks</h3>
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-pinkSoft text-inkSoft text-left">
                    <th className="py-2 pr-2">When</th>
                    <th className="py-2 pr-2">What’s blocked</th>
                    <th className="py-2 pr-2">Note</th>
                    <th className="py-2 pr-2" />
                  </tr>
                </thead>
                <tbody>
                  {(blocks ?? []).map((bl) => (
                    <tr key={bl.id} className="border-b border-pinkSoft/50">
                      <td className="py-2 pr-2 whitespace-nowrap align-top">{formatBlockWhen(bl)}</td>
                      <td className="py-2 pr-2 align-top text-ink">{formatBlockCoverage(bl)}</td>
                      <td className="py-2 pr-2 text-inkSoft text-xs max-w-[12rem] align-top">
                        {bl.notes ?? "—"}
                      </td>
                      <td className="py-2 pr-2 align-top">
                        <button
                          type="button"
                          className="text-xs text-pinkDeep underline"
                          onClick={() => void deleteBlock(bl.id)}
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {blocks && blocks.length === 0 && (
                <p className="text-inkSoft text-sm py-4">No manual blocks.</p>
              )}
            </div>
          </div>
        </div>

        <div className="container-px max-w-6xl mx-auto">
          <h2 className="heading-display text-xl mb-4">Add manual booking</h2>
          <form
            onSubmit={submitManual}
            className="card-magical p-6 sm:p-8 space-y-4 max-w-3xl"
            noValidate
          >
            {manualMsg && (
              <p className="text-sm text-pinkDeep" role="status">
                {manualMsg}
              </p>
            )}
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-ink mb-2">Parent name</label>
                <input
                  className="input-magical"
                  value={manual.parentName}
                  onChange={(e) => setManual((m) => ({ ...m, parentName: e.target.value }))}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink mb-2">Email</label>
                <input
                  type="email"
                  className="input-magical"
                  value={manual.email}
                  onChange={(e) => setManual((m) => ({ ...m, email: e.target.value }))}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink mb-2">Phone</label>
                <input
                  className="input-magical"
                  value={manual.phone}
                  onChange={(e) => setManual((m) => ({ ...m, phone: e.target.value }))}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink mb-2">Child name</label>
                <input
                  className="input-magical"
                  value={manual.childName}
                  onChange={(e) => setManual((m) => ({ ...m, childName: e.target.value }))}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink mb-2">Child age</label>
                <input
                  className="input-magical"
                  value={manual.childAge}
                  onChange={(e) => setManual((m) => ({ ...m, childAge: e.target.value }))}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink mb-2">Party date</label>
                <input
                  type="date"
                  className="input-magical"
                  value={manual.partyDate}
                  onChange={(e) => setManual((m) => ({ ...m, partyDate: e.target.value }))}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink mb-2">Start time</label>
                <select
                  className="input-magical"
                  value={manual.partyTime}
                  onChange={(e) => setManual((m) => ({ ...m, partyTime: e.target.value }))}
                  required
                >
                  <option value="">Select time</option>
                  {PARTY_START_TIMES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-ink mb-2">Princess</label>
                <select
                  className="input-magical"
                  value={manual.character}
                  onChange={(e) => setManual((m) => ({ ...m, character: e.target.value }))}
                  required
                >
                  <option value="">Choose</option>
                  {characterOptions.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-ink mb-2">Package</label>
                <select
                  className="input-magical"
                  value={manual.packageSlug}
                  onChange={(e) => setManual((m) => ({ ...m, packageSlug: e.target.value }))}
                  required
                >
                  {PACKAGES.map((p) => (
                    <option key={p.slug} value={p.slug}>
                      {p.name} — £{p.price}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-ink mb-2">Address</label>
              <input
                className="input-magical"
                value={manual.address}
                onChange={(e) => setManual((m) => ({ ...m, address: e.target.value }))}
                required
              />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-ink mb-2"># children (optional)</label>
                <input
                  className="input-magical"
                  value={manual.numChildren}
                  onChange={(e) => setManual((m) => ({ ...m, numChildren: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink mb-2">Admin notes</label>
                <input
                  className="input-magical"
                  placeholder="e.g. Booked via Instagram"
                  value={manual.adminNotes}
                  onChange={(e) => setManual((m) => ({ ...m, adminNotes: e.target.value }))}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-ink mb-2">Special requests (optional)</label>
              <textarea
                className="input-magical resize-none"
                rows={3}
                value={manual.specialRequests}
                onChange={(e) => setManual((m) => ({ ...m, specialRequests: e.target.value }))}
              />
            </div>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? "Saving…" : "Save manual booking"}
            </button>
          </form>
        </div>
      </section>
    </>
  );
}
