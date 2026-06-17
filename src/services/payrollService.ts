import { supabase } from '../lib/supabase'

export interface PayrollRecord {
  id: string
  staff_id: string
  staff_name: string
  period_start: string
  period_end: string
  shifts_worked: number
  shift_rate: number
  base_salary: number
  allowances: any
  deductions: any
  deductions_advances: any
  net_salary: number
  status: string
  payment_date: string | null
  created_at: string
}

export const payrollService = {
  async getByEmployee(staffId: string) {
    const { data, error } = await supabase
      .from('payroll')
      .select('*')
      .eq('staff_id', staffId)
      .order('period_start', { ascending: false })

    if (error) throw error
    return data as PayrollRecord[]
  },
}
