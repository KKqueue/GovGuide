import { Link } from "react-router-dom";
import useScrollReveal from "../hooks/useScrollReveal";

const CATEGORY_ICONS = {
  AADHAAR_SERVICES: { icon: "ID", css: "identity" },
  PAN_CARD: { icon: "PA", css: "finance" },
  PASSPORT_SERVICES: { icon: "PP", css: "travel" },
  DRIVING_LICENSE: { icon: "DL", css: "transport" },
  GST_REGISTRATION: { icon: "GS", css: "finance" },
  BIRTH_CERTIFICATE: { icon: "BC", css: "identity" },
  DEATH_CERTIFICATE: { icon: "DC", css: "identity" },
  VOTER_ID: { icon: "VI", css: "identity" },
  PROPERTY_REGISTRATION: { icon: "PR", css: "property" },
  INCOME_TAX: { icon: "IT", css: "finance" },
  FSSAI_LICENSE: { icon: "FL", css: "health" },
  MSME_REGISTRATION: { icon: "MS", css: "business" },
  E_SHRAM: { icon: "ES", css: "employment" },
};

function getCategoryInfo(category) {
  if (CATEGORY_ICONS[category]) return CATEGORY_ICONS[category];
  const abbr = (category || "GS")
    .split(/[_\s]+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return { icon: abbr, css: "identity" };
}

const STATUS_LABELS = {
  PUBLISHED: "Published",
  APPROVED: "Approved",
  EVIDENCE_REVIEWED: "Evidence Reviewed",
  DRAFT: "Draft",
  NEEDS_REVIEW: "Needs Review",
};

import { codeToName, DESC_FALLBACKS } from "../utils/serviceNames";

export default function ServiceCard({ service }) {
  const [ref, visible] = useScrollReveal();
  const info = getCategoryInfo(service.category);
  const status = STATUS_LABELS[service.publicationReadiness] || "In Review";

  return (
    <Link
      ref={ref}
      to={`/service/${service.serviceCode.toLowerCase()}`}
      className={`catalogue-card${visible ? " is-visible" : ""}`}
    >
      <div className="catalogue-card-header">
        <span className={`category-icon category-icon--${info.css}`} aria-hidden="true">
          {info.icon}
        </span>
        <span className="badge">{status}</span>
      </div>
      <h4>{service.name || codeToName(service.serviceCode)}</h4>
      <p>{service.description || DESC_FALLBACKS[service.serviceCode] || "Service guidance available."}</p>
      <span className="card-arrow" aria-hidden="true">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </span>
    </Link>
  );
}
