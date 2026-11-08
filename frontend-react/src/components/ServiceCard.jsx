import { useNavigate } from "react-router-dom";
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

const DESC_FALLBACKS = {
  COOPERATIVE_SOCIETY: "Registration of a cooperative society under the state Cooperative Societies Act for collective ownership and management of resources.",
  EPF_WITHDRAWAL: "Withdrawal or advance from the Employee Provident Fund (EPF) account managed by EPFO for retirement, housing, medical, or education purposes.",
  GEM_SELLER_REGISTRATION: "Registration on the Government e-Marketplace (GeM) portal for sellers and service providers to supply goods and services to government organizations.",
  LABOUR_LICENSE: "License required under the Contract Labour (Regulation and Abolition) Act for establishments employing contract workers beyond the threshold limit.",
  NGO_SECTION8: "Incorporation of a non-profit organization as a Section 8 company under the Companies Act, 2013 for charitable or social objectives.",
  NON_CREAMY_LAYER: "Certificate issued to OBC candidates confirming their family income is below the prescribed limit, required for reservation benefits in government services.",
  POWER_OF_ATTORNEY: "Legal document authorizing a person to act on behalf of another in legal, financial, or property matters, registered at the sub-registrar office.",
  RTI_APPLICATION: "Filing a Right to Information request under the RTI Act, 2005 to seek information from any public authority of the Government of India.",
  PMKVY_TRAINING: "Enrolment in the Pradhan Mantri Kaushal Vikas Yojana (PMKVY) skill development scheme for industry-relevant training and certification.",
  SOCIETY_REGISTRATION: "Registration of a society under the Societies Registration Act, 1860 for literary, scientific, charitable, or social welfare purposes.",
  TRUST_REGISTRATION: "Registration of a public or private trust under the Indian Trusts Act or state-specific trust acts for managing property for beneficiaries.",
  UDYAM_ASSIST: "Registration on the Udyam Assist Platform for informal micro enterprises to obtain recognition and access to MSME benefits and schemes.",
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

export default function ServiceCard({ service }) {
  const navigate = useNavigate();
  const [ref, visible] = useScrollReveal();
  const info = getCategoryInfo(service.category);
  const status = STATUS_LABELS[service.publicationReadiness] || "In Review";

  return (
    <article
      ref={ref}
      className={`catalogue-card${visible ? " is-visible" : ""}`}
      role="link"
      tabIndex={0}
      onClick={() => navigate(`/service/${service.serviceCode.toLowerCase()}`)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          navigate(`/service/${service.serviceCode.toLowerCase()}`);
        }
      }}
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
    </article>
  );
}
