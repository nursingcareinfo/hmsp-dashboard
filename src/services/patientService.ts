import { supabase } from '../lib/supabase'
import type { InvoiceStatus, PatientInvoice } from '../types'

export interface Patient {
  id?: string
  full_name: string
  cnic?: string
  contact: string
  gender?: string
  marital_status?: string
  date_of_birth?: string
  district: string
  address?: string
  service_type: string
  service_duration?: string
  billing_rate: number
  status: 'Active' | 'Pending' | 'Completed' | 'Cancelled'
  start_date?: string
  end_date?: string
  service_end_date?: string | null
  service_end_reason?: string | null
  service_end_notes?: string | null
}

export const patientService = {
  async getAllPatients() {
    const { data, error } = await supabase
      .from('patients')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return data as Patient[]
  },

  async createPatient(patient: Omit<Patient, 'id'>) {
    const { data, error } = await supabase.from('patients').insert([patient]).select().single()

    if (error) throw error
    return data as Patient
  },

  async updatePatient(id: string, data: Partial<Patient>) {
    const { data: result, error } = await supabase
      .from('patients')
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return result as Patient
  },

  async getActivePatientsCount() {
    const { count, error } = await supabase
      .from('patients')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'Active')

    if (error) throw error
    return count || 0
  },

  async getPendingPatientsCount() {
    const { count, error } = await supabase
      .from('patients')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'Pending')

    if (error) throw error
    return count || 0
  },
}

export function getCurrentPeriod() {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()
  const day = now.getDate()

  if (day <= 15) {
    return {
      periodStart: `${year}-${String(month + 1).padStart(2, '0')}-01`,
      periodEnd: `${year}-${String(month + 1).padStart(2, '0')}-15`,
    }
  } else {
    const lastDay = new Date(year, month + 1, 0).getDate()
    return {
      periodStart: `${year}-${String(month + 1).padStart(2, '0')}-16`,
      periodEnd: `${year}-${String(month + 1).padStart(2, '0')}-${lastDay}`,
    }
  }
}

export const patientIntakeService = {
  async getIntakeStatusByPhone(phones: string[], cnics: string[]) {
    if (phones.length === 0 && cnics.length === 0) return []
    const filters: any[] = []
    if (phones.length > 0) filters.push({ field: 'mobile', values: phones })
    if (cnics.length > 0) filters.push({ field: 'cnic', values: cnics })

    // Collect all values to query
    const allValues = [...new Set([...phones, ...cnics])]
    const { data, error } = await supabase
      .from('patient_intakes')
      .select('id, full_name, cnic, mobile, terms_accepted, created_at')
      .in('mobile', allValues)

    if (error) throw error

    // Also try matching by CNIC for any that weren't found by phone
    const foundMobiles = new Set((data || []).map((d: any) => d.mobile))
    const phoneOnlyCnics = [...new Set(cnics.filter((c) => c && !foundMobiles.has(c)))]

    if (phoneOnlyCnics.length > 0) {
      const { data: cnicData, error: cnicErr } = await supabase
        .from('patient_intakes')
        .select('id, full_name, cnic, mobile, terms_accepted, created_at')
        .in('cnic', phoneOnlyCnics)

      if (cnicErr) throw cnicErr
      return [...(data || []), ...(cnicData || [])]
    }

    return data || []
  },
}

export const patientInvoiceService = {
  async getInvoicesForPatient(patientId: string) {
    const { data, error } = await supabase
      .from('patient_invoices')
      .select('*')
      .eq('patient_id', patientId)
      .order('period_start', { ascending: false })

    if (error) throw error
    return data as PatientInvoice[]
  },

  async getInvoicesForPatients(patientIds: string[]) {
    const { data, error } = await supabase
      .from('patient_invoices')
      .select('*')
      .in('patient_id', patientIds)
      .order('period_start', { ascending: false })

    if (error) throw error
    return data as PatientInvoice[]
  },

  async generateInvoice(patientId: string, patientBillingRate: number) {
    const { periodStart, periodEnd } = getCurrentPeriod()
    const amount = patientBillingRate / 2

    const { data, error } = await supabase
      .from('patient_invoices')
      .insert([
        {
          patient_id: patientId,
          period_start: periodStart,
          period_end: periodEnd,
          amount,
        },
      ])
      .select()
      .single()

    if (error) throw error
    return data as PatientInvoice
  },

  async markAsPaid(invoiceId: string) {
    const { data, error } = await supabase
      .from('patient_invoices')
      .update({ status: 'Paid', paid_at: new Date().toISOString() })
      .eq('id', invoiceId)
      .select()
      .single()

    if (error) throw error
    return data as PatientInvoice
  },

  async updateInvoiceStatus(invoiceId: string, status: InvoiceStatus) {
    const { data, error } = await supabase
      .from('patient_invoices')
      .update({ status })
      .eq('id', invoiceId)
      .select()
      .single()

    if (error) throw error
    return data as PatientInvoice
  },

  async cancelUnpaidInvoices(patientId: string) {
    const { data, error } = await supabase
      .from('patient_invoices')
      .update({ status: 'Cancelled' })
      .eq('patient_id', patientId)
      .eq('status', 'Unpaid')
      .select()

    if (error) throw error
    return data as PatientInvoice[]
  },
}

export interface PatientEquipment {
  id?: string
  patient_id: string
  item_name: string
  quantity: number
  rental_rate: number
  rate_period: 'daily' | 'monthly'
  rented_at: string
  returned_at?: string | null
  status: 'rented' | 'returned'
  notes?: string | null
  created_at?: string
  updated_at?: string
}

export const equipmentService = {
  async getForPatient(patientId: string) {
    const { data, error } = await supabase
      .from('patient_equipment')
      .select('*')
      .eq('patient_id', patientId)
      .order('rented_at', { ascending: false })

    if (error) throw error
    return data as PatientEquipment[]
  },

  async addItem(data: Omit<PatientEquipment, 'id' | 'created_at' | 'updated_at'>) {
    const { data: result, error } = await supabase
      .from('patient_equipment')
      .insert([data])
      .select()
      .single()

    if (error) throw error
    return result as PatientEquipment
  },

  async markReturned(id: string) {
    const { data, error } = await supabase
      .from('patient_equipment')
      .update({
        returned_at: new Date().toISOString().split('T')[0],
        status: 'returned',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data as PatientEquipment
  },
}
