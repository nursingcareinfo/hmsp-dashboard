import { supabase } from '../lib/supabase';

export interface ManualShift {
  id: string;
  employee_id: string;
  patient_id: string;
  shift_date: string;
  shift_type: 'Morning' | 'Night';
  decided_rate_pkr: number;
  attendance_status: 'Scheduled' | 'Completed' | 'Abandoned';
  penalty_applied: boolean;
}

export const shiftService = {
  async getShiftsByMonth(year: number, month: number) {
    const startDate = new Date(year, month, 1).toISOString().split('T')[0];
    const endDate = new Date(year, month + 1, 0).toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('manual_shifts')
      .select('*, employee:employee_id(full_name), patient:patient_id(patient_name)')
      .gte('shift_date', startDate)
      .lte('shift_date', endDate)
      .order('shift_date', { ascending: true });

    if (error) throw error;
    return data;
  },

  async logShift(shift: Partial<ManualShift>) {
    const { data, error } = await supabase
      .from('manual_shifts')
      .insert([shift])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateShiftStatus(id: string, status: 'Completed' | 'Abandoned', penaltyApplied: boolean = false) {
    const { data, error } = await supabase
      .from('manual_shifts')
      .update({ attendance_status: status, penalty_applied: penaltyApplied })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};
