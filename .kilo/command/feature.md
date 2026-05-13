---
description: Create a new feature — scaffold CRUD, service, UI, and migration if needed
agent: fullstack
subtask: true
---
Scaffold a new feature across frontend, service layer, and database.

Usage: /feature <name> [--type TYPE] [--fields FIELDS]

Options:
  --type TYPE      resource type: crud | service | component | migration
  --fields FIELDS   comma-separated field list for CRUD (e.g. "name:string,age:number,active:boolean")

Examples:
  /feature ShiftAssignment                 # scaffolds ShiftAssignment resource with full CRUD
  /feature AttendanceRaw --type crud --fields "staff_id:uuid,date:date,status:string"
  /feature BulkUpload --type component     # creates React component shell
  /feature add_reliability_score --type migration  # creates migration file

What gets created:
  CRUD resource (default):
    - src/services/<name>Service.ts (CRUD functions)
    - src/components/<Name>Module.tsx (full-page component with table, form)
    - src/types/<name>.ts (TypeScript interface)
    - supabase/migrations/XXX_<name>.sql (table + RLS)
    - Update App.tsx menuItems (if new top-level view)

  Service only:
    - src/services/<name>Service.ts (import命名为export)

  Component only:
    - src/components/<Name>.tsx (with skeleton, empty state, error handling)

  Migration only:
    - supabase/migrations/XXX_<description>.sql

Naming conventions:
- File names: PascalCase for components, camelCase for services
- Table name: kebab-case (duty_assignments, attendance_records)
- Migration number: auto-incremented from existing files

After scaffolding:
1. Edit the service file to implement actual logic
2. Update migration SQL with proper constraints and indexes
3. Apply migration: /db push
4. Seed test data if needed: /seed
5. Test in dev: /dev

Note: This is a starter template — you will need to fill in business logic.

Related: /db, /build, /dev
