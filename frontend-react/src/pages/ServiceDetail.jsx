import { useState, useEffect, useCallback } from "react";
import { useParams, Link, useNavigate, useLocation } from "react-router-dom";
import { fetchService, createTask, fetchTask, fetchTaskApplication, updateChecklistItem, saveTaskId, getSavedTaskIds, checkReview } from "../api/services";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "../components/Toast";
import { ServiceDetailSkeleton } from "../components/LoadingSpinner";
import { codeToName, DESC_FALLBACKS } from "../utils/serviceNames";
import FeedbackButton from "../components/FeedbackButton";
import ReviewModal from "../components/ReviewModal";

function t(val) {
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

function serviceName(record) {
  return t(record.name) || codeToName(record.serviceCode);
}

function getActionGuidance(state, code, claim) {
  const docName = formatCode(code);
  if (state === "MISSING") {
    return {
      icon: "alert",
      title: "How to obtain this document",
      steps: [
        `Check if "${docName}" can be obtained online through your state's e-District or service portal.`,
        claim ? `What you need: ${claim.split(".")[0]}.` : null,
        "Visit the nearest government office (Tehsildar, Municipal, Sub-Registrar) if online isn't available.",
        "Once obtained, update this item to 'Available' or 'Completed'.",
      ].filter(Boolean),
    };
  }
  if (state === "UPDATE_REQUIRED") {
    return {
      icon: "refresh",
      title: "Steps to update this document",
      steps: [
        `Your "${docName}" may be expired or contain outdated information.`,
        "Check the validity/expiry date on your existing document.",
        "Apply for renewal or re-issuance through the official portal or the issuing office.",
        "Once renewed, update this item to 'Available' or 'Completed'.",
      ],
    };
  }
  if (state === "IN_PROGRESS") {
    return {
      icon: "clock",
      title: "While you wait",
      steps: [
        "If you've applied, track your application status on the official portal.",
        "Keep your application receipt or acknowledgment number safe.",
        "Once received, update this item to 'Available' or 'Completed'.",
      ],
    };
  }
  return null;
}

function feesSummary(fees) {
  if (!fees || !Array.isArray(fees) || fees.length === 0) return "Varies";
  const primary = fees.find(f => f.amount === 0) || fees[0];
  if (primary.amount === 0) return "Free";
  if (primary.amount == null) return "Varies";
  const currency = primary.currency && primary.currency !== "INR" ? ` ${primary.currency}` : "";
  return `₹${primary.amount.toLocaleString("en-IN")}${currency}`;
}

function timeSummary(pt) {
  if (!pt) return "Unavailable";
  if (typeof pt === "string") return pt;
  if (pt.summary) return pt.summary;
  const max = pt.maximumDuration;
  const unit = (pt.unit || "DAYS").toLowerCase().replace(/_/g, " ");
  if (max) return `Up to ${max} ${unit}`;
  return pt.claim ? pt.claim.substring(0, 80) : "Unavailable";
}

export default function ServiceDetail() {
  const { code } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, authHeader, signOut } = useAuth();
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
      showToast("Checklist started — track your progress below.", "success");
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
      showToast("Could not start checklist. Please try again.", "error");
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
      const name = serviceName(record);
      document.title = `${name} — Government Guide`;
      const desc = t(record.description) || `Complete requirements, fees, and documents needed for ${name}. Source-verified guide.`;
      let metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) metaDesc.setAttribute("content", desc);
      let ogTitle = document.querySelector('meta[property="og:title"]');
      if (ogTitle) ogTitle.setAttribute("content", `${name} — Government Guide`);
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
            Back to all services
          </Link>
          <div className="state-panel state-error" role="alert">
            <strong>We couldn't load these details.</strong>
            <p>Check your connection and try again.</p>
            <button className="button button-secondary" type="button" onClick={loadService}>Try again</button>
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
            <li><Link to="/">Home</Link></li>
            <li><Link to="/#services-section">Services</Link></li>
            <li aria-current="page">{serviceName(record)}</li>
          </ol>
        </nav>

        <div className="service-detail-layout">
          <div className="service-main">
            <div className="service-header">
              <h1>{serviceName(record)}</h1>
              <div className="service-meta-badges">
                <span className="badge badge--category">{(record.category || "").replace(/_/g, " ")}</span>
                {record.publicationReadiness && (
                  <span className="badge badge--status">{record.publicationReadiness.replace(/_/g, " ")}</span>
                )}
              </div>
            </div>

            <p className="service-description">{t(record.description) || DESC_FALLBACKS[record.serviceCode] || ""}</p>

            <div className="service-glance">
              <h3>Verified at a glance</h3>
              <div className="glance-grid">
                <div className="glance-item">
                  <span className="glance-label">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                    Jurisdiction
                  </span>
                  <span className="glance-value">{t(record.jurisdiction) || "—"}</span>
                </div>
                <div className="glance-item">
                  <span className="glance-label">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                    Service fee
                  </span>
                  <span className="glance-value">{feesSummary(record.fees)}</span>
                </div>
                <div className="glance-item">
                  <span className="glance-label">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                    Processing
                  </span>
                  <span className="glance-value">{timeSummary(record.processingTime)}</span>
                </div>
                <div className="glance-item">
                  <span className="glance-label">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                    Last checked
                  </span>
                  <span className="glance-value">{record.review?.lastVerifiedDate || "—"}</span>
                </div>
              </div>
            </div>

            {sources.length > 0 && (
              <div className="service-sources">
                <h3>Sources &amp; References</h3>
                <ul className="source-list">
                  {sources.map((src) => (
                    <li key={src.sourceCode} className="source-item">
                      <span className={`source-badge source-badge--${(src.sourceCategory || "").toLowerCase().replace(/_/g, "-")}`}>
                        {src.sourceCategory === "OFFICIAL_GOVERNMENT" ? "OFFICIAL" : (src.sourceCategory || "").replace(/_/g, " ")}
                      </span>
                      {src.url ? (
                        <a href={src.url} target="_blank" rel="noopener noreferrer">{t(src.title)}</a>
                      ) : (
                        <span>{t(src.title)}</span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="service-checklist-section">
              <h3>Your document checklist</h3>
              <p>Track which documents you have and which you still need. Update the status of each item as you gather your documents.</p>
              {checklistError && (
                <div className="checklist-error" role="alert">
                  <p>Could not start checklist. {checklistError}</p>
                  <button className="button button-secondary" type="button" onClick={handleStartChecklist}>Try again</button>
                </div>
              )}
              {!task && !checklistError ? (
                <button className="button button-primary" type="button" onClick={handleStartChecklist} disabled={checklistLoading}>
                  {checklistLoading ? "Starting..." : "Start checklist"}
                </button>
              ) : task ? (
                <div className="checklist">
                  <div className="checklist-legend">
                    <h4>Status guide</h4>
                    <div className="checklist-legend-grid">
                      <div className="legend-item"><span className="legend-dot legend-dot--not-reviewed" />Not reviewed — You haven't checked this yet</div>
                      <div className="legend-item"><span className="legend-dot legend-dot--available" />Available — You have this document ready</div>
                      <div className="legend-item"><span className="legend-dot legend-dot--in-progress" />In progress — You're working on getting this</div>
                      <div className="legend-item"><span className="legend-dot legend-dot--completed" />Completed — Document submitted or verified</div>
                      <div className="legend-item"><span className="legend-dot legend-dot--missing" />Missing — You don't have this yet and need to get it</div>
                      <div className="legend-item"><span className="legend-dot legend-dot--update-required" />Update required — You have it but it's expired or needs renewal</div>
                      <div className="legend-item"><span className="legend-dot legend-dot--not-applicable" />Not applicable — This doesn't apply to your case</div>
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
                    if (needsAction.length > 0) groups.push({ label: "Needs your attention", items: needsAction, className: "checklist-group--action" });
                    if (notReviewed.length > 0) groups.push({ label: "Not yet reviewed", items: notReviewed, className: "checklist-group--pending" });
                    if (done.length > 0) groups.push({ label: "Ready", items: done, className: "checklist-group--done" });
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
                                  aria-label={`Status for ${formatCode(code)}`}
                                >
                                  <option value="NOT_REVIEWED">Not reviewed</option>
                                  <option value="AVAILABLE">Available</option>
                                  <option value="IN_PROGRESS">In progress</option>
                                  <option value="COMPLETED">Completed</option>
                                  <option value="MISSING">Missing</option>
                                  <option value="UPDATE_REQUIRED">Update required</option>
                                  <option value="NOT_APPLICABLE">Not applicable</option>
                                </select>
                                <div className="checklist-item-info">
                                  <span className="checklist-label">{formatCode(code)}</span>
                                  {req && <span className={`checklist-badge checklist-badge--${(req.kind || "").toLowerCase()}`}>{req.kind === "MANDATORY" ? "Required" : "Optional"}</span>}
                                </div>
                                <button
                                  type="button"
                                  className={`checklist-expand${isExpanded ? " checklist-expand--open" : ""}`}
                                  onClick={() => setExpandedItems(prev => {
                                    const next = new Set(prev);
                                    if (next.has(code)) next.delete(code); else next.add(code);
                                    return next;
                                  })}
                                  aria-label={isExpanded ? "Hide details" : "Show details"}
                                >
                                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
                                </button>
                              </div>
                              {isExpanded && (
                                <div className="checklist-details">
                                  {req?.claim && <p className="checklist-description">{req.claim}</p>}
                                  {(() => {
                                    const guidance = getActionGuidance(state, code, req?.claim);
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
                                      Find related service on GovGuide
                                    </Link>
                                  )}
                                </div>
                              )}
                              {!isExpanded && state && state !== "NOT_REVIEWED" && (
                                <p className="checklist-hint">
                                  {{ AVAILABLE: "You have this document ready.",
                                    IN_PROGRESS: "You're working on obtaining this.",
                                    COMPLETED: "This requirement is fulfilled.",
                                    MISSING: "You need to obtain this document.",
                                    UPDATE_REQUIRED: "Your current document needs updating.",
                                    NOT_APPLICABLE: "This requirement does not apply to your case."
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
                    {task.completedItems || 0} of {task.totalItems || 0} items completed ({task.progressPercentage || 0}%)
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
                      <h4>All documents ready for {serviceName(record)}!</h4>
                      <p>You've completed your checklist. You can now proceed to the official service portal to submit your application.</p>
                      {record.officialLinks?.application && (
                        <a className="button button-primary checklist-complete-cta" href={record.officialLinks.application} target="_blank" rel="noopener noreferrer">
                          Go to official service page
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
                          </svg>
                        </a>
                      )}
                      <Link to="/#services-section" className="checklist-complete-next">
                        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                        Explore more services
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
                Open official service page
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
                </svg>
              </a>
            )}
          </div>

          <aside className="service-sidebar">
            {eligibility.verifiedConditions?.length > 0 && (
              <div className="sidebar-section">
                <h3>What the source confirms</h3>
                <ul className="evidence-list">
                  {eligibility.verifiedConditions.map((c, i) => (
                    <li key={c.conditionCode || i} className="evidence-item">
                      <p>{t(c.claim)}</p>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {eligibility.unverifiedEligibility?.length > 0 && (
              <div className="sidebar-section sidebar-section--unverified">
                <h3>Still unresolved</h3>
                <ul className="evidence-list">
                  {eligibility.unverifiedEligibility.map((item, i) => (
                    <li key={i} className="evidence-item evidence-item--unverified">
                      <p>{t(item)}</p>
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
