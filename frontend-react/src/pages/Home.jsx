import { useState, useEffect, useMemo, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { fetchServices } from "../api/services";
import ServiceCard from "../components/ServiceCard";
import CategoryFilter, { extractCategories, getDisplayCategory } from "../components/CategoryFilter";
import { SkeletonGrid } from "../components/LoadingSpinner";

const KEEP_UPPER = new Set([
  "RTI", "GST", "PAN", "ITR", "EPF", "ESI", "GEM", "NGO", "PMKVY",
  "MSME", "FSSAI", "LLP", "NRI", "NEET", "JEE", "UDYAM",
]);
const TITLE_LOWER = new Set(["of", "and", "the", "for", "in", "to", "at", "by", "an", "a", "or"]);
const CODE_OVERRIDES = {
  NGO_SECTION8: "NGO (Section 8) Registration",
  UDYAM_ASSIST: "Udyam Assist Registration",
  NON_CREAMY_LAYER: "Non-Creamy Layer Certificate",
};
function codeToName(code) {
  if (CODE_OVERRIDES[code]) return CODE_OVERRIDES[code];
  return (code || "").replace(/_/g, " ").split(" ")
    .map((w, i) => {
      if (KEEP_UPPER.has(w.toUpperCase())) return w.toUpperCase();
      const lower = w.toLowerCase();
      if (i > 0 && TITLE_LOWER.has(lower)) return lower;
      return lower.replace(/^\w/, c => c.toUpperCase());
    })
    .join(" ");
}

export default function Home() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const servicesRef = useRef(null);
  const location = useLocation();

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
        const displayName = s.name || codeToName(s.serviceCode);
        return displayName.toLowerCase().includes(q);
      });
    }
    return list;
  }, [sorted, activeCategory, search]);

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
            <p className="eyebrow">Your guide to Indian government services</p>
            <h1 id="page-title">Know exactly what you need before you apply.</h1>
            <p className="hero-lede">
              Requirements, fees, processing times, and official sources for {services.length || "120"}+ government
              services — from Aadhaar to GST registration. Every claim traced to its official source.
            </p>
            <div className="hero-stats">
              <div className="hero-stat">
                <span className="hero-stat-number">{services.length || "137"}</span>
                <span className="hero-stat-label">Services</span>
              </div>
              <div className="hero-stat">
                <span className="hero-stat-number">12</span>
                <span className="hero-stat-label">Categories</span>
              </div>
              <div className="hero-stat">
                <span className="hero-stat-number">100%</span>
                <span className="hero-stat-label">Source-verified</span>
              </div>
            </div>
            <Link className="button button-primary" to="/#services-section"
              onClick={(e) => {
                e.preventDefault();
                const el = document.getElementById("services-section");
                if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
            >
              Explore services <span aria-hidden="true">&#8595;</span>
            </Link>
          </div>
          <aside className="hero-note" aria-label="Independent service notice">
            <span className="note-icon" aria-hidden="true">i</span>
            <div>
              <strong>Independent guide</strong>
              <p>This is an informational companion, not an official government portal. Applications must be completed through official channels.</p>
            </div>
          </aside>
        </div>
      </section>

      <section id="services-section" className="services-section" ref={servicesRef} aria-labelledby="services-title">
        <div className="shell">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Start here</p>
              <h2 id="services-title">Choose a service</h2>
            </div>
            <p className="section-intro">
              Browse the services currently covered by this independent guide. New services appear only after their evidence has been reviewed.
            </p>
          </div>

          <section className="catalogue-panel" aria-labelledby="catalogue-title">
            <div className="catalogue-heading">
              <div>
                <p className="eyebrow">Service catalogue</p>
                <h3 id="catalogue-title">Find the right starting point</h3>
                <span className="services-count" aria-live="polite">
                  {!loading && `${filtered.length} services available`}
                </span>
              </div>
              <label className="search-control" htmlFor="service-search">
                <span>Search services</span>
                <input
                  id="service-search"
                  type="search"
                  placeholder="Search by service name"
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
                <strong>We couldn't load the services right now.</strong>
                <p>Check your connection and try again.</p>
                <button className="button button-secondary" type="button" onClick={loadServices}>
                  Try again
                </button>
              </div>
            )}

            {!loading && !error && filtered.length === 0 && (
              <div className="state-panel">
                <strong>No matching services.</strong>
                <p>Try a different search term or return later as reviewed services are added.</p>
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
                      Show more services ({filtered.length - visibleCount} remaining)
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
            <p className="eyebrow">How to use this guide</p>
            <h2 id="about-title">Clarity before commitment.</h2>
          </div>
          <div className="about-copy">
            <p>Government rules can vary by applicant, route, and circumstance. This guide separates verified information from questions that still need confirmation.</p>
            <p>Every requirement, fee, and processing time is traced to its official government source. When information comes from non-government sources, it is clearly labelled.</p>
            <p>Covers identity documents, business registrations, social welfare schemes, property services, insurance, pensions, intellectual property, utilities, and more — with new services added regularly.</p>
            <p>It does not collect Aadhaar numbers, OTPs, passwords, biometrics, or complete identity-document images.</p>
          </div>
        </div>
      </section>
    </>
  );
}
