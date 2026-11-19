const CATEGORY_GROUP = {
  AADHAAR: "Identity & Certificates", AADHAAR_UPDATE: "Identity & Certificates",
  PAN: "Identity & Certificates", VOTER_ID: "Identity & Certificates",
  BIRTH_CERTIFICATE: "Identity & Certificates", DEATH_CERTIFICATE: "Identity & Certificates",
  CASTE_CERTIFICATE: "Identity & Certificates", OBC_CERTIFICATE: "Identity & Certificates",
  SC_ST_CERTIFICATE: "Identity & Certificates", EWS_CERTIFICATE: "Identity & Certificates",
  DOMICILE_CERTIFICATE: "Identity & Certificates", INCOME_CERTIFICATE: "Identity & Certificates",
  CHARACTER_CERTIFICATE: "Identity & Certificates", NON_CREAMY_LAYER: "Identity & Certificates",
  DISABILITY_CERTIFICATE: "Identity & Certificates", SENIOR_CITIZEN_CARD: "Identity & Certificates",
  NAME_CHANGE_GAZETTE: "Identity & Certificates", DIGILOCKER_ACCOUNT: "Identity & Certificates",
  DIGITAL_SIGNATURE: "Identity & Certificates", LEGAL_HEIR: "Identity & Certificates",
  SUCCESSION_CERTIFICATE: "Identity & Certificates", JEEVAN_PRAMAAN: "Identity & Certificates",

  PASSPORT: "Travel & Immigration", PASSPORT_RENEWAL: "Travel & Immigration",
  PASSPORT_TATKAL: "Travel & Immigration", OCI_CARD: "Travel & Immigration",
  EMIGRATION_CLEARANCE: "Travel & Immigration", POLICE_CLEARANCE: "Travel & Immigration",

  DRIVING_LICENSE: "Transport & Driving", DRIVING_LICENSE_RENEWAL: "Transport & Driving",
  VEHICLE_REGISTRATION: "Transport & Driving", RC_TRANSFER: "Transport & Driving",
  VEHICLE_FITNESS: "Transport & Driving", VEHICLE_HP_REMOVAL: "Transport & Driving",
  PUC_CERTIFICATE: "Transport & Driving", MOTOR_INSURANCE: "Transport & Driving",

  GST: "Tax & Finance", INCOME_TAX: "Tax & Finance", TAN: "Tax & Finance",
  PROFESSIONAL_TAX: "Tax & Finance", STAMP_DUTY_PAYMENT: "Tax & Finance",
  E_WAY_BILL: "Tax & Finance", IEC: "Tax & Finance",

  PROPERTY: "Property & Land", LAND_REGISTRATION: "Property & Land",
  LAND_CONVERSION_NA: "Property & Land", ENCUMBRANCE: "Property & Land",
  OCCUPANCY_CERTIFICATE: "Property & Land", BUILDING_PLAN: "Property & Land",
  RERA_REGISTRATION: "Property & Land", SVAMITVA_PROPERTY_CARD: "Property & Land",
  POWER_OF_ATTORNEY: "Property & Land", WILL_REGISTRATION: "Property & Land",
  SOIL_CONSERVATION: "Property & Land", SOIL_HEALTH: "Property & Land",

  COMPANY_REGISTRATION: "Business & Commerce", LLP_REGISTRATION: "Business & Commerce",
  MSME: "Business & Commerce", STARTUP_INDIA: "Business & Commerce",
  TRADE_LICENSE: "Business & Commerce", SHOP_ESTABLISHMENT: "Business & Commerce",
  TRADEMARK: "Business & Commerce", PATENT_FILING: "Business & Commerce",
  COPYRIGHT_REGISTRATION: "Business & Commerce", FACTORY_LICENSE: "Business & Commerce",
  LABOUR_LICENSE: "Business & Commerce", BOILER_REGISTRATION: "Business & Commerce",
  TRADE_UNION: "Business & Commerce", SOCIETY_REGISTRATION: "Business & Commerce",
  COOPERATIVE_SOCIETY: "Business & Commerce", TRUST_REGISTRATION: "Business & Commerce",
  NGO_SECTION8: "Business & Commerce", FCRA_REGISTRATION: "Business & Commerce",
  CINEMA_LICENSE: "Business & Commerce", BAR_LICENSE: "Business & Commerce",
  MINING_LICENSE: "Business & Commerce", ELECTRICAL_CONTRACTOR: "Business & Commerce",
  GEM_SELLER_REGISTRATION: "Business & Commerce", UDYAM_ASSIST: "Business & Commerce",

  E_SHRAM: "Employment & Education", EMPLOYMENT_EXCHANGE: "Employment & Education",
  EPF: "Employment & Education", EPF_WITHDRAWAL: "Employment & Education",
  ESI: "Employment & Education", APPRENTICESHIP_REGISTRATION: "Employment & Education",
  NEET_UG_REGISTRATION: "Employment & Education", JEE_MAIN_REGISTRATION: "Employment & Education",
  SCHOLARSHIP: "Employment & Education", PMKVY_TRAINING: "Employment & Education",

  FSSAI: "Health & Food Safety", FSSAI_ANNUAL_RETURN: "Health & Food Safety",
  FOSTAC_CERTIFICATION: "Health & Food Safety", DRUG_LICENSE: "Health & Food Safety",
  PESTICIDE_LICENSE: "Health & Food Safety", SEED_LICENSE: "Health & Food Safety",
  ABHA_HEALTH_ID: "Health & Food Safety", AYUSHMAN_BHARAT: "Health & Food Safety",
  JAN_AUSHADHI_STORE: "Health & Food Safety", FOOD_SAFETY_TRAINING: "Health & Food Safety",

  PM_KISAN: "Social Welfare", PM_AWAS: "Social Welfare",
  PM_UJJWALA_YOJANA: "Social Welfare", PM_SVANIDHI: "Social Welfare",
  PM_VISHWAKARMA: "Social Welfare", PM_MATRU_VANDANA: "Social Welfare",
  PM_LAGHU_VYAPARI_PENSION: "Social Welfare", NREGA: "Social Welfare",
  NATIONAL_FOOD_SECURITY: "Social Welfare", ONORC_PORTABILITY: "Social Welfare",
  RATION_CARD: "Social Welfare", IGNOAPS_OLD_AGE_PENSION: "Social Welfare",
  RTI_APPLICATION: "Social Welfare", LEGAL_AID_SERVICES: "Social Welfare",

  PMJJBY_INSURANCE: "Insurance & Pension", PMSBY_INSURANCE: "Insurance & Pension",
  ATAL_PENSION: "Insurance & Pension", NPS_REGISTRATION: "Insurance & Pension",
  PPF_ACCOUNT: "Insurance & Pension", SUKANYA_SAMRIDDHI: "Insurance & Pension",
  KISAN_VIKAS_PATRA: "Insurance & Pension", KCC: "Insurance & Pension",
  JAN_DHAN_ACCOUNT: "Insurance & Pension", PMFBY_CROP_INSURANCE: "Insurance & Pension",

  MUDRA: "Loans & Schemes", PMEGP_LOAN: "Loans & Schemes",
  STAND_UP_INDIA_LOAN: "Loans & Schemes",

  ELECTRICITY: "Utilities & Housing", WATER: "Utilities & Housing",
  LPG_GAS: "Utilities & Housing", PNG_CONNECTION: "Utilities & Housing",
  BROADBAND_CONNECTION: "Utilities & Housing", FIRE_NOC: "Utilities & Housing",
  ENVIRONMENT_CLEARANCE: "Utilities & Housing", NOC_POLLUTION_CONTROL: "Utilities & Housing",
  ARMS_LICENSE: "Utilities & Housing",

  MARRIAGE_CERTIFICATE: "Legal & Personal", COURT_MARRIAGE: "Legal & Personal",
  AGRICULTURAL_LAND_CONVERSION: "Property & Land",
};

export function getDisplayCategory(category) {
  return CATEGORY_GROUP[category] || "Other";
}

export function extractCategories(services) {
  const groups = new Set();
  for (const s of services) {
    groups.add(getDisplayCategory(s.category));
  }
  return ["All", ...Array.from(groups).sort()];
}

import { useLanguage } from "../hooks/useLanguage";
import { getCategoryNameHi } from "../i18n/serviceNames";

export default function CategoryFilter({ categories, active, onChange }) {
  const { lang } = useLanguage();
  return (
    <div className="category-filters" role="group" aria-label="Filter by category">
      {categories.map((cat) => (
        <button
          key={cat}
          className={`category-chip ${active === cat ? "is-active" : ""}`}
          type="button"
          aria-pressed={active === cat}
          onClick={() => onChange(cat)}
        >
          {lang === "hi" ? getCategoryNameHi(cat) : cat}
        </button>
      ))}
    </div>
  );
}
