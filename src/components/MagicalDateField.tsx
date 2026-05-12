import { useMemo } from "react";
import { Popover, PopoverButton, PopoverPanel } from "@headlessui/react";
import { DayPicker } from "react-day-picker";
import { HiOutlineCalendar } from "react-icons/hi2";

function parseISODateLocal(iso: string): Date | undefined {
  if (!iso) return undefined;
  const parts = iso.split("-").map(Number);
  const y = parts[0];
  const m = parts[1];
  const d = parts[2];
  if (!y || !m || !d) return undefined;
  return new Date(y, m - 1, d);
}

function toISODateLocal(date: Date): string {
  const y = date.getFullYear();
  const mo = String(date.getMonth() + 1).padStart(2, "0");
  const da = String(date.getDate()).padStart(2, "0");
  return `${y}-${mo}-${da}`;
}

function startOfLocalDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

type MagicalDateFieldProps = {
  id: string;
  value: string;
  min: string;
  onChange: (iso: string) => void;
  invalid?: boolean;
};

export default function MagicalDateField({
  id,
  value,
  min,
  onChange,
  invalid,
}: MagicalDateFieldProps) {
  const minDate = useMemo(() => {
    const parsed = parseISODateLocal(min);
    return startOfLocalDay(parsed ?? new Date());
  }, [min]);

  const selected = useMemo(() => parseISODateLocal(value), [value]);

  const label = selected
    ? selected.toLocaleDateString("en-GB", {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "Choose party date";

  return (
    <Popover className="relative">
      {({ close }) => (
        <>
          <PopoverButton
            id={id}
            type="button"
            aria-invalid={invalid || undefined}
            className="input-magical input-magical-enhanced w-full min-h-[3.25rem] px-4 py-3.5 text-left flex items-center justify-between gap-2"
          >
            <span className={selected ? "text-ink" : "text-inkSoft"}>{label}</span>
            <HiOutlineCalendar className="shrink-0 w-5 h-5 text-pinkDeep opacity-90" aria-hidden />
          </PopoverButton>
          <PopoverPanel
            transition
            portal
            modal={false}
            anchor="bottom start"
            className="z-[200] mt-1.5 rounded-2xl border border-pinkBlush/90 bg-white p-3 shadow-magical outline-none
              transition duration-150 ease-out
              data-[closed]:opacity-0 data-[closed]:-translate-y-0.5"
          >
            <DayPicker
              mode="single"
              className="apd-rdp"
              selected={selected}
              onSelect={(d) => {
                if (d) onChange(toISODateLocal(d));
                close();
              }}
              disabled={{ before: minDate }}
              showOutsideDays
              fixedWeeks
            />
          </PopoverPanel>
        </>
      )}
    </Popover>
  );
}
