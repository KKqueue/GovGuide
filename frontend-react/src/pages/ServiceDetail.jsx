import { useState, useEffect, useCallback } from "react";
import { useParams, Link, useNavigate, useLocation } from "react-router-dom";
import { fetchService, createTask, fetchTask, fetchTaskApplication, updateChecklistItem, saveTaskId, getSavedTaskIds, checkReview } from "../api/services";
import { useAuth } from "../hooks/useAuth";
import { useLanguage } from "../hooks/useLanguage";
import { useToast } from "../components/Toast";
import { ServiceDetailSkeleton } from "../components/LoadingSpinner";
import { codeToName, DESC_FALLBACKS } from "../utils/serviceNames";
import { getServiceNameHi, getCategoryNameHi, getServiceDescHi } from "../i18n/serviceNames";
import FeedbackButton from "../components/FeedbackButton";
import ReviewModal from "../components/ReviewModal";

function extractEn(val) {
  if (val == null) return "";
  if (typeof val === "string") return val;
  if (typeof val === "object" && val.en) return val.en;
  return String(val);
}

const EXPAND = {
  POI: "Proof of Identity",
  POA: "Proof of Address",
  DOB: "Date of Birth",
  KYC: "Know Your Customer",
  NOC: "No Objection Certificate",
  EWS: "Economically Weaker Section",
  BPL: "Below Poverty Line",
  APL: "Above Poverty Line",
  UDID: "Unique Disability ID",
  NPS: "National Pension System",
  EPF: "Employee Provident Fund",
  ESI: "Employee State Insurance",
};

const KEEP_UPPER = new Set([
  "DL", "GST", "PAN", "ITR", "OBC", "SC", "ST", "RC", "TIN",
  "RERA", "MSME", "FSSAI", "IEC", "LLP", "NRI", "OCI", "RTI",
  "NEET", "JEE", "NREGA", "PPF", "LPG", "PNG", "ABHA", "FCRA",
  "GEM", "TAN", "HP", "PUC", "IGNOAPS", "ONORC",
]);

function formatCode(code) {
  return code.replace(/_/g, " ").replace(/\bREQ\b/i, "").replace(/\s+/g, " ").trim()
    .split(" ")
    .map(word => {
      const upper = word.toUpperCase();
      if (EXPAND[upper]) return EXPAND[upper];
      if (KEEP_UPPER.has(upper)) return upper;
      return word.toLowerCase().replace(/^\w/, c => c.toUpperCase());
    })
    .join(" ");
}

function serviceName(record, lang) {
  if (lang === "hi") {
    const hi = getServiceNameHi(record.serviceCode);
    if (hi) return hi;
  }
  return extractEn(record.name) || codeToName(record.serviceCode);
}

function getActionGuidance(state, code, claim, tl) {
  if (state === "MISSING") {
    return {
      icon: "alert",
      title: tl("how_to_obtain"),
      steps: [
        tl("obtain_check_online"),
        claim ? `${tl("obtain_what_needed")} ${claim.split(".")[0]}.` : null,
        tl("obtain_visit_office"),
        tl("obtain_once_done"),
      ].filter(Boolean),
    };
  }
  if (state === "UPDATE_REQUIRED") {
    return {
      icon: "refresh",
      title: tl("steps_to_update"),
      steps: [
        tl("update_expired"),
        tl("update_check_validity"),
        tl("update_apply_renewal"),
        tl("update_once_done"),
      ],
    };
  }
  if (state === "IN_PROGRESS") {
    return {
      icon: "clock",
      title: tl("while_you_wait"),
      steps: [
        tl("wait_track"),
        tl("wait_keep_receipt"),
        tl("wait_once_received"),
      ],
    };
  }
  return null;
}

function feesSummary(fees, tl) {
  if (!fees || !Array.isArray(fees) || fees.length === 0) return tl("varies");
  const primary = fees.find(f => f.amount === 0) || fees[0];
  if (primary.amount === 0) return tl("free");
  if (primary.amount == null) return tl("varies");
  const currency = primary.currency && primary.currency !== "INR" ? ` ${primary.currency}` : "";
  return `₹${primary.amount.toLocaleString("en-IN")}${currency}`;
}

function timeSummary(pt, tl) {
  if (!pt) return tl("unavailable");
  if (typeof pt === "string") return pt;
  if (pt.summary) return pt.summary;
  const max = pt.maximumDuration;
  const unit = (pt.unit || "DAYS").toLowerCase().replace(/_/g, " ");
  if (max) return `${tl("up_to")} ${max} ${unit}`;
  return pt.claim ? pt.claim.substring(0, 80) : tl("unavailable");
}

function categoryName(category, lang) {
  const en = (category || "").replace(/_/g, " ");
  if (lang === "hi") return getCategoryNameHi(en) || en;
  return en;
}

export default function ServiceDetail() {
  const { code } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, authHeader, signOut } = useAuth();
  const { lang, t: tl } = useLanguage();
  const { showToast } = useToast();
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [task, setTask] = useState(null);
  const [application, setApplication] = useState(null);
  const [checklistLoading, setChecklistLoading] = useState(false);
  const [checklistError, setChecklistError] = useState(null);
  const [showReview, setShowReview] = useState(false);
  const [reviewDone, setReviewDone] = useState(false);
  const [expandedItems, setExpandedItems] = useState(new Set());
  const [showCompletion, setShowCompletion] = useState(false);

  const loadService = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchService(code.toUpperCase());
      setRecord(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [code]);

  useEffect(() => {
    loadService();
    setTask(null);
    setApplication(null);
    window.scrollTo(0, 0);
  }, [loadService]);

  async function handleStartChecklist() {
    if (!user) {
      navigate("/auth", { state: { returnTo: location.pathname } });
      return;
    }
    setChecklistLoading(true);
    setChecklistError(null);
    try {
      const saved = getSavedTaskIds();
      const existing = saved.find(s => s.serviceCode === record.serviceCode);
      let taskData = null;
      if (existing) {
        taskData = await fetchTask(existing.taskId, authHeader);
      }
      if (!taskData) {
        taskData = await createTask(record.serviceCode, authHeader);
        saveTaskId(taskData.taskId, record.serviceCode);
      }
      setTask(taskData);
      showToast(tl("checklist_started_toast"), "success");
      try {
        const app = await fetchTaskApplication(taskData.taskId, authHeader);
        setApplication(app);
      } catch {}
    } catch (e) {
      if (e.message.includes("401")) {
        signOut();
        navigate("/auth", { state: { returnTo: location.pathname, sessionExpired: true } });
        return;
      }
      setChecklistError(e.message);
      showToast(tl("checklist_error_toast"), "error");
    } finally {
      setChecklistLoading(false);
    }
  }

  async function handleChecklistChange(requirementCode, state) {
    if (!task) return;
    try {
      const updated = await updateChecklistItem(task.taskId, requirementCode, state, authHeader);
      if (updated) {
        setTask(updated);
        if (updated.progressPercentage === 100 && !reviewDone) {
          checkReview(updated.taskId, authHeader).then(r => {
            if (!r.reviewed) setShowReview(true);
            else setReviewDone(true);
          }).catch(() => {});
        }
      }
    } catch {}
  }

  useEffect(() => {
    if (record) {
      const name = serviceName(record, lang);
      document.title = `${name} — ${tl("govt_guide")}`;
      const desc = extractEn(record.description) || `Complete requirements, fees, and documents needed for ${name}. Source-verified guide.`;
      let metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) metaDesc.setAttribute("content", desc);
      let ogTitle = document.querySelector('meta[property="og:title"]');
      if (ogTitle) ogTitle.setAttribute("content", `${name} — ${tl("govt_guide")}`);
      let ogDesc = document.querySelector('meta[property="og:description"]');
      if (ogDesc) ogDesc.setAttribute("content", desc);
    }
    return () => {
      document.title = "Government Guide Companion";
      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) metaDesc.setAttribute("content", "Free comprehensive guide to Indian government services — Aadhaar, PAN, passport, driving license, GST, property registration, and 120+ more.");
      const ogTitle = document.querySelector('meta[property="og:title"]');
      if (ogTitle) ogTitle.setAttribute("content", "Government Guide Companion");
    };
  }, [record]);

  if (loading) return <><div className="loading-bar" aria-hidden="true" /><ServiceDetailSkeleton /></>;

  if (error) {
    return (
      <div className="service-detail-page">
        <div className="shell">
          <Link to="/" className="service-back-nav">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
            {tl("back_to_services")}
          </Link>
          <div className="state-panel state-error" role="alert">
            <strong>{tl("error_load_details")}</strong>
            <p>{tl("error_check_connection")}</p>
            <button className="button button-secondary" type="button" onClick={loadService}>{tl("try_again")}</button>
          </div>
        </div>
      </div>
    );
  }

  if (!record) return null;

  const sources = record.sources || [];
  const eligibility = record.eligibility || {};
  const requirements = record.requirements || [];
  const processInfo = record.processInformation || [];

  return (
    <div className="service-detail-page">
      <div className="shell">
        <nav className="breadcrumb" aria-label="Breadcrumb">
          <ol>
            <li><Link to="/">{tl("home")}</Link></li>
            <li><Link to="/#services-section">{tl("services")}</Link></li>
            <li aria-current="page">{serviceName(record, lang)}</li>
          </ol>
        </nav>

        <div className="service-detail-layout">
          <div className="service-main">
            <div className="service-header">
              <h1>{serviceName(record, lang)}</h1>
              <div className="service-meta-badges">
                <span className="badge badge--category">{categoryName(record.category, lang)}</span>
                {record.publicationReadiness && (
                  <span className="badge badge--status">{tl("publication_ready")}</span>
                )}
              </div>
            </div>

            <p className="service-description">{lang === "hi" ? (getServiceDescHi(record.serviceCode) || extractEn(record.description) || DESC_FALLBACKS[record.serviceCode] || "") : (extractEn(record.description) || DESC_FALLBACKS[record.serviceCode] || "")}</p>

            <div className="service-glance">
              <h3>{tl("verified_glance")}</h3>
              <div className="glance-grid">
                <div className="glance-item">
                  <span className="glance-label">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                    {tl("jurisdiction")}
                  </span>
                  <span className="glance-value">{lang === "hi" ? ({CENTRAL: "केन्द्र", STATE: "राज्य", BOTH: "केन्द्र और राज्य"}[extractEn(record.jurisdiction)] || extractEn(record.jurisdiction) || "—") : (extractEn(record.jurisdiction) || "—")}</span>
                </div>
                <div className="glance-item">
                  <span className="glance-label">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                    {tl("service_fee")}
                  </span>
                  <span className="glance-value">{feesSummary(record.fees, tl)}</span>
                </div>
                <div className="glance-item">
                  <span className="glance-label">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                    {tl("processing")}
                  </span>
                  <span className="glance-value">{timeSummary(record.processingTime, tl)}</span>
                </div>
                <div className="glance-item">
                  <span className="glance-label">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                    {tl("last_checked")}
                  </span>
                  <span className="glance-value">{record.review?.lastVerifiedDate || "—"}</span>
                </div>
              </div>
            </div>

            {sources.length > 0 && (
              <div className="service-sources">
                <h3>{tl("sources_references")}</h3>
                <ul className="source-list">
                  {sources.map((src) => (
                    <li key={src.sourceCode} className="source-item">
                      <span className={`source-badge source-badge--${(src.sourceCategory || "").toLowerCase().replace(/_/g, "-")}`}>
                        {src.sourceCategory === "OFFICIAL_GOVERNMENT" ? tl("source_official") : (src.sourceCategory || "").replace(/_/g, " ")}
                      </span>
                      {src.url ? (
                        <a href={src.url} target="_blank" rel="noopener noreferrer">{extractEn(src.title)}</a>
                      ) : (
                        <span>{extractEn(src.title)}</span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="service-checklist-section">
              <h3>{tl("your_checklist")}</h3>
              <p>{tl("checklist_subtitle")}</p>
              {checklistError && (
                <div className="checklist-error" role="alert">
                  <p>{tl("checklist_error_toast")} {checklistError}</p>
                  <button className="button button-secondary" type="button" onClick={handleStartChecklist}>{tl("try_again")}</button>
                </div>
              )}
              {!task && !checklistError ? (
                <button className="button button-primary" type="button" onClick={handleStartChecklist} disabled={checklistLoading}>
                  {checklistLoading ? tl("starting") : tl("start_checklist")}
                </button>
              ) : task ? (
                <div className="checklist">
                  <div className="checklist-legend">
                    <h4>{tl("status_guide")}</h4>
                    <div className="checklist-legend-grid">
                      <div className="legend-item"><span className="legend-dot legend-dot--not-reviewed" />{tl("status_not_reviewed")} — {tl("hint_not_reviewed")}</div>
                      <div className="legend-item"><span className="legend-dot legend-dot--available" />{tl("status_available")} — {tl("hint_available")}</div>
                      <div className="legend-item"><span className="legend-dot legend-dot--in-progress" />{tl("status_in_progress")} — {tl("hint_in_progress")}</div>
                      <div className="legend-item"><span className="legend-dot legend-dot--completed" />{tl("status_completed")} — {tl("hint_completed")}</div>
                      <div className="legend-item"><span className="legend-dot legend-dot--missing" />{tl("status_missing")} — {tl("hint_missing")}</div>
                      <div className="legend-item"><span className="legend-dot legend-dot--update-required" />{tl("status_update_required")} — {tl("hint_update_required")}</div>
                      <div className="legend-item"><span className="legend-dot legend-dot--not-applicable" />{tl("status_not_applicable")} — {tl("hint_not_applicable")}</div>
                    </div>
                  </div>
                  {task.checklistStates && (() => {
                    const reqMap = {};
                    (requirements || []).forEach(r => { reqMap[r.requirementCode] = r; });
                    const statusPriority = { MISSING: 0, UPDATE_REQUIRED: 1, IN_PROGRESS: 2, NOT_REVIEWED: 3, AVAILABLE: 4, COMPLETED: 5, NOT_APPLICABLE: 6 };
                    const sorted = Object.entries(task.checklistStates).sort((a, b) => {
                      const pa = statusPriority[a[1]] ?? 3;
                      const pb = statusPriority[b[1]] ?? 3;
                      return pa - pb;
                    });
                    const needsAction = sorted.filter(([, s]) => s === "MISSING" || s === "UPDATE_REQUIRED" || s === "IN_PROGRESS");
                    const notReviewed = sorted.filter(([, s]) => !s || s === "NOT_REVIEWED");
                    const done = sorted.filter(([, s]) => s === "AVAILABLE" || s === "COMPLETED" || s === "NOT_APPLICABLE");
                    const groups = [];
                    if (needsAction.length > 0) groups.push({ label: tl("needs_attention"), items: needsAction, className: "checklist-group--action" });
                    if (notReviewed.length > 0) groups.push({ label: tl("not_yet_reviewed"), items: notReviewed, className: "checklist-group--pending" });
                    if (done.length > 0) groups.push({ label: tl("ready"), items: done, className: "checklist-group--done" });
                    return groups.map(group => (
                      <div key={group.label} className={`checklist-group ${group.className}`}>
                        <h4 className="checklist-group-label">{group.label} <span className="checklist-group-count">{group.items.length}</span></h4>
                        {group.items.map(([code, state]) => {
                          const req = reqMap[code];
                          const isExpanded = expandedItems.has(code);
                          return (
                            <div key={code} className={`checklist-item${state && state !== "NOT_REVIEWED" ? " checklist-item--" + state.toLowerCase() : ""}`}>
                              <div className="checklist-item-top">
                                <select
                                  value={state || "NOT_REVIEWED"}
                                  onChange={(e) => handleChecklistChange(code, e.target.value)}
                                  aria-label={`${tl("status_guide")} ${formatCode(code)}`}
                                >
                                  <option value="NOT_REVIEWED">{tl("status_not_reviewed")}</option>
                                  <option value="AVAILABLE">{tl("status_available")}</option>
                                  <option value="IN_PROGRESS">{tl("status_in_progress")}</option>
                                  <option value="COMPLETED">{tl("status_completed")}</option>
                                  <option value="MISSING">{tl("status_missing")}</option>
                                  <option value="UPDATE_REQUIRED">{tl("status_update_required")}</option>
                                  <option value="NOT_APPLICABLE">{tl("status_not_applicable")}</option>
                                </select>
                                <div className="checklist-item-info">
                                  <span className="checklist-label">{formatCode(code)}</span>
                                  {req && <span className={`checklist-badge checklist-badge--${(req.kind || "").toLowerCase()}`}>{req.kind === "MANDATORY" ? tl("required") : tl("optional")}</span>}
                                </div>
                                <button
                                  type="button"
                                  className={`checklist-expand${isExpanded ? " checklist-expand--open" : ""}`}
                                  onClick={() => setExpandedItems(prev => {
                                    const next = new Set(prev);
                                    if (next.has(code)) next.delete(code); else next.add(code);
                                    return next;
                                  })}
                                  aria-label={isExpanded ? tl("hide_details") : tl("show_details")}
                                >
                                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
                                </button>
                              </div>
                              {isExpanded && (
                                <div className="checklist-details">
                                  {req?.claim && <p className="checklist-description">{req.claim}</p>}
                                  {(() => {
                                    const guidance = getActionGuidance(state, code, req?.claim, tl);
                                    if (!guidance) return null;
                                    return (
                                      <div className={`checklist-action-box checklist-action-box--${state.toLowerCase()}`}>
                                        <h5 className="checklist-action-title">
                                          {guidance.icon === "alert" && <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>}
                                          {guidance.icon === "refresh" && <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>}
                                          {guidance.icon === "clock" && <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>}
                                          {guidance.title}
                                        </h5>
                                        <ol className="checklist-action-steps">
                                          {guidance.steps.map((step, i) => <li key={i}>{step}</li>)}
                                        </ol>
                                      </div>
                                    );
                                  })()}
                                  {(state === "MISSING" || state === "UPDATE_REQUIRED" || state === "IN_PROGRESS" || !state || state === "NOT_REVIEWED") && (
                                    <Link to={`/?search=${encodeURIComponent(formatCode(code))}`} className="checklist-find-link">
                                      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                                      {tl("find_related")}
                                    </Link>
                                  )}
                                </div>
                              )}
                              {!isExpanded && state && state !== "NOT_REVIEWED" && (
                                <p className="checklist-hint">
                                  {{ AVAILABLE: tl("checklist_hint_available"),
                                    IN_PROGRESS: tl("checklist_hint_in_progress"),
                                    COMPLETED: tl("checklist_hint_completed"),
                                    MISSING: tl("checklist_hint_missing"),
                                    UPDATE_REQUIRED: tl("checklist_hint_update_required"),
                                    NOT_APPLICABLE: tl("checklist_hint_not_applicable")
                                  }[state]}
                                </p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ));
                  })()}
                  <p className="checklist-progress">
                    {task.completedItems || 0} {tl("of_total")} {task.totalItems || 0} {tl("items_completed")} ({task.progressPercentage || 0}%)
                  </p>
                  {(task.progressPercentage === 100 || (() => {
                    if (!task.checklistStates) return false;
                    const vals = Object.values(task.checklistStates);
                    return vals.length > 0 && vals.every(s => s === "COMPLETED" || s === "AVAILABLE" || s === "NOT_APPLICABLE");
                  })()) && (
                    <div className="checklist-complete-banner">
                      <div className="checklist-complete-icon">
                        <svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                      </div>
                      <h4>{tl("all_docs_ready")} {serviceName(record, lang)}!</h4>
                      <p>{tl("checklist_completed_msg")}</p>
                      {record.officialLinks?.application && (
                        <a className="button button-primary checklist-complete-cta" href={record.officialLinks.application} target="_blank" rel="noopener noreferrer">
                          {tl("go_official")}
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
                          </svg>
                        </a>
                      )}
                      <Link to="/#services-section" className="checklist-complete-next">
                        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                        {tl("explore_more")}
                      </Link>
                    </div>
                  )}
                </div>
              ) : null}
            </div>

            {record.officialLinks?.application && !(task && (task.progressPercentage === 100 || (() => {
              if (!task?.checklistStates) return false;
              const vals = Object.values(task.checklistStates);
              return vals.length > 0 && vals.every(s => s === "COMPLETED" || s === "AVAILABLE" || s === "NOT_APPLICABLE");
            })())) && (
              <a className="button button-primary button--official" href={record.officialLinks.application} target="_blank" rel="noopener noreferrer">
                {tl("open_official")}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
                </svg>
              </a>
            )}
          </div>

          <aside className="service-sidebar">
            {eligibility.verifiedConditions?.length > 0 && (
              <div className="sidebar-section">
                <h3>{tl("source_confirms")}</h3>
                <ul className="evidence-list">
                  {eligibility.verifiedConditions.map((c, i) => (
                    <li key={c.conditionCode || i} className="evidence-item">
                      <p>{extractEn(c.claim)}</p>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {eligibility.unverifiedEligibility?.length > 0 && (
              <div className="sidebar-section sidebar-section--unverified">
                <h3>{tl("still_unresolved")}</h3>
                <ul className="evidence-list">
                  {eligibility.unverifiedEligibility.map((item, i) => (
                    <li key={i} className="evidence-item evidence-item--unverified">
                      <p>{extractEn(item)}</p>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </aside>
        </div>
      </div>
      <FeedbackButton serviceCode={record.serviceCode} />
      {showReview && task && (
        <ReviewModal
          serviceCode={record.serviceCode}
          taskId={task.taskId}
          onDone={() => { setShowReview(false); setReviewDone(true); }}
        />
      )}
    </div>
  );
}
