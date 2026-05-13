---
name: hmsp-dashboard
description: Specialized skill for HMSP Dashboard development — React 19, Vite, Supabase, Gemini AI
triggers:
  - hmsp
  - dashboard
  - ocr
  - gemini fallback
  - staff status
  - quota
  - supabase
  - karachi
---

# HMSP Dashboard Skill

This skill provides specialized knowledge for working on the HMSP Dashboard project.

## Project Overview

HMSP (Home Medical Services Provider) — a staff management dashboard for home nursing operations in Karachi, Pakistan. React 19 + Vite 6 + Supabase + Google Gemini AI.

**Live:** https://nursingcareinfo.github.io/hmsp-dashboard/
**Repo:** github.com/nursingcareinfo/hmsp-dashboard
**Tech Stack:** React 19, TypeScript 5.8, Vite 6, Tailwind CSS 4, Supabase, Google Gemini AI, Recharts, Motion

## Key Concepts

### State-Based Routing
App uses state-driven navigation (not React Router). Views are switched via `setActiveView` in `App.tsx`:
```typescript
type View = 'dashboard' | 'staff' | 'patients' | 'matchmaker' | 'finance' | 'ocr' | 'attendance' | 'memory';
```
Add new views by:
1. Adding to `menuItems` array in `App.tsx`
2. Adding conditional render inside `<AnimatePresence>` block
3. Importing the component at top of file

### Services Layer Pattern
All Supabase calls go through service files in `src/services/`:
- `dataService.ts` — generic CRUD with fallback chain
- `staffService.ts` — staff-specific operations
- `patientService.ts` — patient CRUD + End Services workflow
- `dutyService.ts` — shift assignment, max 2 staff per shift
- `attendanceService.ts` — attendance marking, monthly summary, calendar
- `matchingService.ts` — AI staff-patient matching (7 weighted criteria)
- `geminiService.ts` — OCR extraction via Gemini AI
- `payrollService.ts` — flat-rate payroll calculation
- `advanceService.ts` — advance payment tracking

**Never call Supabase directly from components.** Always go through services.

### Environment Variables (Vite)
Client-exposed env vars must use `VITE_` prefix and accessed via `import.meta.env`:
- `VITE_SUPABASE_URL` — Supabase project URL
- `VITE_SUPABASE_ANON_KEY` — anon key (respects RLS)
- `VITE_GEMINI_API_KEY` — Google AI API key

In `.env.local` use full names. In GitHub Secrets, map:
```yaml
env:
  VITE_GEMINI_API_KEY: ${{ secrets.GEMINI_API_KEY }}
  VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
  VITE_SUPABASE_ANON_KEY: ${{ secrets.VITE_SUPABASE_ANON_KEY }}
```

### Supabase Schema Highlights

**staff** (1321 records):
- ID format: NC-KHI-0001 (emp_no)
- Status: Active / Inactive / On Duty / Available / Blacklisted
- District: Karachi South, East, West, Korangi, Malir, Keamari, Nazimabad
- Category: Nurse, Nurse Assistant, Attendant, Caretaker, Baby Sitter, Doctor, etc.
- Reliability score: 0-100 from attendance history (staff_reliability_scores view)

**patients** (4+ records):
- ID format: NC-PAT-0001 (patient_id_assigned, auto-generated)
- 61 columns covering guardian, clinical, billing data
- FK: assigned_staff_id → staff(id)
- End reason: recovered / deceased / contract_cancelled / dissatisfied

**duty_assignments**:
- Links patient + staff + date + shift_type (day/night)
- Status: assigned / confirmed / completed / cancelled
- Max 2 staff per patient per shift enforced by DB trigger (migration 027)
- Auto-inserts attendance='present' when status='completed'

**attendance_records**:
- One per staff per day (UNIQUE constraint)
- Status: present / absent / late / half_day / on_leave
- Used for reliability score and payroll calculation

### Business Rules

1. **Shift Types**: Day (7AM-7PM), Night (7PM-7AM)
2. **Payroll Formula**: (completed_shifts × shift_rate) - advances_deducted
   - No night premium, no overtime
   - Shift rate stored on staff.shift_rate (pkr per shift)
3. **Reliability Score**: (present×1.0 + late×0.5 + half_day×0.5) / total_working_days × 100
4. **Staff Assignment**:
   - Max 2 staff per patient per shift per date
   - Double-booking prevention: same staff cannot work same shift type on same date across patients
   - Only Active staff can be assigned (guard in dutyService)
5. **Patient End Services**: Set end_reason + end_date + end_notes, status changes to Discharged/Deceased/etc.

### UI/UX Patterns

- **Dark theme default**: bg-[var(--color-bg)] (#0A0B0D), text-[var(--color-ink)] (#CBD5E1)
- **Glass cards**: .glass-card utility (semi-transparent, backdrop-blur)
- **Responsive**: Mobile bottom nav (5 items), desktop sidebar (expand/collapse)
- **Animations**: Motion (fade, slide, AnimatePresence for view transitions)
- **Charts**: Recharts (ResponsiveContainer required — dimension warnings if container has no size)
- **Icons**: Lucide React, size={16} for nav, size={48} for empty states

### Development Workflow

```bash
npm install              # first time
npm run dev --port=3000  # dev server, HMR enabled
npm run build            # production build to dist/
npx tsc --noEmit         # type check
npm run lint             # future: ESLint + Prettier
```

Pre-commit hooks: trailing-whitespace, end-of-file, check-yaml, check-merge-conflict, TypeScript type-check

GitHub Actions: push to main → auto-deploy to GitHub Pages

### Database Migrations

Create migration: `supabase/migrations/NNN_description.sql` (3-digit padding auto-incremented).
Apply: `npx supabase db push` (interactive).
Reset local: `npx supabase db reset`.
Check status: `npx supabase status`.

Migration must be idempotent: use `ADD COLUMN IF NOT EXISTS`, `CREATE TYPE IF NOT EXISTS`, etc.

### MCP Servers

Project uses MCP for tool integration:
- **supabase**: Database access, migrations, query execution
- **chrome-devtools**: Browser automation (E2E testing)
- **git**: Version control operations
- **sequential-thinking**: Planning and reasoning
- **memory**: Knowledge graph (this entity!)

Configured in Kilo: `.kilo/kilo.jsonc` with permissions per tool.

### Kilo Commands (Project-Specific)

- `/dev` — start dev server (port 3000)
- `/build` — build + type check
- `/deploy` — deploy to GitHub Pages
- `/db` — database operations (push, reset, new migration)
- `/seed` — seed test data (staff/patients)
- `/typecheck` / `/tc` — TypeScript check only
- `/status` — app/environment health report
- `/env` — list VITE_* env vars (masked)
- `/logs` — tail dev logs, view errors
- `/staff` — staff status management (bulk operations)
- `/staff-manual` — detailed staff editing/verification
- `/ai` — Gemini/Groq model management, fallback control

### Specialized Agents (via Task tool)

- `frontend` — React 19 + Vite + Tailwind CSS expert
- `backend` — Supabase + database + RLS policies
- `fullstack` — end-to-end features across all layers
- `database` — migrations, performance, indexes
- `devops` — CI/CD, GitHub Actions, deployment
- `security-reviewer` — security audit for auth, input, secrets
- `ai-ocr` — Gemini extraction, fallback to Groq, quota management

## Common Patterns

### Data Fetching (React Query)
```typescript
const { data, isLoading, error } = useQuery({
  queryKey: ['staff'],
  queryFn: () => dataService.getStaff()
});
```

### Mutation with Invalidation
```typescript
const mutation = useMutation({
  mutationFn: dataService.updateStaff,
  onSuccess: () => queryClient.invalidateQueries({ queryKey: ['staff'] })
});
```

### Toast Notifications
```typescript
import { toast } from "sonner";
toast.success("Staff updated successfully");
toast.error("Failed to save — please try again");
```

### Real-time Updates
```typescript
useEffect(() => {
  const channel = supabase.channel('staff-changes');
  channel
    .on('postgres_changes', { event: '*', schema: 'public', table: 'staff' }, () => {
      queryClient.invalidateQueries(['staff']);
    })
    .subscribe();
  return () => supabase.removeChannel(channel);
}, []);
```

## Gotchas

1. **process.env not available** — use `import.meta.env.VITE_*` only
2. **Base path** — must be `/hmsp-dashboard/` both in `vite.config.ts` and index.html (Vite handles this)
3. **Supabase local dev** — `npx supabase start` (Docker) or use cloud directly
4. **Gemini client-side** — key exposed; consider Edge Function for production
5. **Recharts size warnings** — wrap in `<div style={{ width: '100%', height: 300 }}>` or use `<ResponsiveContainer>`
6. **Cache invalidation** — always `invalidateQueries` after mutations, not just optimistic updates

## Quick Reference

| Task | Command |
|---|---|
| Start dev server | `/dev` |
| Build for prod | `/build` |
| Deploy | `/deploy` |
| DB push | `/db push` |
| Create migration | `/db new <name>` |
| Seed test data | `/seed` |
| Type check | `/typecheck` |
| View status | `/status` |
| Check env | `/env` |
| View logs | `/logs errors` |
| Edit staff | `/staff-manual edit <id> <field> <value>` |
| Change status | `/staff status UPDATE <id> <status>` |

## Agents Memory

All fixes and configuration patterns recorded in `agentmemory` knowledge graph:
- GitHub Pages blank page root cause + Vite env var pattern
- Deployment secrets mapping (GitHub Secrets → build env → import.meta.env)
- Supabase schema, migrations, triggers, constraints
- Staff assignment rules, attendance scoring, payroll calculation
- Gemini integration and fallback strategies

## Support

- Project README: `README.md`
- AGENTS.md: project-specific agent instructions
- CLAUDE.md: general assistant context
- Kilo docs: https://app.kilo.ai/docs
