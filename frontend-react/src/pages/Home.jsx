import { useState, useEffect, useMemo, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { fetchServices } from "../api/services";
import ServiceCard from "../components/ServiceCard";
import CategoryFilter, { extractCategories, getDisplayCategory } from "../components/CategoryFilter";
import { SkeletonGrid } from "../components/LoadingSpinner";
import { codeToName } from "../utils/serviceNames";
import { useLanguage } from "../hooks/useLanguage";
import { getServiceNameHi } from "../i18n/serviceNames";

export default function Home() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const servicesRef = useRef(null);
  const location = useLocation();
  const { lang, t } = useLanguage();

  useEffect(() => {
    loadServices();
  }, []);

  useEffect(() => {
    if (location.hash === "#about") {
      const el = document.getElementById("about");
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    } else if (location.hash === "#services-section") {
      const el = document.getElementById("services-section");
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [location.hash]);

  async function loadServices() {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchServices();
      setServices(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  const categories = useMemo(() => extractCategories(services), [services]);

  const [visibleCount, setVisibleCount] = useState(12);
  const PAGE_SIZE = 12;

  const POPULAR_SERVICES = [
    "AADHAAR_NEW_ENROLLMENT", "PAN_INSTANT_EPAN", "PASSPORT_FRESH_ORDINARY",
    "VOTER_ID_NEW_REGISTRATION", "DRIVING_LICENSE_FRESH", "RATION_CARD_NEW_APPLICATION",
    "BIRTH_CERTIFICATE_REGISTRATION", "INCOME_TAX_RETURN_FILING", "GST_REGISTRATION",
    "MARRIAGE_CERTIFICATE_REGISTRATION", "CASTE_CERTIFICATE", "INCOME_CERTIFICATE",
    "DOMICILE_CERTIFICATE", "AADHAAR_UPDATE", "DIGILOCKER_ACCOUNT",
    "E_SHRAM_CARD", "PM_KISAN_REGISTRATION", "AYUSHMAN_BHARAT_PMJAY",
    "MSME_UDYAM_REGISTRATION", "DRIVING_LICENSE_RENEWAL",
  ];

  const sorted = useMemo(() => {
    return [...services].sort((a, b) => {
      const ai = POPULAR_SERVICES.indexOf(a.serviceCode);
      const bi = POPULAR_SERVICES.indexOf(b.serviceCode);
      if (ai !== -1 && bi !== -1) return ai - bi;
      if (ai !== -1) return -1;
      if (bi !== -1) return 1;
      return (a.name || codeToName(a.serviceCode)).localeCompare(b.name || codeToName(b.serviceCode));
    });
  }, [services]);

  const filtered = useMemo(() => {
    let list = sorted;
    if (activeCategory !== "All") {
      list = list.filter((s) => getDisplayCategory(s.category) === activeCategory);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((s) => {
        const enName = (s.name || codeToName(s.serviceCode)).toLowerCase();
        if (enName.includes(q)) return true;
        if (lang === "hi") {
          const hiName = getServiceNameHi(s.serviceCode);
          if (hiName && hiName.toLowerCase().includes(q)) return true;
        }
        return false;
      });
    }
    return list;
  }, [sorted, activeCategory, search, lang]);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [activeCategory, search]);

  useEffect(() => {
    document.title = "Government Guide Companion — Indian Government Services";
  }, []);

  return (
    <>
      {loading && <div className="loading-bar" aria-hidden="true" />}
      <section className="hero" aria-labelledby="page-title">
        <div className="shell hero-grid">
          <div className="hero-copy">
            <p className="section-label">{t("hero_label")}</p>
            <h1 id="page-title">{t("hero_title")}</h1>
            <p className="hero-lede">
              {t("hero_lede_prefix")} {services.length || "120"}+ {t("hero_lede_suffix")}
            </p>
            <div className="hero-stats">
              <div className="hero-stat">
                <span className="hero-stat-number">{services.length || "137"}</span>
                <span className="hero-stat-label">{t("hero_stat_services")}</span>
              </div>
              <div className="hero-stat">
                <span className="hero-stat-number">12</span>
                <span className="hero-stat-label">{t("hero_stat_categories")}</span>
              </div>
              <div className="hero-stat">
                <span className="hero-stat-number">100%</span>
                <span className="hero-stat-label">{t("hero_stat_verified")}</span>
              </div>
            </div>
            <Link className="button button-primary" to="/#services-section"
              onClick={(e) => {
                e.preventDefault();
                const el = document.getElementById("services-section");
                if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
            >
              {t("explore_services")} <span aria-hidden="true">&#8595;</span>
            </Link>
          </div>
          <div className="hero-visual" aria-hidden="true">
            <div className="hero-card hero-card--1">
              <div className="hero-card-icon hero-card-icon--check">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              </div>
              <div className="hero-card-text">
                <span className="hero-card-title">{t("hero_identity")}</span>
                <span className="hero-card-status hero-card-status--done">{t("hero_verified")}</span>
              </div>
            </div>
            <div className="hero-card hero-card--2">
              <div className="hero-card-icon hero-card-icon--check">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              </div>
              <div className="hero-card-text">
                <span className="hero-card-title">{t("hero_address")}</span>
                <span className="hero-card-status hero-card-status--done">{t("hero_verified")}</span>
              </div>
            </div>
            <div className="hero-card hero-card--3">
              <div className="hero-card-icon hero-card-icon--pending">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              </div>
              <div className="hero-card-text">
                <span className="hero-card-title">{t("hero_photo")}</span>
                <span className="hero-card-status hero-card-status--pending">{t("hero_pending")}</span>
              </div>
            </div>
            <div className="hero-card hero-card--4">
              <div className="hero-card-icon hero-card-icon--info">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
              </div>
              <div className="hero-card-text">
                <span className="hero-card-title">{t("hero_fee")}</span>
                <span className="hero-card-status hero-card-status--info">{t("hero_official")}</span>
              </div>
            </div>
            <aside className="hero-note">
              <span className="note-icon">i</span>
              <div>
                <strong>{t("independent_guide")}</strong>
                <p>{t("not_official")}</p>
              </div>
            </aside>
          </div>
        </div>
      </section>

      <section id="services-section" className="services-section" ref={servicesRef} aria-labelledby="services-title">
        <div className="shell">
          <div className="section-heading">
            <div>
              <p className="section-label">{t("start_here")}</p>
              <h2 id="services-title">{t("choose_service")}</h2>
            </div>
            <p className="section-intro">
              {t("services_intro")}
            </p>
          </div>

          <section className="catalogue-panel" aria-labelledby="catalogue-title">
            <div className="catalogue-heading">
              <div>
                <p className="section-label">{t("service_catalogue")}</p>
                <h3 id="catalogue-title">{t("find_starting_point")}</h3>
                <span className="services-count" aria-live="polite">
                  {!loading && `${filtered.length} ${t("services_available")}`}
                </span>
              </div>
              <label className="search-control" htmlFor="service-search">
                <span>{t("search_services")}</span>
                <input
                  id="service-search"
                  type="search"
                  placeholder={t("search_placeholder")}
                  autoComplete="off"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </label>
            </div>

            {!loading && categories.length > 1 && (
              <CategoryFilter categories={categories} active={activeCategory} onChange={setActiveCategory} />
            )}

            {loading && <SkeletonGrid count={6} />}

            {error && (
              <div className="state-panel state-error" role="alert">
                <strong>{t("error_load_title")}</strong>
                <p>{t("error_load_msg")}</p>
                <button className="button button-secondary" type="button" onClick={loadServices}>
                  {t("try_again")}
                </button>
              </div>
            )}

            {!loading && !error && filtered.length === 0 && (
              <div className="state-panel">
                <strong>{t("no_matching")}</strong>
                <p>{t("no_matching_hint")}</p>
              </div>
            )}

            {!loading && !error && filtered.length > 0 && (
              <>
                <div className="catalogue-list" aria-live="polite">
                  {filtered.slice(0, visibleCount).map((s) => (
                    <ServiceCard key={s.serviceCode} service={s} />
                  ))}
                </div>
                {visibleCount < filtered.length && (
                  <div className="load-more">
                    <button
                      className="button button-secondary"
                      type="button"
                      onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
                    >
                      {t("show_more")} ({filtered.length - visibleCount} {t("remaining")})
                    </button>
                  </div>
                )}
              </>
            )}
          </section>
        </div>
      </section>

      <section id="about" className="about-section" aria-labelledby="about-title">
        <div className="shell about-grid">
          <div>
            <p className="section-label">{t("how_to_use")}</p>
            <h2 id="about-title">{t("clarity_before")}</h2>
            <div className="about-features">
              <div className="about-feature">
                <div className="about-feature-icon">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
                </div>
                <div>
                  <strong>{t("about_verified")}</strong>
                  <p>{t("about_verified_desc")}</p>
                </div>
              </div>
              <div className="about-feature">
                <div className="about-feature-icon">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                </div>
                <div>
                  <strong>{t("about_privacy")}</strong>
                  <p>{t("about_privacy_desc")}</p>
                </div>
              </div>
              <div className="about-feature">
                <div className="about-feature-icon">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                </div>
                <div>
                  <strong>{t("about_transparent")}</strong>
                  <p>{t("about_transparent_desc")}</p>
                </div>
              </div>
            </div>
          </div>
          <div className="about-copy">
            <p>{t("about_p1")}</p>
            <p>{t("about_p2")}</p>
            <p>{t("about_p3")}</p>
          </div>
        </div>
      </section>
    </>
  );
}
