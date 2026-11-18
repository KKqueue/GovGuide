import { useState, useEffect, useMemo, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { fetchServices } from "../api/services";
import ServiceCard from "../components/ServiceCard";
import CategoryFilter, { extractCategories, getDisplayCategory } from "../components/CategoryFilter";
import { SkeletonGrid } from "../components/LoadingSpinner";
import { codeToName } from "../utils/serviceNames";

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
            <p className="section-label">Your guide to Indian government services</p>
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
          <div className="hero-visual" aria-hidden="true">
            <div className="hero-card hero-card--1">
              <div className="hero-card-icon hero-card-icon--check">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              </div>
              <div className="hero-card-text">
                <span className="hero-card-title">Identity proof</span>
                <span className="hero-card-status hero-card-status--done">Verified</span>
              </div>
            </div>
            <div className="hero-card hero-card--2">
              <div className="hero-card-icon hero-card-icon--check">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              </div>
              <div className="hero-card-text">
                <span className="hero-card-title">Address proof</span>
                <span className="hero-card-status hero-card-status--done">Verified</span>
              </div>
            </div>
            <div className="hero-card hero-card--3">
              <div className="hero-card-icon hero-card-icon--pending">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              </div>
              <div className="hero-card-text">
                <span className="hero-card-title">Passport photo</span>
                <span className="hero-card-status hero-card-status--pending">Pending</span>
              </div>
            </div>
            <div className="hero-card hero-card--4">
              <div className="hero-card-icon hero-card-icon--info">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
              </div>
              <div className="hero-card-text">
                <span className="hero-card-title">Fee: ₹1,500</span>
                <span className="hero-card-status hero-card-status--info">Official source</span>
              </div>
            </div>
            <aside className="hero-note">
              <span className="note-icon">i</span>
              <div>
                <strong>Independent guide</strong>
                <p>Not an official government portal. Applications must be completed through official channels.</p>
              </div>
            </aside>
          </div>
        </div>
      </section>

      <section id="services-section" className="services-section" ref={servicesRef} aria-labelledby="services-title">
        <div className="shell">
          <div className="section-heading">
            <div>
              <p className="section-label">Start here</p>
              <h2 id="services-title">Choose a service</h2>
            </div>
            <p className="section-intro">
              Browse the services currently covered by this independent guide. New services appear only after their evidence has been reviewed.
            </p>
          </div>

          <section className="catalogue-panel" aria-labelledby="catalogue-title">
            <div className="catalogue-heading">
              <div>
                <p className="section-label">Service catalogue</p>
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
            <p className="section-label">How to use this guide</p>
            <h2 id="about-title">Clarity before commitment.</h2>
            <div className="about-features" aria-hidden="true">
              <div className="about-feature">
                <div className="about-feature-icon">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
                </div>
                <div>
                  <strong>Source-verified</strong>
                  <p>Every fact traced to its official government source</p>
                </div>
              </div>
              <div className="about-feature">
                <div className="about-feature-icon">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                </div>
                <div>
                  <strong>Privacy-first</strong>
                  <p>No Aadhaar, OTPs, passwords or biometrics collected</p>
                </div>
              </div>
              <div className="about-feature">
                <div className="about-feature-icon">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                </div>
                <div>
                  <strong>Transparent</strong>
                  <p>Unverified information clearly labelled as such</p>
                </div>
              </div>
            </div>
          </div>
          <div className="about-copy">
            <p>Government rules can vary by applicant, route, and circumstance. This guide separates verified information from questions that still need confirmation.</p>
            <p>Every requirement, fee, and processing time is traced to its official government source. When information comes from non-government sources, it is clearly labelled.</p>
            <p>Covers identity documents, business registrations, social welfare schemes, property services, insurance, pensions, intellectual property, utilities, and more — with new services added regularly.</p>
          </div>
        </div>
      </section>
    </>
  );
}
