import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as fs from 'fs'

if (fs.existsSync('.env.local')) {
  const envConfig = dotenv.parse(fs.readFileSync('.env.local'))
  for (const k in envConfig) process.env[k] = envConfig[k]
}

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

const staff = [
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
    critical_missing_info: false,
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
    critical_missing_info: false,
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
    critical_missing_info: false,
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
    critical_missing_info: false,
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
    critical_missing_info: false,
  },
]

const patients = [
  {
    full_name: 'Mrs. Fatima Zahra',
    cnic: '42101-1111111-1',
    contact: '+92 300 1112233',
    address: 'House 12, Block 3, Clifton',
    district: 'Clifton',
    guardian_contact: '+92 300 1112234',
    service_type: '24hr',
    status: 'Active',
    billing_rate: 150000,
    city: 'Karachi',
    gender: 'Female',
    age: 65,
    guardian_name: 'Mr. Ali',
    guardian_relationship: 'Son',
    medical_condition: 'Post-surgery care',
    service_category: 'elderly_care',
    acuity_level: 2,
    mobility_status: 'walker',
  },
  {
    full_name: 'Mr. Javed Iqbal',
    cnic: '42201-2222222-2',
    contact: '+92 321 3334455',
    address: 'Plot 45, Phase 6, DHA',
    district: 'DHA',
    guardian_contact: '+92 321 3334456',
    service_type: '12hr',
    status: 'Active',
    billing_rate: 85000,
    city: 'Karachi',
    gender: 'Male',
    age: 72,
    guardian_name: 'Mrs. Javed',
    guardian_relationship: 'Wife',
    medical_condition: 'Diabetes management',
    service_category: 'elderly_care',
    acuity_level: 3,
    mobility_status: 'wheelchair',
  },
  {
    full_name: 'Baby Zain (Pediatric)',
    cnic: '42301-3333333-3',
    contact: '+92 333 5556677',
    address: 'Flat 7, Block 2, Gulshan-e-Iqbal',
    district: 'Gulshan',
    guardian_contact: '+92 333 5556678',
    service_type: '8hr',
    status: 'Active',
    billing_rate: 45000,
    city: 'Karachi',
    gender: 'Male',
    age: 3,
    guardian_name: 'Mr. Zain Father',
    guardian_relationship: 'Father',
    medical_condition: 'Pediatric care',
    service_category: 'pediatric',
    acuity_level: 1,
    mobility_status: 'independent',
  },
  {
    full_name: 'Ms. Sakina Bano',
    cnic: '42401-4444555-6',
    contact: '+92 345 5556677',
    address: 'House 3, Malir Colony',
    district: 'Malir',
    guardian_name: 'Mr. Sakina Brother',
    guardian_contact: '+92 345 5556678',
    service_type: '24hr',
    status: 'Pending',
    billing_rate: 150000,
    city: 'Karachi',
    gender: 'Female',
    age: 55,
    medical_condition: 'General care',
    service_category: 'elderly_care',
    acuity_level: 2,
    mobility_status: 'independent',
  },
]

async function seed() {
  console.log('🌱 Seeding demo data via Supabase REST API...')

  // Clean & seed staff
  console.log('\n--- Staff ---')
  // Clear existing data
  await supabase.from('employees').delete().neq('emp_no', '')
  await supabase.from('patients').delete().neq('cnic', '')

  const { data: staffData, error: staffErr } = await supabase
    .from('employees')
    .insert(staff)
    .select()
  if (staffErr) {
    console.error('❌ Staff seed failed:', staffErr.message)
  } else {
    console.log(`✅ ${staffData.length} staff members seeded`)
  }

  // Seed patients
  console.log('\n--- Patients ---')
  const { data: patData, error: patErr } = await supabase.from('patients').insert(patients).select()
  if (patErr) {
    console.error('❌ Patients seed failed:', patErr.message)
  } else {
    console.log(`✅ ${patData.length} patients seeded`)
  }

  console.log('\n🎉 Done!')
}

seed()
