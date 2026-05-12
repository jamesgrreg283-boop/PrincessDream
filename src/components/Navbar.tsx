import { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { CrownIcon } from "./CrownIcon";

const NAV_LINKS = [
  { to: "/", label: "Home" },
  { to: "/packages", label: "Packages" },
  { to: "/characters", label: "Characters" },
  { to: "/gallery", label: "Gallery" },
  { to: "/reviews", label: "Reviews" },
  { to: "/faq", label: "FAQ" },
  { to: "/areas", label: "Areas" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const id = requestAnimationFrame(() => setOpen(false));
    return () => cancelAnimationFrame(id);
  }, [location.pathname]);

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white/85 backdrop-blur-md shadow-soft"
          : "bg-white/60 backdrop-blur-sm"
      }`}
    >
      <nav
        className="container-px max-w-7xl mx-auto flex items-center justify-between py-3"
        aria-label="Main navigation"
      >
        <Link to="/" className="flex items-center gap-3 group" aria-label="PrincessDream — Home">
          <CrownIcon className="w-9 h-9 drop-shadow-sm group-hover:scale-110 transition-transform" />
          <div className="leading-tight">
            <div className="font-display text-xl sm:text-2xl text-ink">
              <span className="accent-text">Princess</span>Dream
            </div>
            <div className="text-[10px] sm:text-[11px] font-cinzel tracking-[0.25em] text-pinkDeep uppercase">
              Magical Parties
            </div>
          </div>
        </Link>

        {/* Desktop nav */}
        <ul className="hidden lg:flex items-center gap-1">
          {NAV_LINKS.map((l) => (
            <li key={l.to}>
              <NavLink
                to={l.to}
                end={l.to === "/"}
                className={({ isActive }) =>
                  `px-3.5 py-2 rounded-full text-sm font-medium transition-colors duration-200
                  ${isActive ? "text-pinkDeep bg-pinkSoft/70" : "text-ink/80 hover:text-pinkDeep hover:bg-pinkSoft/40"}`
                }
              >
                {l.label}
              </NavLink>
            </li>
          ))}
        </ul>

        <div className="hidden lg:block">
          <Link to="/book" className="btn-primary text-sm py-3 px-6">
            Book Now
          </Link>
        </div>

        {/* Mobile menu button */}
        <button
          className="lg:hidden p-2 rounded-full hover:bg-pinkSoft/60 transition-colors"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
          aria-expanded={open}
        >
          <div className="w-6 h-5 relative">
            <span
              className={`absolute left-0 top-0 h-0.5 w-6 bg-ink transition-all ${
                open ? "rotate-45 translate-y-2" : ""
              }`}
            />
            <span
              className={`absolute left-0 top-2 h-0.5 w-6 bg-ink transition-all ${
                open ? "opacity-0" : ""
              }`}
            />
            <span
              className={`absolute left-0 top-4 h-0.5 w-6 bg-ink transition-all ${
                open ? "-rotate-45 -translate-y-2" : ""
              }`}
            />
          </div>
        </button>
      </nav>

      {/* Mobile dropdown */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="lg:hidden overflow-hidden bg-white/95 backdrop-blur-md border-t border-pinkSoft"
          >
            <ul className="container-px max-w-7xl mx-auto py-3 flex flex-col">
              {NAV_LINKS.map((l) => (
                <li key={l.to}>
                  <NavLink
                    to={l.to}
                    end={l.to === "/"}
                    className={({ isActive }) =>
                      `block py-3 px-3 rounded-xl text-base font-medium
                      ${isActive ? "text-pinkDeep bg-pinkSoft/70" : "text-ink/80 hover:bg-pinkSoft/40"}`
                    }
                  >
                    {l.label}
                  </NavLink>
                </li>
              ))}
              <li className="pt-2 pb-1">
                <Link to="/book" className="btn-primary w-full justify-center">
                  Book Now
                </Link>
              </li>
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
