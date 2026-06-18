/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react'
import {
  ClipboardList,
  Clock,
  MapPin,
  User,
  CreditCard,
  Plus,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Circle,
  ChevronDown,
  ChevronRight,
  Receipt,
  FileText,
  MessageSquare,
} from 'lucide-react'
import type { Patient, PatientInvoice } from '../types'
import { cn, formatPKR, formatNameInput, formatCNICInput, formatPhoneInput } from '../lib/utils'
import {
  patientService,
  patientInvoiceService,
  patientIntakeService,
  getCurrentPeriod,
} from '../services/patientService'
import { shiftService } from '../services/shiftService'
import { staffService } from '../services/staffService'

export default function PatientView({
  highlightedPatientId,
  onClearHighlight,
}: {
  highlightedPatientId?: string | null
  onClearHighlight?: () => void
}) {
  const [patients, setPatients] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [invoices, setInvoices] = useState<Record<string, PatientInvoice[]>>({})
  const [expandedPatients, setExpandedPatients] = useState<Set<string>>(new Set())
  const [assignments, setAssignments] = useState<Record<string, any[]>>({})
  const [intakeStatus, setIntakeStatus] = useState<Record<string, boolean>>({})

  const [availableStaff, setAvailableStaff] = useState<any[]>([])
  const [assigningSlot, setAssigningSlot] = useState<string | null>(null)
  const [assigningStaffId, setAssigningStaffId] = useState<string>('')
  const [isAssigning, setIsAssigning] = useState(false)

  const [formData, setFormData] = useState({
    full_name: '',
    cnic: '',
    contact: '',
    gender: '',
    marital_status: '',
    date_of_birth: '',
    district: '',
    complete_address: '',
    service_type: '12h_day',
    billing_rate: '',
    status: 'Pending' as 'Active' | 'Pending' | 'Completed' | 'Cancelled',
    start_date: new Date().toISOString().split('T')[0],
  })

  const loadPatients = async () => {
    try {
      const data = await patientService.getAllPatients()
      setPatients(data)
      await autoGenerateInvoices(data)
      await Promise.all([loadAssignments(data.map((p: any) => p.id)), loadIntakeStatus(data)])
    } catch (error) {
      console.error('Error fetching patients:', error)
    } finally {
      setLoading(false)
    }
  }

  async function loadIntakeStatus(patientsList: any[]) {
    try {
      const phones = patientsList.map((p: any) => p.contact).filter(Boolean)
      const cnics = patientsList.map((p: any) => p.cnic).filter(Boolean)
      const intakes = await patientIntakeService.getIntakeStatusByPhone(phones, cnics)
      const status: Record<string, boolean> = {}
      for (const intake of intakes) {
        const match = patientsList.find(
          (p: any) =>
            (p.contact && intake.mobile === p.contact) || (p.cnic && intake.cnic === p.cnic)
        )
        if (match && intake.terms_accepted) {
          status[match.id] = true
        }
      }
      setIntakeStatus(status)
    } catch (error) {
      console.error('Error loading intake status:', error)
    }
  }

  async function loadAssignments(patientIds: string[]) {
    try {
      const data = await shiftService.getPatientAssignments(patientIds)
      const grouped: Record<string, any[]> = {}
      for (const row of data) {
        if (!grouped[row.patient_id]) grouped[row.patient_id] = []
        grouped[row.patient_id].push(row)
      }
      setAssignments(grouped)
    } catch (error) {
      console.error('Error loading assignments:', error)
    }
  }

  async function autoGenerateInvoices(patientsList: any[]) {
    const activePatients = patientsList.filter((p) => p.status === 'Active')
    if (activePatients.length === 0) return

    const { periodStart } = getCurrentPeriod()

    for (const patient of activePatients) {
      const existing = await patientInvoiceService.getInvoicesForPatient(patient.id)
      const hasInvoice = existing.some((inv) => inv.period_start === periodStart)
      if (!hasInvoice) {
        await patientInvoiceService.generateInvoice(patient.id, patient.billing_rate)
      }
    }

    const allIds = patientsList.map((p) => p.id)
    const allInvoices = await patientInvoiceService.getInvoicesForPatients(allIds)
    const grouped: Record<string, PatientInvoice[]> = {}
    for (const inv of allInvoices) {
      if (!grouped[inv.patient_id]) grouped[inv.patient_id] = []
      grouped[inv.patient_id].push(inv)
    }
    setInvoices(grouped)
  }

  useEffect(() => {
    loadPatients()
    staffService.getAvailableStaff().then(setAvailableStaff).catch(console.error)
  }, [])

  // Scroll to highlighted patient when navigating from staff card
  useEffect(() => {
    if (!highlightedPatientId || patients.length === 0) return

    const el = document.getElementById(`patient-card-${highlightedPatientId}`)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      el.classList.add('ring-2', 'ring-emerald-400', 'ring-offset-2', 'ring-offset-black')
      const timer = setTimeout(() => {
        el.classList.remove('ring-2', 'ring-emerald-400', 'ring-offset-2', 'ring-offset-black')
      }, 3000)
      onClearHighlight?.()
      return () => clearTimeout(timer)
    }
  }, [highlightedPatientId, patients, onClearHighlight])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      await patientService.createPatient({
        ...formData,
        billing_rate: parseFloat(formData.billing_rate) || 0,
      })
      alert('Patient registered successfully!')
      setShowForm(false)
      setFormData({
        full_name: '',
        cnic: '',
        contact: '',
        gender: '',
        marital_status: '',
        date_of_birth: '',
        district: '',
        complete_address: '',
        service_type: '12h_day',
        billing_rate: '',
        status: 'Pending',
        start_date: new Date().toISOString().split('T')[0],
      })
      loadPatients()
    } catch (error) {
      console.error('Error registering patient:', error)
      alert('Registration failed')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <Loader2 className="text-emerald-500 animate-spin" size={40} />
        <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black">
          Syncing Residence Hub...
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-slate-900/40 border border-white/5 p-6 rounded-xl shadow-2xl">
        <div>
          <h2 className="text-xl font-black text-white uppercase tracking-tighter">
            Patient Admissions
          </h2>
          <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black mt-1">
            Karachi Active Households Ledger
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn-primary flex items-center gap-2 px-6"
        >
          {showForm ? (
            'Cancel Registration'
          ) : (
            <>
              <Plus size={16} /> Register Patient
            </>
          )}
        </button>
      </div>

      {showForm && (
        <div className="bg-slate-900/40 border border-white/5 p-8 rounded-xl shadow-2xl animate-in fade-in slide-in-from-top-4 duration-300">
          <h3 className="text-sm font-black text-blue-400 uppercase tracking-[0.2em] mb-6">
            Patient Registration Form
          </h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[9px] text-slate-500 uppercase font-black tracking-widest">
                Full Name
              </label>
              <input
                required
                value={formData.full_name}
                onChange={(e) =>
                  setFormData({ ...formData, full_name: formatNameInput(e.target.value) })
                }
                className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-emerald-500/40"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[9px] text-slate-500 uppercase font-black tracking-widest">
                CNIC (XXXXX-XXXXXXX-X)
              </label>
              <input
                placeholder="42101-1234567-1"
                value={formData.cnic}
                onChange={(e) =>
                  setFormData({ ...formData, cnic: formatCNICInput(e.target.value) })
                }
                className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-white text-sm font-mono outline-none focus:border-emerald-500/40"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[9px] text-slate-500 uppercase font-black tracking-widest">
                Mobile Number
              </label>
              <input
                required
                value={formData.contact}
                onChange={(e) =>
                  setFormData({ ...formData, contact: formatPhoneInput(e.target.value) })
                }
                className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-white text-sm font-mono outline-none focus:border-emerald-500/40"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[9px] text-slate-500 uppercase font-black tracking-widest">
                Gender
              </label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-emerald-500/40"
              >
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[9px] text-slate-500 uppercase font-black tracking-widest">
                Marital Status
              </label>
              <select
                value={formData.marital_status}
                onChange={(e) => setFormData({ ...formData, marital_status: e.target.value })}
                className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-emerald-500/40"
              >
                <option value="">Select...</option>
                <option value="Single">Single</option>
                <option value="Married">Married</option>
                <option value="Divorced">Divorced</option>
                <option value="Widowed">Widowed</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[9px] text-slate-500 uppercase font-black tracking-widest">
                Date of Birth
              </label>
              <input
                type="date"
                value={formData.date_of_birth}
                onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-emerald-500/40"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[9px] text-slate-500 uppercase font-black tracking-widest">
                Age
              </label>
              <input
                readOnly
                value={
                  formData.date_of_birth
                    ? (() => {
                        const b = new Date(formData.date_of_birth)
                        const t = new Date()
                        let a = t.getFullYear() - b.getFullYear()
                        const m = t.getMonth() - b.getMonth()
                        if (m < 0 || (m === 0 && t.getDate() < b.getDate())) a--
                        return a + ' years'
                      })()
                    : ''
                }
                className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-slate-400 text-sm font-mono outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[9px] text-slate-500 uppercase font-black tracking-widest">
                District (Karachi)
              </label>
              <select
                required
                value={formData.district}
                onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-emerald-500/40"
              >
                <option value="">Select District</option>
                <option value="South">South</option>
                <option value="East">East</option>
                <option value="West">West</option>
                <option value="Central">Central</option>
                <option value="Malir">Malir</option>
                <option value="Korangi">Korangi</option>
                <option value="Keamari">Keamari</option>
              </select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-[9px] text-slate-500 uppercase font-black tracking-widest">
                Complete Address
              </label>
              <textarea
                value={formData.complete_address}
                onChange={(e) => setFormData({ ...formData, complete_address: e.target.value })}
                className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-emerald-500/40 h-24"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[9px] text-slate-500 uppercase font-black tracking-widest">
                Service Type
              </label>
              <select
                value={formData.service_type}
                onChange={(e) => setFormData({ ...formData, service_type: e.target.value })}
                className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-emerald-500/40"
              >
                <option value="12h_day">12h Day</option>
                <option value="12h_night">12h Night</option>
                <option value="24h">24h Full</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[9px] text-slate-500 uppercase font-black tracking-widest">
                Monthly Package (PKR)
              </label>
              <input
                type="number"
                required
                value={formData.billing_rate}
                onChange={(e) => setFormData({ ...formData, billing_rate: e.target.value })}
                className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-emerald-400 text-sm font-mono outline-none focus:border-emerald-500/40"
              />
            </div>
            <div className="space-y-2 text-right md:col-span-2 mt-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-8 py-4 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-slate-950 text-xs font-black uppercase tracking-widest rounded-xl transition-all shadow-xl shadow-emerald-500/20 flex items-center gap-2 ml-auto"
              >
                {isSubmitting ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  'Confirm Registration'
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6">
        {patients.length === 0 ? (
          <div className="bg-slate-900/40 border border-dashed border-white/10 rounded-xl p-12 text-center">
            <ClipboardList className="text-slate-700 mx-auto mb-4" size={48} />
            <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">
              No entries found in registry
            </p>
          </div>
        ) : (
          patients.map((patient: any) => (
            <div
              key={patient.id}
              id={`patient-card-${patient.id}`}
              className="bg-slate-900/40 border border-white/5 rounded-2xl p-6 shadow-2xl group hover:border-white/10 transition-all scroll-mt-8"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 pb-6 border-b border-white/5">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 border border-emerald-500/20">
                    <User size={20} />
                  </div>
                  <div>
                    <h3 className="font-black text-white uppercase tracking-tighter text-xl">
                      {patient.full_name}
                    </h3>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold flex items-center gap-1">
                        <MapPin size={10} className="text-blue-500" /> {patient.district}
                      </span>
                      {patient.cnic && (
                        <>
                          <span className="w-1 h-1 bg-slate-800 rounded-full"></span>
                          <span className="text-[10px] text-slate-500 font-mono font-bold tracking-widest uppercase">
                            {patient.cnic}
                          </span>
                        </>
                      )}
                      <span className="w-1 h-1 bg-slate-800 rounded-full"></span>
                      <span
                        className={cn(
                          'px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border',
                          patient.status === 'Active'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                        )}
                      >
                        {patient.status}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between md:justify-end gap-8 bg-black/40 p-4 rounded-xl border border-white/5">
                  <div className="text-center md:text-right">
                    <p className="text-[9px] uppercase font-black text-slate-600 tracking-[0.2em] mb-1">
                      Monthly Package
                    </p>
                    <p className="text-lg font-mono font-bold text-emerald-400 tracking-tighter">
                      PKR {(patient.billing_rate || 0).toLocaleString()}
                    </p>
                  </div>
                  <div className="h-8 w-px bg-white/5 hidden md:block"></div>
                  <div className="text-center">
                    <p className="text-[9px] uppercase font-black text-slate-600 tracking-[0.2em] mb-1">
                      Service
                    </p>
                    <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-white uppercase">
                      <Clock size={12} className="text-blue-400" />{' '}
                      {patient.service_type?.replace('_', ' ') || '---'}
                    </div>
                  </div>
                </div>
              </div>

              {patient.complete_address && (
                <div className="mb-6 p-4 bg-white/5 rounded-xl border border-white/5">
                  <p className="text-[9px] text-slate-500 uppercase font-bold tracking-widest mb-1 flex items-center gap-2">
                    <MapPin size={10} /> Residence Address
                  </p>
                  <p className="text-[11px] text-slate-300 font-medium leading-relaxed">
                    {patient.complete_address}
                  </p>
                </div>
              )}

              {/* Intake Form Status */}
              <div className="mb-6 flex items-center justify-between bg-white/5 rounded-xl p-4 border border-white/10">
                <div className="flex items-center gap-3">
                  {intakeStatus[patient.id] ? (
                    <>
                      <CheckCircle2 size={18} className="text-emerald-400" />
                      <div>
                        <p className="text-sm font-bold text-emerald-400">
                          Terms & Conditions Agreed
                        </p>
                        <p className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">
                          Digital intake form completed
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <FileText size={16} className="text-slate-500" />
                      <div>
                        <p className="text-sm font-bold text-white">Intake Form Pending</p>
                        <p className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">
                          Send form to patient via WhatsApp
                        </p>
                      </div>
                    </>
                  )}
                </div>
                <button
                  onClick={() => {
                    const phone = patient.contact?.replace(/[^0-9]/g, '')
                    if (!phone) {
                      alert('Patient has no contact number on file.')
                      return
                    }
                    const msg = encodeURIComponent(
                      'HMSP Patient Intake Form\n\n' +
                        'Dear Patient, please fill this digital form to register for our home medical services. ' +
                        'The form includes our service agreement and terms & conditions.\n\n' +
                        'Link: https://nursingcareinfo.github.io/hmsp-dashboard/intake.html'
                    )
                    window.open(
                      `https://wa.me/${phone}?text=${msg}`,
                      '_blank',
                      'noopener,noreferrer'
                    )
                  }}
                  className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shrink-0"
                >
                  <MessageSquare size={14} />
                  Send to WhatsApp
                </button>
              </div>

              {/* Assignments & Manual Salary Slots */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white/5 rounded-xl p-4 border border-white/10 relative overflow-hidden">
                  <div className="absolute top-0 right-0 px-2 py-1 bg-blue-500/20 text-blue-400 text-[7px] font-black uppercase tracking-widest border-b border-l border-blue-500/30 rounded-bl-md">
                    Day Shift (12h)
                  </div>
                  <p className="text-[9px] text-slate-500 uppercase font-bold tracking-widest mb-3">
                    Assigned Staff
                  </p>
                  {(() => {
                    const dayAssignment = (assignments[patient.id] || []).find(
                      (a: any) => a.shift_type === 'Morning'
                    )
                    const assignKey = `${patient.id}:day`
                    if (dayAssignment) {
                      const emp = dayAssignment.employee
                      const rate =
                        dayAssignment.decided_rate_pkr ||
                        Math.round((emp?.expected_salary_pkr || 0) / 30)
                      return (
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-8 h-8 rounded-lg bg-emerald-500/5 flex items-center justify-center text-emerald-500 shrink-0">
                              <User size={14} />
                            </div>
                            <p className="text-sm font-bold text-white truncate">
                              {emp?.full_name || 'Staff Assigned'}
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-[8px] text-slate-500 uppercase font-bold tracking-widest mb-1">
                              Rate/Shift
                            </p>
                            <p className="text-xs font-mono font-bold text-emerald-400">
                              {formatPKR(rate)}
                            </p>
                          </div>
                        </div>
                      )
                    }
                    if (assigningSlot === assignKey) {
                      return (
                        <div className="space-y-3">
                          <p className="text-[9px] text-blue-400 uppercase font-bold tracking-widest">
                            Assign Day Staff
                          </p>
                          <select
                            value={assigningStaffId}
                            onChange={(e) => setAssigningStaffId(e.target.value)}
                            className="w-full bg-black/60 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-blue-500/40"
                          >
                            <option value="">Select staff...</option>
                            {availableStaff.map((s: any) => (
                              <option key={s.id} value={s.id}>
                                {s.full_name} — {s.district || 'N/A'}{' '}
                                {s.category ? `(${s.category})` : ''}
                              </option>
                            ))}
                          </select>
                          <div className="flex gap-2">
                            <button
                              disabled={!assigningStaffId || isAssigning}
                              onClick={async () => {
                                if (!assigningStaffId) return
                                setIsAssigning(true)
                                try {
                                  const emp = availableStaff.find((s) => s.id === assigningStaffId)
                                  await shiftService.logShift({
                                    employee_id: assigningStaffId,
                                    patient_id: patient.id,
                                    shift_date: new Date().toISOString().split('T')[0],
                                    shift_type: 'Morning',
                                    decided_rate_pkr: Math.round(
                                      (emp?.expected_salary_pkr || 0) / 30
                                    ),
                                    attendance_status: 'Scheduled',
                                  })
                                  // Mark staff as unavailable globally
                                  await staffService.updateStaff(assigningStaffId, {
                                    is_available: false,
                                  })
                                  await loadAssignments([patient.id])
                                  // Refresh available staff list
                                  staffService
                                    .getAvailableStaff()
                                    .then(setAvailableStaff)
                                    .catch(console.error)
                                  setAssigningSlot(null)
                                  setAssigningStaffId('')
                                } catch (err) {
                                  console.error('Error assigning staff:', err)
                                  alert('Failed to assign staff')
                                } finally {
                                  setIsAssigning(false)
                                }
                              }}
                              className="flex-1 px-3 py-2 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-black text-[9px] font-black uppercase tracking-widest rounded-lg transition-all"
                            >
                              {isAssigning ? 'Assigning...' : 'Confirm'}
                            </button>
                            <button
                              onClick={() => {
                                setAssigningSlot(null)
                                setAssigningStaffId('')
                              }}
                              className="px-3 py-2 bg-white/5 hover:bg-white/10 text-white text-[9px] font-black uppercase tracking-widest rounded-lg transition-all"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )
                    }
                    return (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-amber-400/50 text-[10px] uppercase font-bold italic py-2">
                          <AlertCircle size={14} /> Slot Unassigned
                        </div>
                        <button
                          onClick={() => {
                            setAssigningSlot(assignKey)
                            setAssigningStaffId('')
                          }}
                          className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-[9px] font-black uppercase tracking-widest text-blue-400 rounded-lg border border-white/10 transition-all"
                        >
                          Assign Staff +
                        </button>
                      </div>
                    )
                  })()}
                </div>

                {patient.service_type === '24hr' && (
                  <div className="bg-white/5 rounded-xl p-4 border border-white/10 relative overflow-hidden">
                    <div className="absolute top-0 right-0 px-2 py-1 bg-purple-500/20 text-purple-400 text-[7px] font-black uppercase tracking-widest border-b border-l border-purple-500/30 rounded-bl-md">
                      Night Shift (12h)
                    </div>
                    <p className="text-[9px] text-slate-500 uppercase font-bold tracking-widest mb-3">
                      Assigned Staff
                    </p>
                    {(() => {
                      const nightAssignment = (assignments[patient.id] || []).find(
                        (a: any) => a.shift_type === 'Night'
                      )
                      const nightAssignKey = `${patient.id}:night`
                      if (nightAssignment) {
                        const emp = nightAssignment.employee
                        const rate =
                          nightAssignment.decided_rate_pkr ||
                          Math.round((emp?.expected_salary_pkr || 0) / 30)
                        return (
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-8 h-8 rounded-lg bg-purple-500/5 flex items-center justify-center text-purple-400 shrink-0">
                                <User size={14} />
                              </div>
                              <p className="text-sm font-bold text-white truncate">
                                {emp?.full_name || 'Staff Assigned'}
                              </p>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="text-[8px] text-slate-500 uppercase font-bold tracking-widest mb-1">
                                Rate/Shift
                              </p>
                              <p className="text-xs font-mono font-bold text-purple-400">
                                {formatPKR(rate)}
                              </p>
                            </div>
                          </div>
                        )
                      }
                      if (assigningSlot === nightAssignKey) {
                        return (
                          <div className="space-y-3">
                            <p className="text-[9px] text-purple-400 uppercase font-bold tracking-widest">
                              Assign Night Staff
                            </p>
                            <select
                              value={assigningStaffId}
                              onChange={(e) => setAssigningStaffId(e.target.value)}
                              className="w-full bg-black/60 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-purple-500/40"
                            >
                              <option value="">Select staff...</option>
                              {availableStaff.map((s: any) => (
                                <option key={s.id} value={s.id}>
                                  {s.full_name} — {s.district || 'N/A'}{' '}
                                  {s.category ? `(${s.category})` : ''}
                                </option>
                              ))}
                            </select>
                            <div className="flex gap-2">
                              <button
                                disabled={!assigningStaffId || isAssigning}
                                onClick={async () => {
                                  if (!assigningStaffId) return
                                  setIsAssigning(true)
                                  try {
                                    const emp = availableStaff.find(
                                      (s) => s.id === assigningStaffId
                                    )
                                    await shiftService.logShift({
                                      employee_id: assigningStaffId,
                                      patient_id: patient.id,
                                      shift_date: new Date().toISOString().split('T')[0],
                                      shift_type: 'Night',
                                      decided_rate_pkr: Math.round(
                                        (emp?.expected_salary_pkr || 0) / 30
                                      ),
                                      attendance_status: 'Scheduled',
                                    })
                                    // Mark staff as unavailable globally
                                    await staffService.updateStaff(assigningStaffId, {
                                      is_available: false,
                                    })
                                    await loadAssignments([patient.id])
                                    // Refresh available staff list
                                    staffService
                                      .getAvailableStaff()
                                      .then(setAvailableStaff)
                                      .catch(console.error)
                                    setAssigningSlot(null)
                                    setAssigningStaffId('')
                                  } catch (err) {
                                    console.error('Error assigning staff:', err)
                                    alert('Failed to assign staff')
                                  } finally {
                                    setIsAssigning(false)
                                  }
                                }}
                                className="flex-1 px-3 py-2 bg-purple-500 hover:bg-purple-600 disabled:opacity-50 text-black text-[9px] font-black uppercase tracking-widest rounded-lg transition-all"
                              >
                                {isAssigning ? 'Assigning...' : 'Confirm'}
                              </button>
                              <button
                                onClick={() => {
                                  setAssigningSlot(null)
                                  setAssigningStaffId('')
                                }}
                                className="px-3 py-2 bg-white/5 hover:bg-white/10 text-white text-[9px] font-black uppercase tracking-widest rounded-lg transition-all"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        )
                      }
                      return (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-amber-400/50 text-[10px] uppercase font-bold italic py-2">
                            <AlertCircle size={14} /> Pending Match
                          </div>
                          <button
                            onClick={() => {
                              setAssigningSlot(nightAssignKey)
                              setAssigningStaffId('')
                            }}
                            className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-[9px] font-black uppercase tracking-widest text-purple-400 rounded-lg border border-white/10 transition-all"
                          >
                            Assign Staff +
                          </button>
                        </div>
                      )
                    })()}
                  </div>
                )}
              </div>

              {/* Invoices Section */}
              <div className="border-t border-white/5 pt-4 mt-4">
                <button
                  onClick={() => {
                    const next = new Set(expandedPatients)
                    if (next.has(patient.id)) next.delete(patient.id)
                    else next.add(patient.id)
                    setExpandedPatients(next)
                  }}
                  className="w-full flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white transition-colors"
                >
                  <div className="flex items-center gap-2">
                    {expandedPatients.has(patient.id) ? (
                      <ChevronDown size={14} />
                    ) : (
                      <ChevronRight size={14} />
                    )}
                    <Receipt size={14} />
                    Invoices ({(invoices[patient.id] || []).length})
                    {(() => {
                      const patientInvs = invoices[patient.id] || []
                      const unpaid = patientInvs.find((i) => i.status === 'Unpaid')
                      return unpaid ? (
                        <span className="text-amber-400 ml-2">
                          — PKR {unpaid.amount.toLocaleString()} • Unpaid
                        </span>
                      ) : null
                    })()}
                  </div>
                  <button
                    onClick={async (e) => {
                      e.stopPropagation()
                      await patientInvoiceService.generateInvoice(patient.id, patient.billing_rate)
                      const refreshed = await patientInvoiceService.getInvoicesForPatient(
                        patient.id
                      )
                      setInvoices((prev) => ({ ...prev, [patient.id]: refreshed }))
                    }}
                    className="text-[9px] px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 transition-colors"
                  >
                    + Generate Invoice
                  </button>
                </button>

                {expandedPatients.has(patient.id) && (
                  <div className="mt-3 space-y-1">
                    {(invoices[patient.id] || []).length === 0 ? (
                      <p className="text-[10px] text-slate-600 italic py-2 text-center">
                        No invoices yet
                      </p>
                    ) : (
                      (invoices[patient.id] || []).map((inv) => (
                        <div
                          key={inv.id}
                          className="flex items-center justify-between py-2 px-3 rounded-lg bg-white/5 border border-white/5 text-[11px]"
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-slate-400 font-mono">
                              {formatPeriod(inv.period_start, inv.period_end)}
                            </span>
                            <span className="font-mono font-bold text-emerald-400">
                              PKR {inv.amount.toLocaleString()}
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            {inv.status === 'Paid' ? (
                              <span className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-emerald-400">
                                <CheckCircle2 size={12} /> Paid
                              </span>
                            ) : inv.status === 'Cancelled' ? (
                              <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">
                                Cancelled
                              </span>
                            ) : (
                              <div className="flex items-center gap-2">
                                <span className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-amber-400">
                                  <Circle size={12} className="fill-amber-400/20" /> Unpaid
                                </span>
                                <button
                                  onClick={async () => {
                                    if (
                                      !confirm(
                                        `Mark invoice for PKR ${inv.amount.toLocaleString()} as PAID?`
                                      )
                                    )
                                      return
                                    await patientInvoiceService.markAsPaid(inv.id)
                                    const refreshed =
                                      await patientInvoiceService.getInvoicesForPatient(patient.id)
                                    setInvoices((prev) => ({ ...prev, [patient.id]: refreshed }))
                                  }}
                                  className="text-[8px] px-2 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 rounded-lg transition-colors font-black uppercase tracking-widest"
                                >
                                  Mark Paid
                                </button>
                                <button
                                  onClick={() => {
                                    const phone = patient.contact?.replace(/[^0-9]/g, '')
                                    if (!phone) {
                                      alert('Patient has no contact number.')
                                      return
                                    }
                                    const invoiceUrl = `https://nursingcareinfo.github.io/hmsp-dashboard/invoice.html?id=${inv.id}`
                                    const msg = encodeURIComponent(
                                      `HMSP Digital Invoice — #${inv.id.slice(0, 8).toUpperCase()}\n\n` +
                                        `Dear ${patient.full_name}, your invoice for home medical services is ready.\n\n` +
                                        `Amount: PKR ${inv.amount.toLocaleString()}\n` +
                                        `Period: ${new Date(inv.period_start).toLocaleDateString()} to ${new Date(inv.period_end).toLocaleDateString()}\n\n` +
                                        `View & Download: ${invoiceUrl}\n\n` +
                                        `Please settle the payment and notify the agency.`
                                    )
                                    window.open(
                                      `https://wa.me/${phone}?text=${msg}`,
                                      '_blank',
                                      'noopener,noreferrer'
                                    )
                                  }}
                                  className="text-[8px] px-2 py-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg transition-colors font-black uppercase tracking-widest flex items-center gap-1"
                                >
                                  <MessageSquare size={10} /> WhatsApp
                                </button>
                                <button
                                  onClick={() => {
                                    window.open(
                                      `https://nursingcareinfo.github.io/hmsp-dashboard/invoice.html?id=${inv.id}`,
                                      '_blank'
                                    )
                                  }}
                                  className="text-[8px] px-2 py-1 bg-white/5 hover:bg-white/10 text-slate-400 rounded-lg transition-colors font-black uppercase tracking-widest"
                                >
                                  View
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  title="Financial Ledger"
                  className="p-3 hover:bg-white/5 rounded-xl transition-colors border border-white/5 group-hover:border-white/10"
                >
                  <CreditCard
                    size={18}
                    className="text-slate-500 group-hover:text-white transition-colors"
                  />
                </button>
                <button className="flex-1 md:flex-none px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-[10px] font-black uppercase tracking-[0.2em] rounded-xl transition-all shadow-xl shadow-emerald-500/10">
                  Manage Case
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

function formatPeriod(start: string, end: string) {
  const s = new Date(start)
  const e = new Date(end)
  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ]
  return `${months[s.getMonth()]} ${s.getDate()}-${e.getDate()}, ${s.getFullYear()}`
}
