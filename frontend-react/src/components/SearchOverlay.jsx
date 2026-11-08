import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { fetchServices } from "../api/services";

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

let cachedServices = null;

export default function SearchOverlay({ open, onClose }) {
  const [query, setQuery] = useState("");
  const [services, setServices] = useState(cachedServices || []);
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef(null);
  const listRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!cachedServices) {
      fetchServices().then(data => {
        cachedServices = data;
        setServices(data);
      }).catch(() => {});
    }
  }, []);

  useEffect(() => {
    if (open) {
      setQuery("");
      setActiveIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const results = query.trim()
    ? services.filter(s => {
        const name = (s.name || codeToName(s.serviceCode)).toLowerCase();
        const cat = (s.category || "").toLowerCase().replace(/_/g, " ");
        const q = query.toLowerCase();
        return name.includes(q) || cat.includes(q) || s.serviceCode.toLowerCase().includes(q);
      }).slice(0, 8)
    : [];

  const handleSelect = useCallback((service) => {
    onClose();
    navigate(`/service/${service.serviceCode.toLowerCase()}`);
  }, [navigate, onClose]);

  function handleKeyDown(e) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex(i => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex(i => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && results[activeIndex]) {
      e.preventDefault();
      handleSelect(results[activeIndex]);
    } else if (e.key === "Escape") {
      onClose();
    }
  }

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  useEffect(() => {
    if (listRef.current) {
      const active = listRef.current.querySelector("[data-active='true']");
      if (active) active.scrollIntoView({ block: "nearest" });
    }
  }, [activeIndex]);

  if (!open) return null;

  return (
    <div className="search-overlay" onClick={onClose}>
      <div className="search-dialog" onClick={e => e.stopPropagation()} role="dialog" aria-label="Search services">
        <div className="search-dialog-input-wrap">
          <svg className="search-dialog-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            ref={inputRef}
            type="search"
            placeholder="Search services..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            autoComplete="off"
          />
          <kbd className="search-dialog-kbd">Esc</kbd>
        </div>
        {query.trim() && (
          <ul className="search-dialog-results" ref={listRef} role="listbox">
            {results.length === 0 ? (
              <li className="search-dialog-empty">No services found for &ldquo;{query}&rdquo;</li>
            ) : (
              results.map((s, i) => (
                <li
                  key={s.serviceCode}
                  role="option"
                  aria-selected={i === activeIndex}
                  data-active={i === activeIndex}
                  className={`search-dialog-result ${i === activeIndex ? "is-active" : ""}`}
                  onClick={() => handleSelect(s)}
                  onMouseEnter={() => setActiveIndex(i)}
                >
                  <span className="search-result-name">{s.name || codeToName(s.serviceCode)}</span>
                  <span className="search-result-category">{(s.category || "").replace(/_/g, " ")}</span>
                </li>
              ))
            )}
          </ul>
        )}
        {!query.trim() && (
          <div className="search-dialog-hint">Type to search across {services.length}+ government services</div>
        )}
      </div>
    </div>
  );
}
