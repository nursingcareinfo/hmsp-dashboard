---
description: Deploy to GitHub Pages (triggers workflow or manual build+push)
agent: devops
subtask: true
---
Deploy HMSP Dashboard to GitHub Pages.

Usage: /deploy [method]

Methods:
  workflow     Trigger GitHub Actions workflow (default, recommended)
  manual       Run local build then push dist/ to gh-pages branch

Examples:
  /deploy           # triggers workflow via gh CLI
  /deploy workflow  # same as above
  /deploy manual    # local build + manual push (requires gh CLI auth)

Workflow method:
  1. Pushes to `main` branch auto-trigger deployment via .github/workflows/deploy.yml
  2. Or use this command to manually trigger: `gh workflow run deploy.yml`
  3. Monitor: `gh run watch --workflow=deploy.yml`

Manual method (fallback):
  1. npm run build
  2. git add dist/ && git commit -m "chore: deploy"
  3. git push origin main

Notes:
- Build uses VITE_* environment variables from GitHub Secrets
- Secrets required: GEMINI_API_KEY, VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
- After deployment, site is live at https://nursingcareinfo.github.io/hmsp-dashboard/

Related: /build, /status
