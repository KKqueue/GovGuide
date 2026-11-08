# Government Guide Companion development

## Prerequisites

- Windows with JDK 21. The project is compiled and tested with `C:\Program Files\Java\jdk-21`.
- Maven Wrapper 3.9.14 (provided in `backend\mvnw.cmd`; no system Maven installation is required).
- Node.js only for the frontend syntax check.
- MySQL is optional for the default profile. Do not enable the `db` profile unless a dedicated test database is configured.

## Verify the toolchain

Run these commands from PowerShell at the repository root. The assignments are process-local and do not change global environment settings.

```powershell
$env:JAVA_HOME = 'C:\Program Files\Java\jdk-21'
$env:MAVEN_OPTS = '-Duser.home=C:\Users\mahav'
$env:Path = "$env:JAVA_HOME\bin;" + $env:Path

& "$env:JAVA_HOME\bin\java.exe" -version
& "$env:JAVA_HOME\bin\javac.exe" -version
Push-Location backend
.\mvnw.cmd -version
Pop-Location
```

`JAVA_HOME` must point to the JDK directory itself, without a trailing space. The Maven user-home override is needed in restricted development environments where the process cannot write the default user-home location.

## Build and test

With the variables above set:

```powershell
Push-Location backend
.\mvnw.cmd test
Pop-Location
```

If dependency resolution must be completely offline and the required artifacts are already cached, use:

```powershell
Push-Location backend
.\mvnw.cmd -o test
Pop-Location
```

Do not delete the Maven cache to resolve permission errors. If Maven reports an `AccessDeniedException` while writing cache metadata, inspect the ACL for the reported path and use an approved Maven user home or an offline build.

The frontend syntax check is:

```powershell
node --check frontend/js/app.js
```

## Run the database-free backend

Check that port 8080 is free before starting. From `backend`:

```powershell
.\mvnw.cmd -o spring-boot:run
```

Do not activate the `db` profile for the database-free run. Once startup logs report Tomcat on port 8080, verify the health endpoint:

```powershell
Invoke-WebRequest -UseBasicParsing http://127.0.0.1:8080/api/v1/health
```

Stop only the application process started for the check, then confirm port 8080 is released.

## Configuration and secrets

The default profile reads content from `../content/services` and does not connect to MySQL. Authentication users, CORS origins, and database settings are supplied through environment variables or the opt-in database profile. Do not commit passwords, BCrypt hashes, tokens, or database credentials.

## Database schema and migration policy

The database profile is opt-in. The default profile remains database-free and continues to use the versioned JSON files under `content/services` as the authoritative source for government-service reference content. The Flyway migrations currently provide a normalized reference-content schema for explicitly configured database environments; they do not make MySQL the runtime content authority and they do not create user, task, checklist, authentication, tracking, or office tables.

Migrations are forward-only:

- Never edit or rename a migration after it has been applied to any database.
- Add a new versioned migration for every schema correction or additive change.
- Run Flyway validation before migration and treat checksum differences as a release-blocking problem requiring investigation.
- Keep reference-content versions immutable. Corrected government content receives a new content version and is explicitly superseded; existing user workflows must retain the version they were created against until a reviewed migration path exists.
- Do not use destructive `DROP`, reset, or repair operations against an unidentified, shared, production, or personal database.

When a migration fails, stop the deployment, preserve the failure details, and inspect the Flyway history and database state. Recover by restoring from an approved backup or by applying a reviewed forward migration after the cause is understood. Do not delete Flyway history or rewrite an applied migration to make a later run pass.

Before any migration run, identify the environment and database explicitly, verify the JDBC catalog, confirm that the credentials are supplied outside source control, and use a dedicated empty database for clean-install tests. Backups and restore procedures are environment responsibilities and must be verified before production changes. The T005 integration test enforces the `govguide_t005_*` database-name prefix, exact JDBC catalog match, and empty-database precondition before it can run.

The V1-V4 migrations should be tested as a clean sequence and then validated again without changes. Resource-level tests confirm that the migration files are present and contain expected definitions, but they are not evidence that MySQL execution succeeded.

## Durable user workflow persistence (T013)

T013 adds a forward-only migration after V3 for pre-provisioned `app_user` rows, user-owned tasks, checklist states, and application-tracking records. `APP_AUTH_USERS` remains the authentication source; an authenticated username maps to an immutable `app_user` row and is never automatically created during a request. Private records are queried by that stable user identifier. Task and tracking identifiers remain UUID-compatible with the existing API, service-version and requirement relationships are enforced by foreign keys, and optimistic locking rejects stale writes. The default profile remains database-free; durable behavior requires the opt-in `db` profile, approved database credentials, and pre-provisioned users. JSON under `content/services` remains authoritative for reference content. Reminders, document-possession records, office persistence, and database-backed credentials remain out of scope.

Before enabling the `db` profile, an operator must apply the approved V4 migration to the intended database, compare the configured `APP_AUTH_USERS` usernames with `app_user.username`, and insert one enabled `app_user` row for each configured username through the approved database change process. The application does not copy passwords or BCrypt hashes into MySQL and does not create missing rows during requests. The username-to-row mapping must be checked before testing or release.

## English localization foundation (T012)

The frontend uses a dependency-free, English-only message catalog at `frontend/js/i18n/messages.en.js` and a small lookup/rendering module at `frontend/js/i18n/index.js`. English is the default and only enabled locale in this foundation. Missing keys are detectable during development, return a safe user-facing fallback, and must be added to the English catalog before a future locale is introduced.

Reviewed English presentation labels, including headings, validation copy, and labels for machine statuses or evidence classifications, may be stored in the UI message catalog. These labels describe how information is presented; they do not verify or approve the underlying information. Evidence-controlled government content—including claims, requirements, eligibility, fees, processing estimates, source excerpts, and office information—remains governed by the content verification and publication workflow and must not be treated as approved merely because it has an English label. Machine/API values and user-provided content, including notes, links, and credentials, must not be translated or mutated by the UI catalog. Authorization headers and other sensitive values remain outside the catalog. Translated text is rendered with `textContent` or safe DOM attribute setters; interpolation is plain text and must never be used as HTML.

Future Tamil content requires reviewed translations, terminology review for accessibility and legal meaning, and regression checks for every dynamic status, validation, error, and live-region message. No Tamil catalog or language selector is enabled by this change. The dependency-free localization checks can be run with `node --test frontend/js/i18n/index.test.js` together with `node --check` for each changed JavaScript module.

## Application tracking (T010)

Authenticated users can attach one in-memory application-tracking record to each owned checklist task through the `/api/v1/applications` endpoints. Records accept user-recorded statuses, optional submission, appointment, and completion dates, notes, and HTTP/HTTPS links. Status transitions and date ordering are validated by the service. A tracking link is labelled `USER_PROVIDED_UNVERIFIED`; the application does not assert government provenance or official submission status. Tracking state is intentionally held in process memory for the current T010 scope and is lost when the backend restarts. Durable tracking persistence is deferred and must not be added through the reference-content migrations.
