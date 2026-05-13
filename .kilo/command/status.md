---
description: View application status, environment, and health checks
agent: code
subtask: false
---
Show HMSP Dashboard runtime status and environment info.

Usage: /status [section]

Sections:
  (none)        Full status report (all sections)
  env           Environment variables (VITE_* only — no secrets)
  supabase      Supabase connection health and table counts
  ai            Gemini & Groq API key presence and quota
  build         Last build info, dist folder size, deployed commit
  services      List all service layer files and their health

Examples:
  /status               # full report
  /status env           # check env vars only
  /status supabase      # DB connection test
  /status ai            # API keys check
  /status build         # build artifacts
  /status services      # service layer status

Output includes:
- App version (from package.json)
- React 19 version detected
- Vite mode (development/production)
- Supabase URL (masked)
- Gemini/Groq key presence (masked)
- Staff count, patient count, duty_assignments count
- Real-time subscription status
- Last deployment timestamp (from GitHub Actions)

Note: Never shows actual secret values — only presence check via import.meta.env.VITE_* existence.

Related: /deploy, /db status
