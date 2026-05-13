---
description: Database operations — migrations, push, reset, status
agent: database
subtask: true
---
Supabase database management commands.

Usage: /db <action> [options]

Actions:
  push          Push pending migrations to Supabase (npx supabase db push)
  reset         Reset local database to latest migration
  status        Show linked project and migration status
  migrations    List all applied migrations
  new NAME      Create a new migration file (e.g., /db new add_user_table)
  seed          Run seed scripts from /scripts folder

Examples:
  /db push              # apply pending migrations
  /db reset             # WARNING: drops and recreates local DB
  /db status            # shows linked project ref
  /db new fix_phone_format   # creates supabase/migrations/040_fix_phone_format.sql
  /db seed              # runs all .sql files in scripts/

Environment:
  Requires ~/.config/supabase access token (from `supabase login`)
  Project linked via `npx supabase link --project-ref <ref>`

Migration file convention:
  supabase/migrations/NNN_description.sql (e.g., 030_add_attendance_table.sql)
  Use IF NOT EXISTS, ADD COLUMN IF NOT EXISTS for idempotency
  Include RAISE NOTICE for verification

Related: Supabase docs @ https://supabase.com/docs/guides/cli
