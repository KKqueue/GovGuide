# Government Guide Companion Implementation Plan

## 1. Executive Summary

Government Guide Companion is an independent informational and organizational web application for citizens in India, initially focused on Tamil Nadu. It helps users understand government services, prepare document checklists, identify missing prerequisites, open nested tasks, find official application channels, locate relevant offices, and manually track applications.

The workspace was empty when this plan was prepared. The approved architecture is:

- Frontend: HTML5, CSS3, and vanilla JavaScript only.
- Backend: Java with Spring Boot.
- Communication: versioned JSON REST APIs over HTTP locally and HTTPS in deployment.
- Database: MySQL, accessed exclusively by Spring Boot.
- Government information: structured, versioned, source-attributed content maintained independently from workflow logic.

The first useful release should demonstrate one verified service checklist and one verified prerequisite workflow rather than attempting to cover all Indian services.

## 2. Product Problem and Users

Citizens may begin a government process without knowing the complete requirements, which documents are missing, whether an update is needed, where the service is actually available, what it costs, or how long it may take. This causes unnecessary visits, expense, delay, and confusion.

Primary users are ordinary citizens in Tamil Nadu, including people unfamiliar with government procedures, users with limited technical confidence, and users who may prefer Tamil. The application is not an official government portal, does not make approval decisions, and must never imply government affiliation or guarantee approval.

## 3. Product Principles

1. Use official government sources as the primary source of truth.
2. Mark unknown, variable, expired, or unverified information clearly instead of inventing certainty.
3. Distinguish possessing a document from verifying its validity, applying for it, receiving it, or satisfying a particular service requirement.
4. Use verified rules rather than assumptions about prerequisites.
5. Keep user progress isolated from general government-service definitions and from other users.
6. Collect the minimum information required for the selected workflow.
7. Use plain language, semantic HTML, keyboard support, visible focus, accessible labels, and text status indicators in addition to colour.
8. Guide users to official portals and offices; do not impersonate or automate government applications without an authorized integration.
9. Allow service information to change without rewriting core application logic.

## 4. Primary User Journey

1. User browses or searches for a service.
2. User opens the service overview, eligibility, requirements, procedure, fees, timelines, offices, official links, and sources.
3. User provides only context needed for conditional rules, such as age category, location, or service-specific circumstances.
4. User creates a personal service task and receives a checklist.
5. User marks each item as not reviewed, available, missing, needs verification, update required, in progress, completed, or not applicable where the verified rule permits it.
6. User opens a missing prerequisite as a nested task without losing parent progress.
7. User reviews and completes the prerequisite workflow.
8. The application returns to the parent task and recalculates requirements using the applicable rule version.
9. When mandatory requirements are resolved, the application displays the official application process and links.
10. User records submission date, optional reference details, status, appointment information, notes, and actual completion date.
11. The application shows an estimated completion date or range only when an applicable published processing-time rule supports it.

## 5. MVP Scope

### Included

- Small, verified catalogue of central and Tamil Nadu services.
- Service detail pages covering eligibility, requirements, procedures, official links, fees, timelines, offices, sources, and verification dates.
- Personal interactive checklists with explicit state transitions and persistence.
- Mandatory, conditional, alternative, optional, and permitted-not-applicable requirements.
- Bounded nested prerequisite tasks with cycle validation and preserved parent progress.
- Manual application tracking and official tracking links.
- Separate fee categories and unavailable-value handling.
- Responsive desktop, tablet, and mobile UI using browser-native technologies only.
- Translation-ready UI architecture, with Tamil content added only after review.
- Independent-service disclaimer and source attribution.

### Excluded from the First Release

- Automatic submission to government portals.
- Live application-status retrieval without an authorized official integration.
- Aadhaar biometrics, fingerprints, iris scans, OTPs, government passwords, or authentication secrets.
- Routine storage of Aadhaar/PAN numbers or complete identity-document images.
- Unverified offices, fabricated maps, or unsupported service capabilities.
- All-India coverage of every government service.
- Background notifications before consent, retention, and delivery are designed.
- Unnecessary microservices, scraping infrastructure, or frontend frameworks.

## 6. Government-Service Research and Verification

Candidate initial services, pending official-source review:

- Passport application or renewal through Passport Seva/MEA sources.
- PAN application through Income Tax Department and officially authorized channels.
- One UIDAI enrolment or update workflow after confirming the exact current rules.
- Tamil Nadu income certificate through the official Tamil Nadu service channel.
- Tamil Nadu community certificate through the official Tamil Nadu service channel.
- Tamil Nadu nativity/residence certificate only if current jurisdiction and requirements are clear.

These are research candidates, not verified production facts. Before any service is published, record:

- Official service name and responsible department.
- Geographic jurisdiction and applicant categories.
- Eligibility and conditional rules.
- Required documents, accepted alternatives, exceptions, and update requirements.
- Online and offline procedures.
- Official application and tracking URLs.
- Government fee, authorized service charge, delivery/postage charge, and other documented costs separately.
- Published processing time, applicability, exclusions, and calendar-day/business-day semantics.
- Relevant service-capable offices or centres.
- Source title, publisher, URL, verification date, reviewer, content version, and uncertainty notes.

Use official portals, department notices, published fee schedules, service standards, and authorized directories as primary sources. Do not copy earlier candidate document lists or URLs into production without rechecking them. If information cannot be verified, store it as unavailable or requiring verification. Do not make production behaviour depend on unreliable scraping; investigate terms, APIs, rate limits, and authorized datasets first.

## 7. Dependency and Nested-Task Model

Use configurable requirement expressions rather than service-specific code:

- `ALL`: every child requirement must be satisfied.
- `ANY`: at least one accepted alternative must be satisfied.
- `CONDITIONAL`: applies only when a verified condition matches applicant context.
- `OPTIONAL`: informational and non-blocking.
- `NOT_APPLICABLE_ALLOWED`: user resolution allowed only when the service rule permits it.

Conditions use a constrained typed representation of field, operator, and value. Never evaluate arbitrary user-provided code.

A requirement may link to a document type or another service prerequisite. Alternative documents belong to an explicit alternative group. A user service task contains user ID, service ID, parent task ID, root task ID, status, context snapshot/version, and progress metadata. Checklist items belong to a task and a requirement version.

When a child prerequisite changes, update the user document/task state and recalculate affected parent requirements. Parent readiness must still consider every other mandatory unresolved item. Validate dependency graphs before publication, reject cycles, bound nesting depth, and prevent duplicate active child tasks for the same user and context.

## 8. UI and Navigation

- Home/dashboard: active tasks, next actions, missing requirements.
- Browse services: search, category, jurisdiction, and saved services.
- Service detail: overview, eligibility, requirements, procedure, fees, timelines, offices, links, and sources.
- Checklist/task view: statuses, explanations, alternatives, unresolved conditions, and nested-task actions.
- Task history: parent/child hierarchy and completion state.
- Applications: statuses, submission dates, appointments, notes, tracking links, and estimates.
- Offices: service-filtered offices, source, address, capabilities, booking note, and directions link.
- Documents: minimal availability/verification records without requiring numbers or images.
- Settings/privacy: language, consent, export/deletion, and disclaimer.

The frontend uses semantic HTML, responsive CSS, progressive enhancement, native form validation, keyboard navigation, visible focus, accessible labels, reduced-motion support, and text status badges. Vanilla JavaScript modules use `fetch` for JSON APIs and handle loading, empty, validation, authorization, and error states. The frontend never connects to MySQL and contains no database credentials.

## 9. Proposed Project Structure

These paths are proposed for implementation.

### Frontend

- `frontend/index.html` and additional page entry points if needed.
- `frontend/css/` for reset, design tokens, layout, components, responsive rules, and accessibility.
- `frontend/js/api/` for REST client modules.
- `frontend/js/state/` for temporary client state.
- `frontend/js/pages/` for page controllers.
- `frontend/js/components/` for reusable rendering and interaction modules.
- `frontend/js/i18n/` for English/Tamil message dictionaries.
- `frontend/assets/` for reviewed assets.

### Backend

- `backend/pom.xml` for Maven configuration.
- `backend/src/main/java/.../GovGuideApplication.java` for the entry point.
- `.../config/` for CORS, security, Jackson, database, and application configuration.
- `.../controller/` for REST resources.
- `.../service/` for business workflows and dependency evaluation.
- `.../repository/` for persistence access.
- `.../entity/` for JPA entities.
- `.../dto/` for request/response contracts.
- `.../mapper/` for DTO/entity mapping where needed.
- `.../validation/` for input and content validation.
- `.../exception/` for consistent API errors.
- `.../security/` for authentication and authorization.
- `.../content/` for validated service data import/maintenance.
- `backend/src/main/resources/db/migration/` for Flyway or Liquibase migrations.
- `backend/src/test/` for unit, integration, repository, security, and API tests.

## 10. REST API Boundary

Example versioned endpoints:

- `GET /api/v1/services`
- `GET /api/v1/services/{serviceId}`
- `POST /api/v1/tasks`
- `GET /api/v1/tasks/{taskId}`
- `PATCH /api/v1/tasks/{taskId}/checklist-items/{itemId}`
- `POST /api/v1/tasks/{taskId}/children`
- `POST /api/v1/applications`
- `PATCH /api/v1/applications/{applicationId}`
- `GET /api/v1/offices?serviceId=...&district=...`
- `GET /api/v1/sources/{sourceId}`

Controllers handle HTTP concerns only. Services enforce workflow rules, state transitions, dependency evaluation, estimates, and transactions. Repositories are the only persistence access layer. Use DTOs rather than exposing entities. Return stable JSON error codes and field-level validation details. Restrict CORS to approved frontend origins and require HTTPS outside local development.

## 11. Database Design

Use MySQL/InnoDB, foreign keys, unique constraints, timestamps, versioning, and indexes. Keep general reference content separate from private user progress.

### Reference and Content Tables

- `government_service`: slug, jurisdiction, department, category, status, content version.
- `service_localization`: localized names and plain-language content.
- `document_type`: canonical code, issuing authority, localized labels.
- `service_requirement`: service/version, kind, expression root, blocking flag, display order.
- `requirement_node`: ALL/ANY/conditional structure and typed condition values.
- `requirement_document`: requirement-node/document relationships.
- `accepted_alternative_group`: explicit alternative sets.
- `document_dependency`: prerequisite relationships with version metadata.
- `fee_information`: category, amount/range, currency, applicability, source.
- `processing_time_information`: lower/upper duration, unit, applicability, exclusions, source.
- `official_source`: URL, publisher, title, verification date, status, notes.
- `service_source`: service/source many-to-many relationship.
- `government_office`: identity, type, jurisdiction, address, reliable coordinates, booking information, source.
- `service_office`: verified service capability by office.

### User Tables

- `user`: minimal account identity and profile fields.
- `user_credential` or external identity table.
- `user_document_record`: user, document type, possession/verification state, notes, timestamps.
- `user_service_task`: user, service, parent/root task, status, context version, timestamps.
- `user_checklist_item`: task, requirement version, state, resolution note, timestamps.
- `application_tracking_record`: user/task, status, submission date, appointment, optional reference data, estimated range, completion date, notes.
- `reminder`: deferred until consent and delivery requirements are approved.

Index service slugs/status, requirement service/version, task user/status, checklist task, application user/status, office jurisdiction, and source verification date. Use optimistic locking or equivalent conflict handling. Soft-deactivate or version government content so existing checklists remain interpretable after updates.

## 12. Fees, Timelines, and Tracking

Represent government fee, authorized service charge, delivery/postage, and other documented costs separately. Show a total only when all applicable components are known. Unknown fees are unavailable, not zero.

Application tracking may support planning, preparing documents, ready to apply, submitted, appointment scheduled, additional information required, under review when user-confirmed, approved, rejected, document issued/received, and completed. Allowed transitions should be service-specific. The system must not claim live status without an authorized official integration.

Estimated completion dates derive from a stored processing-time rule version, submission date, applicable service/category context, and documented calendar semantics. Missing, expired, ambiguous, or inapplicable rules return unavailable with an explanation rather than a guessed date. Estimates are ranges where appropriate and are never guarantees.

## 13. Office Discovery

Start with manual district, city, town, or PIN-code selection. Request browser geolocation only after explicit permission and preserve a working manual fallback. Return only offices with source-backed capability for the selected service; never infer capability from proximity or generic office type.

Store office source and verification metadata. Prefer outbound directions links over storing precise user location. Select any map/geocoding provider only after reviewing licensing, attribution, rate limits, API keys, privacy, caching, and cost. Do not seed fabricated locations.

## 14. Security and Privacy

Public read-only service browsing may be available without an account. Require authentication for persisted cross-device user records unless an explicitly reviewed local-only mode is retained. Use Spring Security, Argon2id or BCrypt, secure session management, and no custom cryptography.

Controls required:

- Server-side DTO validation and allowlisted state transitions.
- Parameterized ORM/repository queries against SQL injection.
- Per-user authorization on every private record query and mutation.
- No entity exposure or mass assignment.
- Secrets in environment/secret management only, never frontend code or source control.
- Secure cookies or carefully designed tokens, CSRF protection for cookie authentication, authentication rate limiting, and security audit logging.
- Minimal collection, retention limits, account deletion, and data export planning.
- No Aadhaar biometrics, OTPs, government passwords, fingerprints, iris data, or unnecessary identity numbers/images.
- Clear privacy notice, independent-service disclaimer, source attribution, and official-link handling.

## 15. Tools and Dependencies to Confirm

Before implementation, select a supported LTS JDK, Maven or Gradle, Spring Boot version, MySQL version, migration tool such as Flyway or Liquibase, JUnit 5/Spring test tooling, browser end-to-end testing tooling, formatting/static analysis, dependency vulnerability scanning, and API documentation tooling. Do not install anything until the approved setup is confirmed.

## 16. Phased Delivery

### Phase 1: Project Structure, UI Shell, and Verified Content

Deliverables:

- Spring Boot skeleton and vanilla frontend directory.
- Responsive accessible shell, disclaimer, catalogue placeholder, and error/loading states.
- Content schema, source-verification template, and research dossier.

Dependencies: approved tools and official-source access.

Acceptance criteria:

- Frontend works on desktop, tablet, and mobile without frameworks.
- No frontend database access exists.
- Every published fact has source metadata or is marked unavailable.
- Backend health endpoint and API boundary are documented if backend work begins.

### Phase 2: Interactive Checklist and Local Prototype

Deliverables:

- Service detail and checklist screens.
- Vanilla JavaScript state handling and documented prototype persistence decision.
- Accessible status transitions and explanations.

Dependencies: Phase 1 content contract and UI shell.

Acceptance criteria:

- User selects a service, reviews requirements, marks states, and sees readiness recalculated.
- Alternatives and conditional requirements are visible.
- Possession does not automatically mean validity or sufficiency.

### Phase 3: Spring Boot and MySQL Integration

Deliverables:

- Versioned migrations and normalized reference/user tables.
- DTO-based REST endpoints, repositories, services, validation, errors, and authorization foundation.
- Frontend API client connected to backend.

Dependencies: Phase 1 data contract; Phase 2 UI may integrate incrementally.

Acceptance criteria:

- Frontend reaches MySQL only through backend APIs.
- Private records pass user-isolation tests.
- Clean database migrations and integration tests succeed.

### Phase 4: Dependencies and Nested Tasks

Deliverables:

- Condition/alternative evaluator with bounded recursion and cycle validation.
- Parent/child task creation, navigation, completion, and recalculation.
- Invalid content-graph validation.

Dependencies: Phase 3 persistence and authorization.

Acceptance criteria:

- Missing prerequisites, alternatives, conditions, remaining parent requirements, duplicate tasks, and cycles are handled safely.
- Completing a child never resets parent progress.

### Phase 5: Tracking, Fees, and Timelines

Deliverables:

- Manual tracking and service-specific status transitions.
- Source-backed fee breakdown and processing-time calculation.
- Official tracking links and privacy-conscious reference handling.

Dependencies: Phase 3 user/task persistence; Phase 4 recommended.

Acceptance criteria:

- User records submission and completion information.
- Unsupported values display unavailable.
- Estimates use only applicable published rules and are labelled non-guaranteed.

### Phase 6: Offices and Justified Enhancements

Deliverables:

- Manual office search, capability filtering, source metadata, and directions links.
- Optional permission-based geolocation with fallback.
- Reviewed Tamil translations, accessibility hardening, and only separately approved reminders/integrations.

Dependencies: verified office data, provider decision, and translation review.

Acceptance criteria:

- Denied location permission does not block manual search.
- Listings distinguish service-capable offices from general information offices.
- No unsupported provider claims or fabricated locations appear.

## 17. Prioritized Implementation Tasks

### T001 - Confirm Project Toolchain

Objective: choose supported JDK, Spring Boot, build tool, MySQL, migration, testing, and browser tooling.

Dependencies: plan approval.

Expected areas: root build configuration and development documentation.

Acceptance criteria: reproducible local prerequisites and clean build instructions.

Tests: build and empty-context test.

### T002 - Establish Source Research and Content Contract

Objective: define service/document/requirement/source formats and verify the smallest initial service set.

Dependencies: T001 and official-source review.

Expected areas: content schema, seed/import data, research records.

Acceptance criteria: every actionable requirement has explicit evidence status, source provenance, applicability, and source references; unverified, conflicting, outdated, staff-reported, and unavailable claims remain non-publishable.

Tests: content validation tests.

Status: COMPLETE for the source-provenance contract, validation rules, and research ledger. Instant e-PAN remains `REVIEW` / `LIMITED_ROUTE_CANDIDATE`; Passport Seva research remains unpublished until category-specific evidence and office data are independently normalized.

### T003 - Build Responsive Vanilla Frontend Shell

Objective: create semantic pages, responsive CSS, navigation, disclaimer, and reusable rendering modules.

Dependencies: T001 and T002.

Expected areas: `frontend/index.html`, `frontend/css/`, `frontend/js/`.

Acceptance criteria: usable desktop/tablet/mobile shell without a frontend framework.

Tests: browser smoke, keyboard, and accessibility checks.

Status: COMPLETE for the responsive vanilla shell, service catalogue discovery, source-aware service details, loading/empty/error states, and keyboard-accessible navigation. Public catalogue, detail, health, and unavailable-office API checks were verified live; authenticated task persistence remains unverified because no APP_AUTH_USERS account is configured in the running environment.

### T004 - Create Spring Boot API Foundation

Objective: establish packages, configuration, DTO conventions, errors, and health endpoint.

Dependencies: T001.

Expected areas: `backend/pom.xml`, `backend/src/main/...`.

Acceptance criteria: application starts with environment configuration and no committed secrets.

Tests: context-load and API error tests.

### T005 - Add MySQL Schema and Migrations

Objective: implement content and user/task tables with keys, constraints, versions, and indexes.

Dependencies: T002 and T004.

Expected areas: migration, entity, and repository packages.

Acceptance criteria: clean database migration and documented version policy.

Tests: migration and repository integration tests.

Status: COMPLETE. A fresh dedicated `govguide_t005_test3` database applied Flyway V1-V3 successfully and passed the guarded migration assertions; the forward-only migration/version policy is documented in DEVELOPMENT.md.

### T006 - Implement Service Catalogue and Checklist APIs/UI

Objective: connect service details and checklist flows through REST APIs.

Dependencies: T003 and T005.

Acceptance criteria: Scenario A and basic status persistence pass.

Tests: API integration and browser tests.

Status: COMPLETE. Live isolated browser verification confirmed catalogue loading, service details, authentication prompt and sign-in, checklist creation, status updates, progress recalculation, and READY_TO_APPLY state. Existing content has no conditional or alternative requirements to exercise in this scenario.

### T007 - Implement Dependency Evaluator and Content Validation

Objective: evaluate conditions/alternatives and reject cycles or malformed rules.

Dependencies: T002 and T005.

Acceptance criteria: Scenarios C, D, and J pass deterministically.

Tests: comprehensive evaluator and validation unit tests.

Status: COMPLETE. Focused evaluator and publication-validation tests pass for typed conditions, ALL/ANY expressions, alternatives, malformed references, cycles, and bounded dependency depth. Current published catalogue content remains source-safe and review-limited.

### T008 - Implement Nested Task Workflow

Objective: create bounded child tasks, preserve parent context, and recalculate readiness.

Dependencies: T006 and T007.

Acceptance criteria: Scenarios B and H pass.

Tests: transaction, authorization, integration, and end-to-end tests.

Status: COMPLETE. Focused nested-workflow tests verify parent/child relationships, preserved parent progress, child completion and return navigation, duplicate prevention, conditional and alternative dependencies, circular navigation rejection, and ownership isolation.

### T009 - Add Authentication and Authorization

Objective: protect user-owned records and enforce per-user access.

Dependencies: T004 and T005; authentication decision.

Acceptance criteria: Scenario I passes and sensitive values are not logged.

Tests: authentication, authorization, session, and negative tests.

Status: COMPLETE. BCrypt-backed APP_AUTH_USERS authentication, stateless HTTP Basic protection, public catalogue access, per-user task isolation, consistent 401/403 handlers, and frontend in-memory credential handling are covered by focused security tests and JavaScript syntax verification.

### T010 - Add Application Tracking and Estimates

Objective: record statuses, dates, notes, official links, fees, and supported timeline ranges.

Dependencies: T006 and T009; T007 for rule applicability.

Acceptance criteria: Scenarios E and F pass; estimates are clearly labelled.

Tests: calculation, API, and UI tests.

Status: COMPLETE for the documented in-memory scope. In-memory checklist progress, qualified estimate presentation, and authenticated application tracking are covered by Java tests, live API checks, and browser verification. All tracking state is lost when the backend restarts; durable persistence remains outside T010's current storage scope.

### T011 - Add Office Discovery

Objective: provide verified service-capable office search with manual selection and optional geolocation.

Dependencies: verified office data and provider decision.

Acceptance criteria: Scenario G passes and unsupported capabilities are not shown.

Tests: API filtering, permission-denied browser test, and data validation.

Status: COMPLETE for source-safe manual office discovery and permission-only geolocation fallback. No office listings are published because the current catalogue contains no verified office source; the API reports this as unavailable rather than fabricating results.

### T012 - Localization, Accessibility, and Release Hardening

Objective: review English/Tamil message architecture, add reviewed Tamil content, security checks, documentation, and deployment configuration.

Dependencies: core workflows and translation review.

Acceptance criteria: responsive, accessibility, security, and regression suites pass.

Tests: full automated suite and manual accessibility review.

### T013 - Add Durable User Workflow Persistence

Objective: persist authenticated user tasks, parent-child relationships, checklist states, and application-tracking records in MySQL while preserving the existing API contracts and JSON-authoritative reference content.

Dependencies: T004, T005, T006, T008, T009, and T010.

Scope: keep `APP_AUTH_USERS` and Spring Security's in-memory authentication; pre-provision immutable `app_user` rows for configured usernames; add forward-only Flyway migrations after V3; persist tasks, checklist states, and tracking records with per-user authorization, service-version integrity, transactions, and optimistic locking. Reminders, document-possession records, office persistence, and database-backed credentials remain out of scope.

Acceptance criteria: authenticated users can create, retrieve, update, and recover tasks, checklist states, and tracking records after restart; multiple tasks for one user and service remain supported; parent/root/dependency relationships, cycle/depth checks, progress, readiness, tracking transitions, date validation, URL validation, and provenance labels remain unchanged; users cannot access another user's records; stale writes cannot silently overwrite newer state; the default database-free profile and JSON content authority remain available.

Tests: clean V4 migration and Flyway validation, repository and service tests, restart recovery, cross-user authorization, optimistic-lock/concurrency, nested-task and checklist regressions, tracking regressions, and public-catalogue regression tests.

Status: IN PROGRESS. Approved scope; implementation requires an approved database environment and pre-provisioned `app_user` rows before durable-profile verification.

## 18. Testing Strategy and Acceptance Scenarios

Unit tests cover condition operators, ALL/ANY evaluation, alternatives, status transitions, date ranges, fee aggregation, cycle detection, duplicate tasks, and content validation.

Integration tests cover migrations, DTO validation, repositories, relationships, authentication, authorization, transactions, and checklist/task updates.

End-to-end scenarios:

- A: all documents available reaches ready-to-apply.
- B: missing prerequisite opens a child task and returns with parent progress preserved.
- C: conditional requirement appears only when applicable.
- D: accepted alternative satisfies a requirement.
- E: changed service content can be published without rewriting workflow code.
- F: unavailable fees/timelines are not invented.
- G: denied location permission still permits manual office search.
- H: parent remains unresolved while another mandatory item remains unresolved.
- I: one user cannot read or modify another user’s private records.
- J: cyclic dependency content is rejected or safely prevented from endless task generation.

Also test responsive layouts, keyboard navigation, screen-reader labels, reduced motion, invalid input, expired sessions, API failures, and official outbound links.

## 19. Risks, Assumptions, and Decisions Required

1. Select supported JDK, Spring Boot, build tool, migration tool, and MySQL version.
2. Decide whether Phase 2 local state is temporary or supported product functionality.
3. Decide authentication approach and whether accounts are required for the first end-to-end slice.
4. Finalize the initial service set only after official-source research.
5. Choose normalized requirement nodes versus constrained JSON expressions for authoring and querying.
6. Review government-data automation terms, API availability, rate limits, and change detection before automation.
7. Select office/map provider only after licensing, privacy, attribution, cost, and official data review.
8. Decide English-only first release versus reviewed English/Tamil release.
9. Complete Indian privacy, retention, consent, and security review before collecting account/tracking data.
10. Avoid inferring requirements, fees, timelines, office capabilities, or URLs from unofficial sources.

## 20. Verified Information Status

The T002 evidence ledger records source-backed Instant e-PAN claims verified on 2026-10-22, while the service remains `REVIEW` / `LIMITED_ROUTE_CANDIDATE` pending publication approval. Passport Seva research is recorded as unpublished evidence; category-specific fees, document combinations, Tatkaal exclusions, and office records remain unresolved. Before publication, each fact requires an official source title, publisher, URL, verification date, reviewer, applicability, content version, and uncertainty record.

## 21. Plan Approval Boundary

This document is a plan only. It does not authorize government-portal automation, unsupported scraping, source-code implementation, dependency installation, or production deployment until the architecture gates and initial research are approved.
