import { useState, useEffect, lazy, Suspense } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useLanguage } from "../hooks/useLanguage";

const SearchOverlay = lazy(() => import("./SearchOverlay"));

export default function Header() {
  const { user, signOut } = useAuth();
  const { lang, setLang, t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const isHome = location.pathname === "/" && location.hash !== "#about";
  const isAbout = location.hash === "#about";
  const [theme, setTheme] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("govguide-theme") || "auto";
    }
    return "auto";
  });
  const [osDark, setOsDark] = useState(() =>
    typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches
  );

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e) => setOsDark(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const isDark = theme === "dark" || (theme === "auto" && osDark);

  useEffect(() => {
    function handleKey(e) {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
      if (e.key === "Escape") setMenuOpen(false);
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.setAttribute("data-theme", "dark");
    } else if (theme === "light") {
      root.setAttribute("data-theme", "light");
    } else {
      root.removeAttribute("data-theme");
    }
    localStorage.setItem("govguide-theme", theme);
  }, [theme]);

  function cycleTheme() {
    setTheme(isDark ? "light" : "dark");
  }

  return (
    <header className="site-header">
      <div className="shell header-inner">
        <Link className="brand" to="/" aria-label="Government Guide Companion home">
          <span className="brand-mark" aria-hidden="true">GG</span>
          <span>
            <span className="brand-name">Government Guide</span>
            <span className="brand-subtitle">Companion</span>
          </span>
        </Link>

        <button
          className={`nav-toggle ${menuOpen ? "is-active" : ""}`}
          type="button"
          aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((o) => !o)}
        >
          <span className="nav-toggle-icon" aria-hidden="true">
            <span></span><span></span><span></span>
          </span>
        </button>

        <nav className={menuOpen ? "is-open" : ""} aria-label="Primary navigation">
          <Link to="/#services-section" className={isHome ? "is-active" : ""} aria-current={isHome ? "page" : undefined} onClick={() => { setMenuOpen(false); if (location.pathname === "/") { document.getElementById("services-section")?.scrollIntoView({ behavior: "smooth" }); } }}>{t("services")}</Link>
          <Link to="/#about" className={isAbout ? "is-active" : ""} aria-current={isAbout ? "page" : undefined} onClick={() => { setMenuOpen(false); if (location.pathname === "/") { document.getElementById("about")?.scrollIntoView({ behavior: "smooth" }); } }}>{t("about")}</Link>
          <button
            className="nav-search-btn"
            type="button"
            aria-label={t("search_services")}
            onClick={() => { setSearchOpen(true); setMenuOpen(false); }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <span className="nav-link-label">{t("search_services")}</span>
            <kbd className="nav-search-kbd">Ctrl K</kbd>
          </button>
          <hr className="nav-divider" aria-hidden="true" />
          <div className="lang-toggle" role="group" aria-label="Language">
            <button type="button" className={lang === "en" ? "is-active" : ""} onClick={() => setLang("en")}>EN</button>
            <button type="button" className={lang === "hi" ? "is-active" : ""} onClick={() => setLang("hi")}>हि</button>
          </div>
          {user ? (
            <Link
              to="/profile"
              className="nav-avatar"
              aria-label={`${user} — ${t("profile")}`}
              onClick={() => setMenuOpen(false)}
            >
              <span className="nav-avatar-letter" aria-hidden="true">{user.charAt(0).toUpperCase()}</span>
              <span className="nav-link-label">{t("profile")}</span>
            </Link>
          ) : (
            <button
              className="nav-action"
              type="button"
              onClick={() => { navigate("/auth"); setMenuOpen(false); }}
            >
              {t("sign_in")}
            </button>
          )}
          <button
            className="theme-toggle"
            type="button"
            aria-label={t("toggle_theme")}
            onClick={cycleTheme}
          >
            {isDark ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="5" />
                <line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
              </svg>
            )}
            <span className="nav-link-label">{isDark ? t("dark_mode") : t("light_mode")}</span>
          </button>
        </nav>
      </div>
      <Suspense fallback={null}>
        <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
      </Suspense>
    </header>
  );
}
