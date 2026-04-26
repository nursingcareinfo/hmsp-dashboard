
import postgres from 'postgres';
import * as dotenv from 'dotenv';
import * as fs from 'fs';

if (fs.existsSync('.env')) {
  const envConfig = dotenv.parse(fs.readFileSync('.env'));
  for (const k in envConfig) {
    process.env[k] = envConfig[k];
  }
}

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  process.exit(1);
}

const sql = postgres(connectionString);

async function seedPatients() {
  console.log('🌱 Seeding Patients...');
  try {
    // Get some staff IDs to assign
    const staff = await sql`SELECT id FROM employees LIMIT 3`;
    
    const mockPatients = [
      {
        patient_name: 'Mrs. Fatima Zahra',
        cnic: '42101-1111111-1',
        mobile_number: '+92 300 1112233',
        district: 'Clifton',
        service_type: '24hr',
        status: 'Active',
        monthly_package_pkr: 150000
      },
      {
        patient_name: 'Mr. Javed Iqbal',
        cnic: '42201-2222222-2',
        mobile_number: '+92 321 3334455',
        district: 'DHA',
        service_type: '12hr',
        status: 'Active',
        monthly_package_pkr: 85000
      },
      {
        patient_name: 'Baby Zain (Pediatric)',
        cnic: '42301-3333333-3',
        mobile_number: '+92 333 5556677',
        district: 'Gulshan',
        service_type: '8hr',
        status: 'Active',
        monthly_package_pkr: 45000
      },
      {
        patient_name: 'Ms. Sakina Bano',
        district: 'Malir',
        mobile_number: '+92 345 5556677',
        status: 'Pending',
        service_type: '24hr',
        monthly_package_pkr: 150000
      }
    ];

    await sql`DELETE FROM patients`;
    
    // Ensure all objects have same keys
    const keys = [...new Set(mockPatients.flatMap(obj => Object.keys(obj)))];
    const normalized = mockPatients.map(p => {
      const entry: any = {};
      keys.forEach(k => {
        entry[k] = (p as any)[k] === undefined ? null : (p as any)[k];
      });
      return entry;
    });

    await sql`INSERT INTO patients ${sql(normalized)}`;
    console.log('✅ 4 Patients seeded');
    
    // Also disable RLS for patients
    await sql`ALTER TABLE patients DISABLE ROW LEVEL SECURITY`;
    console.log('🔓 RLS disabled for patients');

  } catch (err) {
    console.error('❌ Patient seeding failed:', err);
  } finally {
    await sql.end();
  }
}

seedPatients();
