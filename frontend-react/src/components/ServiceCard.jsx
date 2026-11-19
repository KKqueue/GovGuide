import { Link } from "react-router-dom";
import useScrollReveal from "../hooks/useScrollReveal";
import { useLanguage } from "../hooks/useLanguage";
import { getServiceNameHi, getServiceDescHi } from "../i18n/serviceNames";

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

function getStatusLabel(readiness, t) {
  const map = {
    PUBLISHED: t("status_published"),
    APPROVED: t("status_approved"),
    EVIDENCE_REVIEWED: t("status_evidence_reviewed"),
    DRAFT: t("status_draft"),
    NEEDS_REVIEW: t("status_needs_review"),
  };
  return map[readiness] || t("status_in_review");
}

import { codeToName, DESC_FALLBACKS } from "../utils/serviceNames";

export default function ServiceCard({ service }) {
  const [ref, visible] = useScrollReveal();
  const { lang, t } = useLanguage();
  const info = getCategoryInfo(service.category);
  const status = getStatusLabel(service.publicationReadiness, t);
  const displayName = lang === "hi"
    ? (getServiceNameHi(service.serviceCode) || service.name || codeToName(service.serviceCode))
    : (service.name || codeToName(service.serviceCode));

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
      <h4>{displayName}</h4>
      <p>{lang === "hi" ? (getServiceDescHi(service.serviceCode) || t("service_guidance_available")) : (service.description || DESC_FALLBACKS[service.serviceCode] || t("service_guidance_available"))}</p>
      <span className="card-arrow" aria-hidden="true">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </span>
    </Link>
  );
}
