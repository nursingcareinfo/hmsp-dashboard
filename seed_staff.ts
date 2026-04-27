
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

async function seed() {
  console.log('🌱 Re-seeding Staff Ledger with Correct Categories...');

  const mockStaff = [
    {
      emp_no: 'NC-KHI-0001',
      full_name: 'Muhammad Ahmed Khan',
      father_husband_name: 'Suhail Khan',
      cnic_number: '42101-1234567-1',
      phone_primary: '+92 300 1234567',
      district: 'Clifton',
      category: 'R/N',
      position_applied: 'ICU Nurse',
      experience_years: 5,
      expected_salary_pkr: 75000,
      is_active: true,
      is_available: true,
      rating: 4.8,
      critical_missing_info: false
    },
    {
      emp_no: 'NC-KHI-0002',
      full_name: 'Saira Batool',
      father_husband_name: 'Ali Raza',
      cnic_number: '42201-9876543-2',
      phone_primary: '+92 321 7654321',
      district: 'Gulshan-e-Iqbal',
      category: 'Aid Nurse',
      position_applied: 'Elderly Care',
      experience_years: 3,
      expected_salary_pkr: 45000,
      is_active: true,
      is_available: true,
      rating: 4.5,
      critical_missing_info: false
    },
    {
      emp_no: 'NC-KHI-0003',
      full_name: 'Farhan Ali',
      father_husband_name: 'Mansoor Ali',
      cnic_number: '42301-4455667-3',
      phone_primary: '+92 333 9988776',
      district: 'North Nazimabad',
      category: 'Attendant',
      position_applied: 'Patient Attendant',
      experience_years: 2,
      expected_salary_pkr: 35000,
      is_active: true,
      is_available: false,
      rating: 4.2,
      critical_missing_info: false
    },
    {
      emp_no: 'NC-KHI-0004',
      full_name: 'Zainab Bibi',
      father_husband_name: 'Ghulam Qadir',
      cnic_number: '42401-2233445-4',
      phone_primary: '+92 345 1122334',
      district: 'Malir',
      category: 'Babysitter',
      position_applied: 'Child Care',
      experience_years: 4,
      expected_salary_pkr: 30000,
      is_active: true,
      is_available: true,
      rating: 4.7,
      critical_missing_info: false
    },
    {
      emp_no: 'NC-KHI-0005',
      full_name: 'Adnan Siddiqui',
      cnic_number: '42101-5566778-5',
      phone_primary: '+92 312 9988112',
      district: 'DHA',
      category: 'BSN',
      position_applied: 'Charge Nurse',
      experience_years: 6,
      expected_salary_pkr: 85000,
      is_active: true,
      is_available: true,
      rating: 4.9,
      critical_missing_info: false
    }
  ];

  try {
    console.log('Cleaning old records...');
    await sql`DELETE FROM employees`;

    console.log('Inserting new mock staff...');

    // Ensure all objects have exactly the same keys to avoid UNDEFINED_VALUE
    const keys = [...new Set(mockStaff.flatMap(obj => Object.keys(obj)))];
    const normalizedStaff = mockStaff.map(s => {
      const entry: any = {};
      keys.forEach(k => {
        entry[k] = (s as any)[k] === undefined ? null : (s as any)[k];
      });
      return entry;
    });

    await sql`INSERT INTO employees ${sql(normalizedStaff)}`;
    console.log('✅ 5 Staff members seeded successfully');

  } catch (err) {
    console.error('❌ Seeding failed:', err);
  } finally {
    await sql.end();
  }
}

seed();
