# GovGuide - Government Guide Companion

## Project Structure
- `backend/` — Java 21 + Spring Boot 3.5.16 API server (port 8081)
- `frontend-react/` — React 18 + Vite 6 + React Router 6 (port 3000)
- `content/services/` — Service JSON data files

## Running
- Backend: `cd backend && mvn spring-boot:run -- --server.port=8081`
- Frontend: `cd frontend-react && npm run dev`
- Vite proxies `/api` to `http://localhost:8081`

## Skills
The following skills are installed in `.claude/skills/`:

### Verification Before Completion (Superpowers)
Always verify work before claiming it's done. Run tests, check the browser, test edge cases.
Skill path: `.claude/skills/superpowers/skills/verification-before-completion/SKILL.md`

### Ponytail
Make the smallest change that fully solves the problem. No overengineering.
Skill path: `.claude/skills/ponytail/skills/ponytail/SKILL.md`

### Security Audit (Cloudflare)
Source-first security review. Find real vulnerabilities, not theoretical ones.
Skill path: `.claude/skills/security-audit-skill/skills/security-audit/SKILL.md`

## Development Rules
1. **Test before claiming done** — Open the browser, test the feature, check edge cases
2. **Smallest change wins** — Don't refactor surrounding code, don't add abstractions
3. **Check all data** — Verify across ALL services (137), not just the first few
4. **Think like the user** — Test on laptop viewport (1920x1080), try wrong inputs, click things twice
5. **Security matters** — Auth uses Basic auth + localStorage; be aware of the limitations
