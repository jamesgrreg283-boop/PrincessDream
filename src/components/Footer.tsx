import { Link } from "react-router-dom";
import { SITE } from "../data/site";
import { AREAS } from "../data/areas";
import { CrownIcon } from "./CrownIcon";

export default function Footer() {
  return (
    <footer className="relative mt-24 bg-gradient-to-b from-pinkSoft to-white border-t border-pinkSoft">
      <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-pinkDeep/45 to-transparent" />
      <div className="container-px max-w-7xl mx-auto py-14 grid gap-10 md:grid-cols-4">
        <div>
          <div className="flex items-center gap-3 mb-3">
            <CrownIcon className="w-9 h-9" />
            <div className="font-display text-2xl">
              <span className="accent-text">Princess</span>Dream
            </div>
          </div>
          <p className="text-inkSoft text-sm leading-relaxed">
            Magical princess parties for unforgettable birthdays across Coventry,
            Warwickshire and the West Midlands.
          </p>
          <div className="flex gap-3 mt-5">
            <a
              href={SITE.social.facebook}
              aria-label="Facebook"
              className="w-10 h-10 grid place-items-center rounded-full bg-white shadow-soft text-pinkDeep hover:bg-pinkSoft transition-colors"
            >
              {/* TODO: replace # with real social URL */}
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M13 22v-8h3l1-4h-4V7.5C13 6.5 13.3 6 14.7 6H17V2.2C16.6 2.1 15.4 2 14 2c-3 0-5 1.8-5 5v3H6v4h3v8h4z" />
              </svg>
            </a>
            <a
              href={SITE.social.instagram}
              aria-label="Instagram"
              className="w-10 h-10 grid place-items-center rounded-full bg-white shadow-soft text-pinkDeep hover:bg-pinkSoft transition-colors"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <rect x="3" y="3" width="18" height="18" rx="5" />
                <circle cx="12" cy="12" r="4" />
                <circle cx="17.5" cy="6.5" r="1" fill="currentColor" />
              </svg>
            </a>
            <a
              href={SITE.social.tiktok}
              aria-label="TikTok"
              className="w-10 h-10 grid place-items-center rounded-full bg-white shadow-soft text-pinkDeep hover:bg-pinkSoft transition-colors"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M16.5 2a5.5 5.5 0 0 0 4.5 4.5v3A8.4 8.4 0 0 1 16.5 8v7a6 6 0 1 1-6-6v3.1a2.9 2.9 0 1 0 2.9 2.9V2h3.1z" />
              </svg>
            </a>
          </div>
        </div>

        <div>
          <h4 className="font-display text-lg mb-3 text-ink">Explore</h4>
          <ul className="space-y-2 text-sm">
            {[
              ["Home", "/"],
              ["Packages", "/packages"],
              ["Characters", "/characters"],
              ["Gallery", "/gallery"],
              ["Reviews", "/reviews"],
              ["FAQ", "/faq"],
              ["Book Now", "/book"],
            ].map(([label, to]) => (
              <li key={to}>
                <Link className="text-inkSoft hover:text-pinkDeep transition-colors" to={to}>
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="font-display text-lg mb-3 text-ink">Areas We Cover</h4>
          <ul className="space-y-2 text-sm">
            {AREAS.map((a) => (
              <li key={a.slug}>
                <Link
                  className="text-inkSoft hover:text-pinkDeep transition-colors"
                  to={`/areas/${a.slug}`}
                >
                  Princess Parties {a.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="font-display text-lg mb-3 text-ink">Contact</h4>
          <ul className="space-y-2 text-sm text-inkSoft">
            <li>
              <a
                href={`tel:${SITE.phoneTel}`}
                className="hover:text-pinkDeep transition-colors"
              >
                {SITE.phone}
              </a>
            </li>
            <li>
              <a
                href={`mailto:${SITE.email}`}
                className="hover:text-pinkDeep transition-colors break-all"
              >
                {SITE.email}
              </a>
            </li>
            <li>Coventry, West Midlands</li>
          </ul>
          <Link
            to="/book"
            className="btn-primary mt-5 text-sm py-3 px-5 inline-flex"
          >
            Book Your Party
          </Link>
        </div>
      </div>

      <div className="container-px max-w-7xl mx-auto pb-10 -mt-2 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-inkSoft">
        <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-3">
          <span>
            © {SITE.copyrightYear} {SITE.name}. All rights reserved.
          </span>
          <span className="hidden sm:inline text-inkSoft/50" aria-hidden>
            ·
          </span>
          <a
            href="https://www.myfreeweb.co.uk/"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-pinkDeep transition-colors"
          >
            Website by MyFreeWeb
          </a>
        </div>
        <div className="flex gap-5">
          <Link to="/privacy" className="hover:text-pinkDeep">
            Privacy Policy
          </Link>
          <Link to="/terms" className="hover:text-pinkDeep">
            Terms & Conditions
          </Link>
        </div>
      </div>
    </footer>
  );
}
