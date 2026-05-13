---
description: Seed database with test data or reset to known state
agent: database
subtask: true
---
Database seeding and data management.

Usage: /seed [dataset]

Options:
  staff         Seed staff data from Google Contacts CSV (1321 records)
  patients      Seed sample patient records (test data)
  all           Seed both staff and patients (default)
  clear         Clear all data without dropping schema (use with caution)
  reset         Drop all tables and re-run all migrations + seeds

Examples:
  /seed              # seeds all (staff + patients)
  /seed staff        # only staff records
  /seed patients     # only patient records
  /seed clear        # delete all data, keep schema
  /seed reset        # npx supabase db reset && npx supabase db push && /seed all

How it works:
- Staff seed: Parses Google Contacts CSV format, maps to staff table fields, generates NC-KHI-XXXX IDs
- Patient seed: Creates sample patients with realistic Karachi addresses and conditions
- Clear: DELETE FROM staff; DELETE FROM patients; ... (respects FK constraints)
- Reset: Drops local DB, recreates from migrations, re-seeds

Note: This operates on the database linked via `npx supabase link`.
Local dev only — never run on production! Production data is live.

Related: /db, /status
