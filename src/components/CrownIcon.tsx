import { useId } from "react";

type IconProps = { className?: string; title?: string };

export function CrownIcon({ className = "w-6 h-6", title }: IconProps) {
  const uid = useId().replace(/:/g, "");
  const gradId = `crown-grad-${uid}`;
  return (
    <svg
      className={className}
      viewBox="0 0 64 64"
      role={title ? "img" : "presentation"}
      aria-label={title}
    >
      <defs>
        <linearGradient id={gradId} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#fce7f3" />
          <stop offset="0.5" stopColor="#f472b6" />
          <stop offset="1" stopColor="#9d174d" />
        </linearGradient>
      </defs>
      <path
        fill={`url(#${gradId})`}
        stroke="#831843"
        strokeWidth="1.5"
        strokeLinejoin="round"
        d="M6 22l10 10 8-18 8 14 8-14 8 18 10-10-4 28H10L6 22z"
      />
      <circle cx="32" cy="14" r="3" fill="#fff7fb" stroke="#831843" strokeWidth="1" />
      <circle cx="10" cy="22" r="2.5" fill="#fff7fb" stroke="#831843" strokeWidth="1" />
      <circle cx="54" cy="22" r="2.5" fill="#fff7fb" stroke="#831843" strokeWidth="1" />
    </svg>
  );
}

export function WandIcon({ className = "w-6 h-6", title }: IconProps) {
  const uid = useId().replace(/:/g, "");
  const gradId = `wand-grad-${uid}`;
  return (
    <svg
      className={className}
      viewBox="0 0 64 64"
      role={title ? "img" : "presentation"}
      aria-label={title}
    >
      <defs>
        <linearGradient id={gradId} x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="#fbcfe8" />
          <stop offset="0.55" stopColor="#ec4899" />
          <stop offset="1" stopColor="#831843" />
        </linearGradient>
      </defs>
      <path
        d="M14 50L40 24"
        stroke={`url(#${gradId})`}
        strokeWidth="4"
        strokeLinecap="round"
      />
      <path
        d="M46 8l2 6 6 2-6 2-2 6-2-6-6-2 6-2z"
        fill={`url(#${gradId})`}
        stroke="#831843"
        strokeWidth="1"
        strokeLinejoin="round"
      />
      <circle cx="14" cy="50" r="3" fill="#fff7fb" stroke="#D81B60" strokeWidth="1" />
    </svg>
  );
}

export function StarIcon({ className = "w-5 h-5" }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 2l2.9 6.9L22 10l-5.5 4.8L18.2 22 12 18.3 5.8 22l1.7-7.2L2 10l7.1-1.1L12 2z" />
    </svg>
  );
}
