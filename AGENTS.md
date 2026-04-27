# AGENTS.md - HMSP Dashboard

Compact instructions for agents working in this repository.

## Project Overview

HMSP Dashboard (Home Medical Services Provider) – A React + Vite + Supabase dashboard for healthcare staff management in Karachi, Pakistan. Features staff CRUD, patient records, document OCR via Gemini AI, finance ledger, and calendar/attendance.

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite 6, TailwindCSS 4
- **Backend**: Supabase (PostgreSQL)
- **AI**: Google Gemini API (gemini-flash-latest) for document OCR
- **Deployment**: AI Studio

## Developer Commands

```bash
npm install          # Install dependencies
npm run dev         # Start dev server at localhost:3000
npm run build       # Production build to dist/
npm run lint        # TypeScript check (tsc --noEmit)
```

**Dev server**: Runs on port 3000, binds to `0.0.0.0` for local network access.

## Environment Variables

Copy `.env.example` to `.env.local` and configure:

| Variable | Required | Notes |
|----------|----------|-------|
| `GEMINI_API_KEY` | Yes | For OCR/document extraction |
| `VITE_SUPABASE_URL` | Yes | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Yes | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | No | Supabase service role key (keep secret) |
| `DATABASE_URL` | No | PostgreSQL connection string |
| `SUPABASE_ACCESS_TOKEN` | No | Supabase management access token |

## Architecture

- **Entry**: `src/main.tsx` → `src/App.tsx`
- **Components**: `src/components/*.tsx` (Dashboard, Staff, Patient, OCR, Finance, Calendar, Matchmaker, Ledger)
- **Services**: `src/services/*.ts` (staff, patient, shift, advance, gemini)
- **Lib**: `src/lib/supabase.ts` (Supabase client), `src/lib/utils.ts` (cn utilities)
- **Supabase tables**: `employees`, `patients`, `manual_shifts`, `salary_advances`
- **Supabase views**: `real_time_margin_view`, `staff_accrual_view`

## Key Patterns

- **Supabase queries**: Direct from components via `supabase.from('table').select()`
- **Gemini OCR**: `src/services/geminiService.ts` extracts structured JSON from staff documents (Form, CNIC, CV, Electricity Bill)
- **View routing**: `src/App.tsx` uses simple state-based view switching (`setActiveView`)
- **Styling**: TailwindCSS 4 with CSS variables in `src/index.css` (dark theme, emerald accents)
- **Animations**: Motion (framer-motion compatible) for transitions

## HMR Note

HMR is disabled in AI Studio via `DISABLE_HMR` env var. Do not modify this in `vite.config.ts` — it's intentional to prevent flickering during agent edits.

## Database

Supabase project: `https://zumysyuenxrylauzvokl.supabase.co`

Key tables and views (verify in Supabase dashboard):
- `staff` – Employee records with extracted OCR data
- `patients` – Patient records
- `shifts` – Staff shift assignments
- `advances` – Salary advances
- `real_time_margin_view` – MTD margin calculations

## Gotchas

- `console.log` in production code will trigger warnings (project hooks configured)
- Pre-commit hooks configured — run locally with `pre-commit run --all-files`
- Supabase keys must start with `VITE_` to be accessible in browser code
- Gemini API key is injected at runtime in AI Studio via Secrets panel
