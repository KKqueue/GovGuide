# T002 source evidence ledger

Verification date: 2026-10-22

This ledger records source-backed research separately from publishable service content. A source can be verified while a service remains in `REVIEW`; verification does not publish a route or make it an official government portal.

Every source listed below has `sourceCategory: OFFICIAL_GOVERNMENT`. No independent, staff-reported, or unknown source is being presented as corroboration. The source category records provenance; the per-claim status and applicability determine whether a claim can be used.

Machine validation checks the recorded status, references, provenance, and publication rules. A reviewer must still confirm that the evidence excerpt supports the exact claim, that applicant conditions match the source's scope, and that supposedly independent sources are not copies of the same underlying material.

## Instant e-PAN

| Claim or requirement | Official source and section | Evidence recorded | Status | Applicability |
| --- | --- | --- | --- | --- |
| The route is a free, pre-login Income Tax Department service for an individual who has not been allotted a PAN, using Aadhaar, an Aadhaar-linked active mobile number, and DigiLocker access. | [Income Tax Department Instant e-PAN FAQ](https://www.incometax.gov.in/iec/foportal/help/all-topics/e-filing-services/Instant%20e-PAN-faq), questions 1–4 | FAQ lines state the route, individual/no-PAN limitation, linked mobile, DigiLocker, and free-of-cost status. | VERIFIED | Applicants using the Instant e-PAN route; not a universal PAN application checklist. |
| Existing PAN holders, minors, and representative assessees are excluded. | [Income Tax Department Instant e-PAN FAQ](https://www.incometax.gov.in/iec/foportal/help/all-topics/e-filing-services/Instant%20e-PAN-faq), question 3 | FAQ lists the three exclusions. | VERIFIED | Applicants whose facts match the exclusion categories. |
| Aadhaar-linked mobile is used for OTP validation. | [Income Tax Department Instant e-PAN FAQ](https://www.incometax.gov.in/iec/foportal/help/all-topics/e-filing-services/Instant%20e-PAN-faq), questions 4 and 21 | FAQ identifies the linked mobile prerequisite and explains that the link is needed for Aadhaar OTP and DigiLocker sign-up. | VERIFIED | Applicants completing Aadhaar OTP verification. |
| DigiLocker supplies date-of-birth proof; the applicant selects an available accepted document. | [Income Tax Department Instant e-PAN FAQ](https://www.incometax.gov.in/iec/foportal/help/all-topics/e-filing-services/Instant%20e-PAN-faq), questions 6–8; [Instant e-PAN User Manual](https://www.incometax.gov.in/iec/foportal/help/all-topics/e-filing-services/instant-e-pan/instant-UM?mobile-app=1), section 1 | Sources list birth certificate, matriculation certificate/marksheet, driving licence, and CGHS card variants and describe consented DigiLocker sharing. | VERIFIED | The accepted proof set is limited to the source-listed DigiLocker choices. |
| No physical PAN card, scanned photo/signature, or in-person verification is established for this route. | [Income Tax Department e-PAN FAQ](https://www.incometax.gov.in/iec/foportal/node/11392), questions 11–14 | FAQ describes an online process, electronic PAN, no paperwork/IPV, and no physical card. | VERIFIED | Instant e-PAN route only. |
| The output is a digitally signed electronic PAN and the service is described as near-real time. | [Income Tax Department Instant e-PAN User Manual](https://www.incometax.gov.in/iec/foportal/help/all-topics/e-filing-services/instant-e-pan/instant-UM?mobile-app=1), overview | Manual describes digitally signed electronic PAN and online status/download flow. | VERIFIED | Qualitative description only; no completion-date calculation. |
| Rejected or unserviced requests have an alternative route through NSDL/Protean or UTIITSL. | [Income Tax Department Instant e-PAN FAQ](https://www.incometax.gov.in/iec/foportal/node/11392), rejection guidance | The reviewed FAQ identifies correction/assistance steps and alternative PAN channels for rejected or unavailable requests. | VERIFIED | Conditional fallback after the Instant e-PAN route cannot complete. |

### Instant e-PAN unresolved items

- The service record remains `REVIEW` / `LIMITED_ROUTE_CANDIDATE` pending independent publication approval.
- The research does not create a universal PAN, correction, reprint, replacement, minor, foreign-applicant, or entity workflow.
- A numeric processing duration and guaranteed completion date remain unavailable.
- No physical delivery, service-centre charge, or delivery charge is assumed.

## Passport Seva research (not published)

| Claim or requirement | Official source and section | Evidence recorded | Status | Applicability |
| --- | --- | --- | --- | --- |
| Fresh and re-issue passport applications use Passport Seva's online application flow and document advisory. | [Passport Seva Apply Passport](https://services1.passportindia.gov.in/psp/ApplyPassport) and [Fresh Passport Document Advisor](https://www.passportindia.gov.in/psp/docAdvisor/attachmentAdvFreshInp) | Official portal separates Fresh/Re-issue Ordinary, Tatkaal, and Diplomatic/Official routes and points applicants to the document advisor. | VERIFIED | Route and category selection must precede any checklist. |
| Ordinary passport timelines are up to 30 working days for fresh issue; re-issue may be up to 7 or 30 working days depending on police-verification requirements. | [Passport Seva Citizen's Charter](https://services1.passportindia.gov.in/AppOnlineProject/pdf/Citizen_Charter.pdf), Passport Services table | Charter states the timelines and excludes the police-verification period. | VERIFIED | Complete documentation and required clearances are assumed by the charter. |
| Tatkaal can be dispatched within up to 3 working days after a granted application, subject to eligibility. | [Passport Seva Citizen's Charter](https://services1.passportindia.gov.in/AppOnlineProject/pdf/Citizen_Charter.pdf), Passport Services table; [Tatkaal FAQ](https://www.passportindia.gov.in/psp/FaqTatkaalPassports) | Official sources qualify the timeline by final grant and Tatkaal eligibility. | VERIFIED | Not a guarantee and not applicable to excluded cases. |
| Tatkaal document counts differ by age: adults submit any three listed documents; applicants below 18 submit any two from the specified list. | [Passport Seva Tatkaal FAQ](https://www.passportindia.gov.in/psp/FaqTatkaalPassports) | Official FAQ states the age-specific document counts and original-document presentation. | VERIFIED | Tatkaal only; the complete accepted list must come from the current official document advisory. |
| Tatkaal has an additional fee and online payment is required for appointment booking. | [Passport Seva Citizen's Charter](https://services1.passportindia.gov.in/AppOnlineProject/pdf/Citizen_Charter.pdf), Passport Services table; [Fee Payment FAQ](https://www.passportindia.gov.in/psp/FaqFeePayment) | Charter and FAQ direct applicants to the current fee calculator and identify the additional Tatkaal charge/payment flow. | VERIFIED | Exact amount is calculator/category dependent and must not be hard-coded from a stale value. |
| Tamil Nadu jurisdiction is split across Regional Passport Offices; Chennai and Coimbatore pages identify covered districts. | [RPO Chennai](https://www.passportindia.gov.in/psp/RPO/ChennaiRPO); [RPO Coimbatore](https://www.passportindia.gov.in/psp/RPO/CoimbatoreRPO) | Official pages provide jurisdiction summaries and the Passport Seva contact route. | VERIFIED | Jurisdiction information only; it does not prove a particular PSK/POPSK has a service slot or current availability. |

### Passport unresolved items

- No Passport service JSON is published in the catalogue because category-specific document rules, fees, exclusions, and current office listings have not been normalized and independently reviewed.
- Exact ordinary-passport fees vary by booklet, validity, applicant category, and current fee-calculator rules; the ledger therefore links to the official calculator instead of inventing a fixed amount.
- The complete Tatkaal exclusion list and all category-specific document combinations require the current official instruction booklet/document-advisor review.
- Tamil Nadu office addresses, appointment availability, opening hours, and service capability were not added because the reviewed RPO pages do not establish those facts for a specific office record.
- No Passport content is treated as an approved requirement, fee, timeline guarantee, or office result.
