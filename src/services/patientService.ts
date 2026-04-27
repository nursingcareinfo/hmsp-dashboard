import { supabase } from '../lib/supabase';

export interface Patient {
  id?: string;
  patient_name: string;
  cnic?: string;
  mobile_number: string;
  district: string;
  complete_address?: string;
  service_type: string;
  service_duration?: string;
  monthly_package_pkr: number;
  status: 'Active' | 'Pending' | 'Completed' | 'Cancelled';
  start_date?: string;
  end_date?: string;
}

export const patientService = {
  async getAllPatients() {
    const { data, error } = await supabase
      .from('patients')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as Patient[];
  },

  async createPatient(patient: Omit<Patient, 'id'>) {
    const { data, error } = await supabase
      .from('patients')
      .insert([patient])
      .select()
      .single();

    if (error) throw error;
    return data as Patient;
  },

  async getActivePatientsCount() {
    const { count, error } = await supabase
      .from('patients')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'Active');

    if (error) throw error;
    return count || 0;
  },

  async getPendingPatientsCount() {
    const { count, error } = await supabase
      .from('patients')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'Pending');

    if (error) throw error;
    return count || 0;
  }
};
