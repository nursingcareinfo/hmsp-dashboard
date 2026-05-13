---
description: View application logs — dev server, errors, Supabase queries
agent: devops
subtask: true
---
Log viewing and debugging utilities.

Usage: /logs <action> [options]

Actions:
  dev           Tail Vite dev server logs (HMR, errors) — requires running dev server
  errors        Show recent console errors from browser session
  supabase      Show recent Supabase query logs (requires RLS inspection)
  clear         Clear local storage, reset app state (dev only)
  network       Show network requests from last page session (requires browser attached)

Examples:
  /logs dev              # tail dev server stdout/stderr
  /logs errors           # show last 20 console errors
  /logs supabase         # show failed RLS queries
  /logs clear            # clear localStorage (keeps auth session)
  /logs network          # recent API calls to Supabase

Notes:
- Use /logs clear if UI is stuck or corrupted state
- Supabase logs show query execution time, row counts, and RLS policy rejections
- Dev logs show HMR updates, module reloads, and build errors

Combined with:
  /status      for current app state
  /debug       for deep debugging sessions
