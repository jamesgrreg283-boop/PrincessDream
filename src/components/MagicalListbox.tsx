import {
  Listbox,
  ListboxButton,
  ListboxOption,
  ListboxOptions,
} from "@headlessui/react";
import { HiChevronDown } from "react-icons/hi2";

export type MagicalListOption = { value: string; label: string; disabled?: boolean };

type MagicalListboxProps = {
  id: string;
  value: string;
  onChange: (next: string) => void;
  options: MagicalListOption[];
  placeholder: string;
  invalid?: boolean;
  disabled?: boolean;
};

export default function MagicalListbox({
  id,
  value,
  onChange,
  options,
  placeholder,
  invalid,
  disabled,
}: MagicalListboxProps) {
  const selected = options.find((o) => o.value === value);
  const display = selected?.label ?? placeholder;
  const muted = !value;

  return (
    <Listbox value={value} onChange={onChange} invalid={!!invalid} disabled={disabled}>
      <div className="relative">
        <ListboxButton
          id={id}
          type="button"
          className="input-magical input-magical-enhanced w-full min-h-[3.25rem] min-w-0 px-4 py-3.5 text-left flex items-center justify-between gap-2 touch-manipulation"
        >
          <span className={`truncate ${muted ? "text-inkSoft" : "text-ink"}`}>{display}</span>
          <HiChevronDown
            className="shrink-0 w-5 h-5 text-pinkDeep opacity-90"
            aria-hidden
          />
        </ListboxButton>
        <ListboxOptions
          transition
          modal={false}
          portal
          anchor="bottom start"
          className="apd-scroll-thin z-[200] mt-1.5 w-[var(--button-width)] min-w-[min(100vw-2.5rem,var(--button-width))] max-h-[min(70dvh,18rem)] sm:max-h-60 overflow-auto rounded-xl border border-pinkBlush/90 bg-white py-1.5 shadow-magical outline-none
            transition duration-150 ease-out
            data-[closed]:opacity-0 data-[closed]:-translate-y-0.5"
        >
          {options.map((opt) => (
            <ListboxOption
              key={opt.value === "" ? "__empty__" : opt.value}
              value={opt.value}
              disabled={opt.disabled}
              className="cursor-pointer select-none px-4 py-3 sm:py-2.5 text-sm text-ink touch-manipulation data-[disabled]:cursor-not-allowed data-[disabled]:pointer-events-none data-[disabled]:bg-stone-100/90 data-[disabled]:text-inkSoft/70 data-[disabled]:opacity-95
                data-[focus]:bg-pinkSoft data-[focus]:text-ink data-[disabled]:data-[focus]:bg-stone-100/90 data-[disabled]:data-[focus]:text-inkSoft/70
                data-[selected]:font-semibold data-[selected]:text-pinkDeep data-[disabled]:data-[selected]:font-normal data-[disabled]:data-[selected]:text-inkSoft/70"
            >
              {opt.label}
            </ListboxOption>
          ))}
        </ListboxOptions>
      </div>
    </Listbox>
  );
}
