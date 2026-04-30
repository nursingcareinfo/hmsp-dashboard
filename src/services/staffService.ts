import { supabase } from '../lib/supabase';

export interface Staff {
  id: string;
  emp_no?: string;
  full_name?: string;
  father_husband_name?: string;
  cnic_number?: string;
  dob?: string;
  gender?: string;
  marital_status?: string;
  religion?: string;
  relative_info?: {
    name: string;
    relationship: string;
    phone: string;
  };
  phone_primary?: string;
  whatsapp_number?: string;
  district: string;
  complete_address?: string;
  position_applied: string;
  experience_years?: number;
  shift_preference?: string;
  expected_salary_pkr?: number;
  preferred_payment_method?: string;
  bank_info?: any;
  is_active: boolean;
  is_available: boolean;
  is_verified?: boolean;
  is_acknowledgment_signed?: boolean;
  data_confidence?: string;
  critical_missing_info?: boolean;
  missing_fields_list?: string[];
  document_urls?: any;
  rating: number;
  category?: string;
  created_at?: string;
  updated_at?: string;
}

export const staffService = {
  async getAllStaff() {
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as Staff[];
  },

  async getActiveStaffCount() {
    const { count, error } = await supabase
      .from('employees')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);

    if (error) throw error;
    return count || 0;
  },

  async getAvailableStaffCount() {
    const { count, error } = await supabase
      .from('employees')
      .select('*', { count: 'exact', head: true })
      .eq('is_available', true)
      .eq('is_active', true);

    if (error) throw error;
    return count || 0;
  },

  async createStaff(staffData: Partial<Staff>) {
    const cnic = staffData.cnic_number;

    // Check if staff with this CNIC already exists
    if (cnic) {
      const { data: existing, error: fetchErr } = await supabase
        .from('employees')
        .select('id, emp_no')
        .eq('cnic_number', cnic)
        .maybeSingle();

      if (fetchErr) throw fetchErr;

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
          .single();

        if (error) throw error;
        return data as Staff;
      }
    }

    // New staff: generate emp_no
    if (!staffData.emp_no) {
      const { data: staffBatch } = await supabase
        .from('employees')
        .select('emp_no')
        .order('created_at', { ascending: false })
        .limit(1);

      const lastStaff = staffBatch && staffBatch.length > 0 ? staffBatch[0] : null;

      let nextNum = 1;
      if (lastStaff?.emp_no) {
        const match = lastStaff.emp_no.match(/(\d+)$/);
        if (match) {
          nextNum = parseInt(match[1]) + 1;
        }
      }
      staffData.emp_no = `NC-KHI-${nextNum.toString().padStart(4, '0')}`;
    }

    const { data, error } = await supabase
      .from('employees')
      .insert([staffData])
      .select()
      .single();

    if (error) throw error;
    return data as Staff;
  },

  async updateStaff(id: string, updates: Partial<Staff>) {
    const { data, error } = await supabase
      .from('employees')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as Staff;
  }
};
