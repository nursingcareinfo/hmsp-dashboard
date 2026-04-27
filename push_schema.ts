import postgres from 'postgres';
import * as dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { join } from 'path';

dotenv.config();

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('❌ DATABASE_URL missing in .env');
  process.exit(1);
}

const sql = postgres(connectionString);

async function runSchema() {
  console.log('🚀 Pushing Robust Schema V2 to Supabase...');
  try {
    // Drop old tables to ensure clean slate for new constraints/renames
    console.log('🧹 Cleaning legacy structure...');
    await sql.unsafe(`
      DROP VIEW IF EXISTS real_time_margin_view CASCADE;
      DROP VIEW IF EXISTS staff_accrual_view CASCADE;
      DROP TABLE IF EXISTS salary_advances CASCADE;
      DROP TABLE IF EXISTS manual_shifts CASCADE;
      DROP TABLE IF EXISTS employees CASCADE;
      DROP TABLE IF EXISTS staff CASCADE;
      DROP TABLE IF EXISTS patients CASCADE;
    `);

    const schemaSql = readFileSync(join(process.cwd(), 'supabase_schema.sql'), 'utf8');

    // Execute the schema
    await sql.unsafe(schemaSql);

    console.log('✅ Robust Schema V2 executed successfully! Tables and Views created.');
  } catch (error) {
    console.error('❌ Failed to push schema:', error);
  } finally {
    await sql.end();
    process.exit(0);
  }
}

runSchema();
