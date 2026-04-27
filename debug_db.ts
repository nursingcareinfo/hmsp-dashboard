
import postgres from 'postgres';
import * as dotenv from 'dotenv';
import * as fs from 'fs';

// Load .env manually
if (fs.existsSync('.env')) {
  const envConfig = dotenv.parse(fs.readFileSync('.env'));
  for (const k in envConfig) {
    process.env[k] = envConfig[k];
  }
}

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('❌ DATABASE_URL missing');
  process.exit(1);
}

const sql = postgres(connectionString);

async function debug() {
  try {
    const employees = await sql`SELECT id, full_name, category FROM employees LIMIT 5`;
    console.log('--- Employees in DB ---');
    console.log(employees);

    const count = await sql`SELECT COUNT(*) FROM employees`;
    console.log('Total count:', count[0].count);

  } catch (err) {
    console.error('Debug failed:', err);
  } finally {
    await sql.end();
  }
}

debug();
