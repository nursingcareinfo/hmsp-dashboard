import { supabase } from '../lib/supabase'

export interface Staff {
  id: string
  emp_no?: string
  full_name?: string
  father_husband_name?: string
  cnic_number?: string
  dob?: string
  gender?: string
  marital_status?: string
  religion?: string
  relative_info?: {
    name: string
    relationship: string
    phone: string
  }
  phone_primary?: string
  whatsapp_number?: string
  district: string
  complete_address?: string
  position_applied: string
  experience_years?: number
  shift_preference?: string
  expected_salary_pkr?: number
  day_shift_rate?: number
  night_shift_rate?: number
  preferred_payment_method?: string
  bank_info?: any
  is_active: boolean
  is_available: boolean
  is_verified?: boolean
  is_acknowledgment_signed?: boolean
  data_confidence?: string
  critical_missing_info?: boolean
  missing_fields_list?: string[]
  pnc_registration_number?: string
  pnc_license_expiry_date?: string
  document_urls?: any
  rating: number
  category?: string
  is_blacklisted?: boolean
  service_end_date?: string | null
  service_end_reason?: string | null
  service_end_notes?: string | null
  created_at?: string
  updated_at?: string
}

export const staffService = {
  async getAllStaff() {
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return data as Staff[]
  },

  async getActiveStaffCount() {
    const { count, error } = await supabase
      .from('employees')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)

    if (error) throw error
    return count || 0
  },

  async getAvailableStaff() {
    const { data, error } = await supabase
      .from('employees')
      .select('id, full_name, district, category, expected_salary_pkr')
      .eq('is_available', true)
      .eq('is_active', true)
      .order('full_name', { ascending: true })

    if (error) throw error
    return data
  },

  async getAvailableStaffCount() {
    const { count, error } = await supabase
      .from('employees')
      .select('*', { count: 'exact', head: true })
      .eq('is_available', true)
      .eq('is_active', true)

    if (error) throw error
    return count || 0
  },

  async createStaff(staffData: Partial<Staff>) {
    // Normalize phone numbers to the employees.phone_primary CHECK format
    // (+92 3XX XXXXXXX). The UI formatter produces 03XX-XXXXXXX which fails it.
    const phoneDigits = String(staffData.phone_primary || '').replace(/\D/g, '')
    if (phoneDigits.length === 11 && phoneDigits.startsWith('03')) {
      staffData.phone_primary = `+92 ${phoneDigits.slice(1, 4)} ${phoneDigits.slice(4)}`
    } else if (phoneDigits.length === 12 && phoneDigits.startsWith('92')) {
      staffData.phone_primary = `+92 ${phoneDigits.slice(2, 5)} ${phoneDigits.slice(5)}`
    }
    if (staffData.whatsapp_number && !staffData.whatsapp_number.startsWith('+')) {
      const waDigits = String(staffData.whatsapp_number).replace(/\D/g, '')
      staffData.whatsapp_number =
        waDigits.length >= 11
          ? `+92 ${waDigits.slice(-10, -7)} ${waDigits.slice(-7)}`
          : staffData.whatsapp_number
    }

    console.log('StaffService: createStaff called with data:', staffData)
    const cnic = staffData.cnic_number
    console.log('StaffService: CNIC to check:', cnic)

    // Check if staff with this CNIC already exists
    if (cnic) {
      console.log('StaffService: Checking for existing staff with CNIC:', cnic)
      const { data: existing, error: fetchErr } = await supabase
        .from('employees')
        .select('id, emp_no')
        .eq('cnic_number', cnic)
        .maybeSingle()

      if (fetchErr) {
        console.error('StaffService: Error checking existing staff:', fetchErr)
        throw fetchErr
      }
      console.log('StaffService: Existing staff check result:', existing)

      if (existing) {
        // Update existing record, preserve emp_no and timestamps
        const { data, error } = await supabase
          .from('employees')
          .update({
            ...staffData,
            // emp_no stays as-is; updated_at handled by DB trigger or default
          })
          .eq('id', existing.id)
          .select()
          .single()

        if (error) throw error
        return data as Staff
      }
    }

    // New staff: get next emp_no from the DB sequence (atomic, race-safe).
    // If the get_next_emp_no function is missing on this project (schema
    // drift), fall back to computing the next number client-side.
    if (!staffData.emp_no) {
      const { data: nextNo, error: seqErr } = await supabase.rpc('get_next_emp_no')

      if (seqErr) {
        console.warn('StaffService: get_next_emp_no unavailable, computing client-side:', seqErr)
        const { data: latest, error: listErr } = await supabase
          .from('employees')
          .select('emp_no')
          .order('emp_no', { ascending: false })
          .limit(1)
        if (!listErr && latest && latest.length > 0 && latest[0].emp_no) {
          const m = String(latest[0].emp_no).match(/(\d+)$/)
          staffData.emp_no = `NC-KHI-${String(m ? parseInt(m[1], 10) + 1 : 1).padStart(4, '0')}`
        } else {
          staffData.emp_no = 'NC-KHI-0001'
        }
      } else {
        staffData.emp_no = (nextNo as string) || 'NC-KHI-0001'
      }
    }

    console.log('StaffService: Inserting new staff data:', staffData)
    const { data, error } = await supabase.from('employees').insert([staffData]).select().single()

    if (error) {
      console.error('StaffService: Insert error:', error)
      throw error
    }
    console.log('StaffService: Insert successful, returning:', data)
    return data as Staff
  },

  async updateStaff(id: string, updates: Partial<Staff>) {
    const { data, error } = await supabase
      .from('employees')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data as Staff
  },

  async deleteStaff(id: string) {
    const { error } = await supabase.from('employees').delete().eq('id', id)

    if (error) throw error
  },
}
