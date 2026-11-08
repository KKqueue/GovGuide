# Content Validation Rules

T005 uses two validation layers:

- MySQL/Flyway constraints enforce row-local invariants, foreign-key integrity, unique identifiers, allowed classifications, typed scalar values, exactly-one dependency targets, and the presence of a condition reference on conditional dependencies.
- `ContentPublicationValidator` enforces cross-row publication rules that MySQL cannot safely express: source evidence for verified requirements/fees/timelines/current links, meaningful verified fee/timeline values, structured condition values, same-service dependency ownership, dependency target semantics, and explicit condition-field/operator allowlists.

Content is publishable only when both layers pass. `UNVERIFIED`, `NEEDS_REVIEW`, `SUPERSEDED`, and unavailable values must remain non-publishable unless a later approved workflow explicitly resolves them.

## Source provenance and claim evidence

Every catalogue source declares one `sourceCategory`: `OFFICIAL_GOVERNMENT`, `AUTHORIZED_SERVICE_PROVIDER`, `INDEPENDENT_CORROBORATED`, `INDEPENDENT_UNVERIFIED`, `STAFF_REPORTED`, or `UNKNOWN_OR_UNAVAILABLE`. The category records provenance; it is not proof that a claim is true. Sources also declare a verification status such as `VERIFIED`, `NEEDS_REVIEW`, `UNVERIFIED`, `CONFLICTING`, `OUTDATED`, `SUPERSEDED`, or `UNAVAILABLE`.

Claims and requirements use `evidenceStatus`. `VERIFIED` claims must reference at least one verified government or authorized-provider source. `CORROBORATED` claims must reference at least two sources and remain distinct from official requirements. Unverified, staff-reported, conflicting, outdated, and unavailable evidence cannot satisfy an approved mandatory requirement. Source metadata should include the title, publisher, URL or document reference, last-checked date, evidence excerpt or summary, applicability, limitations, and reuse policy where available.

The validator checks references, statuses, provenance, source identity, and publication eligibility. It cannot determine whether an evidence excerpt semantically proves the exact claim, whether two sources reproduce the same underlying material beyond their recorded identity, or whether applicant conditions match a source's full legal scope. Those checks remain a documented manual review step before publication.

The database does not execute condition expressions. Conditions are limited to allowlisted field names, operators, and typed scalar or set values. `IN_SET` values are stored as ordered rows in `requirement_condition_value`; arbitrary code or unrestricted expressions are not supported.

Historical reference content must be deactivated or superseded. Foreign keys use restrictive deletion behavior so referenced content cannot be silently removed.

T007 owns dependency evaluation and content-graph validation. `DependencyEvaluator` supports allowlisted applicant/workflow conditions, typed comparisons, `ALL`, `ANY`, and conditional expressions. `DependencyGraphValidator` rejects unknown targets, self-cycles, multi-node cycles, and chains deeper than the configured bound. `ContentGraphValidator` validates cross-record service, requirement, condition, alternative, and source references before publication. Creating validator classes does not guarantee invocation; publication and import workflows must call these rules before content is published.
