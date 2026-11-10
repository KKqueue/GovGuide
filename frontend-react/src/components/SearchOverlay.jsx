import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { fetchServices } from "../api/services";
import { codeToName } from "../utils/serviceNames";

let cachedServices = null;

export default function SearchOverlay({ open, onClose }) {
  const [query, setQuery] = useState("");
  const [services, setServices] = useState(cachedServices || []);
  const [fetchError, setFetchError] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef(null);
  const listRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!cachedServices) {
      setFetchError(false);
      fetchServices().then(data => {
        cachedServices = data;
        setServices(data);
      }).catch(() => setFetchError(true));
    }
  }, []);

  const dialogRef = useRef(null);

  useEffect(() => {
    if (open) {
      setQuery("");
      setActiveIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function trapFocus(e) {
      if (e.key !== "Tab" || !dialogRef.current) return;
      const focusable = dialogRef.current.querySelectorAll("input, button, [tabindex]:not([tabindex='-1'])");
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
    window.addEventListener("keydown", trapFocus);
    return () => window.removeEventListener("keydown", trapFocus);
  }, [open]);

  const results = query.trim()
    ? services
        .map(s => {
          const name = (s.name || codeToName(s.serviceCode)).toLowerCase();
          const cat = (s.category || "").toLowerCase().replace(/_/g, " ");
          const code = s.serviceCode.toLowerCase().replace(/_/g, " ");
          const q = query.toLowerCase();
          const wordBoundary = new RegExp("\\b" + q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\b");
          const wordStart = new RegExp("\\b" + q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
          let score = 0;
          if (name === q) score = 100;
          else if (wordBoundary.test(name)) score = 90;
          else if (wordStart.test(name)) score = 70;
          else if (name.includes(q)) score = 40;
          else if (wordBoundary.test(code) || wordStart.test(code)) score = 50;
          else if (code.includes(q)) score = 30;
          else if (cat.includes(q)) score = 20;
          return { ...s, _score: score };
        })
        .filter(s => s._score > 0)
        .sort((a, b) => b._score - a._score)
        .slice(0, 8)
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
      <div className="search-dialog" ref={dialogRef} onClick={e => e.stopPropagation()} role="dialog" aria-label="Search services" aria-modal="true">
        <div className="search-dialog-input-wrap">
          <svg className="search-dialog-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            ref={inputRef}
            type="search"
            placeholder="Search services..."
            aria-label="Search services"
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
          <div className="search-dialog-hint">
            {fetchError
              ? "Could not load services. Try again later."
              : `Type to search across ${services.length}+ government services`}
          </div>
        )}
      </div>
    </div>
  );
}
