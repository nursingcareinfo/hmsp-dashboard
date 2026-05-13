---
description: View and validate environment variables and configuration
agent: devops
subtask: false
---
Environment and configuration inspector.

Usage: /env [variable]

Without args: List all VITE_* environment variables (values masked for security).
With variable name: Show specific variable value (if not secret).

Examples:
  /env                    # list: VITE_SUPABASE_URL ✓, VITE_GEMINI_API_KEY ✓, VITE_SUPABASE_ANON_KEY ✓
  /env VITE_SUPABASE_URL  # show full URL
  /env GEMINI_API_KEY     # show (masked) — ⚠️ This is GitHub secret, not local VITE_ var

What it checks:
- Presence of required VITE_* variables at runtime
- Build-time env vars (via import.meta.env)
- GitHub Actions secret mapping (for deploy troubleshooting)
- .env.local file existence and format

Validation:
  ✓ VITE_SUPABASE_URL        must be valid URL (https://xxx.supabase.co)
  ✓ VITE_SUPABASE_ANON_KEY   must be non-empty string (starts with eyJ...)
  ✓ VITE_GEMINI_API_KEY      Google AI key format (AIzaSy...)

Common issues:
  "undefined" → Missing from build env (check GitHub Secrets or local .env.local)
  Empty string → Secret exists but value is blank in repo settings
  Wrong key format → Copy-paste error, extra quotes, or truncated

Fix workflow:
  1. Local: Update .env.local → restart dev server
  2. GitHub: Add/update secret → redeploy via /deploy
  3. Rebuild: npm run build (check env var presence)

Note: This command only reads import.meta.env at runtime. It cannot read GitHub Secrets directly.

Related: /status, /deploy
