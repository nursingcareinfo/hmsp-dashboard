# Kilo Commands — HMSP Dashboard

Quick reference for all `/` commands available in this project.

## Development

| Command | Agent | Description |
|---|---|---|
| `/dev` | code | Start Vite dev server (port 3000) |
| `/build` | code | Build + type-check for production |
| `/typecheck` or `/tc` | code | TypeScript check only (no build) |
| `/status` | code | Full app health report |
| `/env` | devops | List VITE_* environment variables |
| `/logs` | devops | Tail dev logs, view errors |

## Database

| Command | Agent | Description |
|---|---|---|
| `/db` | database | Supabase operations (push, reset, new migration) |
| `/seed` | database | Seed test data (staff, patients) |

## Deployment

| Command | Agent | Description |
|---|---|---|
| `/deploy` | devops | Deploy to GitHub Pages |
| `/deploy workflow` | devops | Trigger GitHub Actions (default) |
| `/deploy manual` | devops | Local build + push to gh-pages |

## Staff Management

| Command | Agent | Description |
|---|---|---|
| `/staff` | frontend | Bulk status operations, list with filters |
| `/staff-manual` | frontend | Detailed edit, verify, export staff data |

## AI/OCR

| Command | Agent | Description |
|---|---|---|
| `/ai` | ai-ocr | Manage Gemini/Groq models, check quota |
| `/ai test` | ai-ocr | Test API connectivity |
| `/ai groq` | ai-ocr | Force Groq fallback |
| `/ai gemini` | ai-ocr | Switch back to Gemini |
| `/ai status` | ai-ocr | Show current model and quota |

## Feature Scaffolding

| Command | Agent | Description |
|---|---|---|
| `/feature` | fullstack | Scaffold new feature (CRUD, service, migration) |

---

**Configuration**: `.kilo/kilo.jsonc`
**Agents**: `.kilo/agent/*.md` (7 specialized agents)
**Skills**: `.kilo/skills/hmsp-dashboard/SKILL.md`
**Docs**: `.kilo/README.md`

To use: type `/command-name` in the Kilo chat. Example: `/dev` starts the dev server.
