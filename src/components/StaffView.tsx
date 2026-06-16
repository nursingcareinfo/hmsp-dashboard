/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react'
import {
  Search,
  Filter,
  MoreVertical,
  Plus,
  Users,
  CheckCircle2,
  XCircle,
  Loader2,
  Banknote,
  DollarSign,
  Edit,
  MapPin,
  Star,
  Phone,
  Trash2,
  Calendar,
} from 'lucide-react'
import { Staff } from '../types'
import { cn, formatPKR, formatNameInput, formatCNICInput, formatPhoneInput } from '../lib/utils'
import { STAFF_CATEGORIES, KARACHI_AREAS } from '../constants'
import { staffService } from '../services/staffService'
import { advanceService } from '../services/advanceService'
import { patientService, type Patient } from '../services/patientService'
import { shiftService } from '../services/shiftService'
import StaffAttendanceCalendarModal from './StaffAttendanceCalendarModal'

export default function StaffView({
  setActiveView,
  onSelectPatient,
}: {
  setActiveView: (view: string) => void
  onSelectPatient: (patientId: string) => void
}) {
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('All')
  const [staffList, setStaffList] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    full_name: '',
    cnic_number: '',
    phone_primary: '',
    district: '',
    category: 'Nurse',
    position_applied: '',
    experience_years: 0,
    expected_salary_pkr: 0,
    day_shift_rate: 0,
    night_shift_rate: 0,
    is_active: true,
    is_available: true,
  })
  const [selectedStaffForAdvance, setSelectedStaffForAdvance] = useState<any | null>(null)
  const [advanceAmount, setAdvanceAmount] = useState('')
  const [isSubmittingAdvance, setIsSubmittingAdvance] = useState(false)
  const [selectedStaffForEdit, setSelectedStaffForEdit] = useState<any | null>(null)
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false)
  const [editFormData, setEditFormData] = useState({
    full_name: '',
    cnic_number: '',
    phone_primary: '',
    district: '',
    category: 'Nurse',
    position_applied: '',
    experience_years: 0,
    expected_salary_pkr: 0,
    day_shift_rate: 0,
    night_shift_rate: 0,
    is_active: true,
    is_available: true,
  })
  const [selectedStaffForDelete, setSelectedStaffForDelete] = useState<any | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [staffAssignments, setStaffAssignments] = useState<
    Record<string, { name: string; id: string; shiftType: string }>
  >({})
  const [selectedStaffForAttendance, setSelectedStaffForAttendance] = useState<any | null>(null)
  const [patients, setPatients] = useState<Patient[]>([])
  const [assigningStaffId, setAssigningStaffId] = useState<string | null>(null)
  const [assignPatientId, setAssignPatientId] = useState('')
  const [assignShiftType, setAssignShiftType] = useState<'Morning' | 'Night'>('Morning')
  const [isAssigningShift, setIsAssigningShift] = useState(false)

  const calculateAge = (dob: string | undefined) => {
    if (!dob) return null
    try {
      const birthDate = new Date(dob)
      const today = new Date()
      let age = today.getFullYear() - birthDate.getFullYear()
      const m = today.getMonth() - birthDate.getMonth()
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--
      }
      return age
    } catch {
      return null
    }
  }

  const handleToggleAvailability = async (staffId: string, currentStatus: boolean) => {
    try {
      await staffService.updateStaff(staffId, { is_available: !currentStatus })
      setStaffList((prev) =>
        prev.map((s) => (s.id === staffId ? { ...s, is_available: !currentStatus } : s))
      )
    } catch (error) {
      console.error('Error toggling availability:', error)
    }
  }

  const loadStaff = async () => {
    try {
      const data = await staffService.getAllStaff()
      setStaffList(data)

      // Fetch today's active shifts for each staff member
      const assignments: Record<string, { name: string; id: string; shiftType: string }> = {}
      await Promise.all(
        data.map(async (staff) => {
          if (!staff.is_available) {
            try {
              const shifts = await shiftService.getActiveShiftsForStaff(staff.id)
              if (shifts.length > 0) {
                const shift = shifts[0]
                assignments[staff.id] = {
                  name: shift.patient?.full_name || 'Unknown Patient',
                  id: shift.patient_id,
                  shiftType: shift.shift_type === 'Night' ? 'Night' : 'Day',
                }
              }
            } catch {
              // Silently fail — assignment info is optional
            }
          }
        })
      )
      setStaffAssignments(assignments)
    } catch (error) {
      console.error('Error fetching staff:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadStaff()
    patientService.getAllPatients().then(setPatients).catch(console.error)
  }, [])

  const handleRegisterStaff = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      await staffService.createStaff({
        ...formData,
        rating: 5.0,
        critical_missing_info:
          !formData.full_name || !formData.cnic_number || !formData.phone_primary,
      })
      alert('Staff registered successfully!')
      setShowForm(false)
      setFormData({
        full_name: '',
        cnic_number: '',
        phone_primary: '',
        district: '',
        category: 'Nurse',
        position_applied: '',
        experience_years: 0,
        expected_salary_pkr: 0,
        is_active: true,
        is_available: true,
      })
      loadStaff()
    } catch (error: any) {
      console.error('Error registering staff:', error)
      alert(`Registration failed: ${error.message || 'Unknown error'}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleAssignShift = async (staff: any) => {
    if (!assignPatientId || !assigningStaffId) return

    setIsAssigningShift(true)
    try {
      const rate = Math.round((staff.expected_salary_pkr || 0) / 30)

      await shiftService.logShift({
        employee_id: staff.id,
        patient_id: assignPatientId,
        shift_date: new Date().toISOString().split('T')[0],
        shift_type: assignShiftType,
        decided_rate_pkr: rate,
        attendance_status: 'Scheduled',
      })

      await staffService.updateStaff(staff.id, { is_available: false })
      setStaffList((prev) =>
        prev.map((s) => (s.id === staff.id ? { ...s, is_available: false } : s))
      )

      setAssigningStaffId(null)
      setAssignPatientId('')
      loadStaff()
    } catch (error) {
      console.error('Error assigning shift:', error)
    } finally {
      setIsAssigningShift(false)
    }
  }

  const handleGiveAdvance = async () => {
    if (!selectedStaffForAdvance || !advanceAmount) return

    setIsSubmittingAdvance(true)
    try {
      await advanceService.addAdvance({
        employee_id: selectedStaffForAdvance.id,
        amount_pkr: parseFloat(advanceAmount),
        payment_method: 'Cash', // Default to cash for quick advances
        status: 'Pending',
      })
      alert(`Advance of PKR ${advanceAmount} recorded for ${selectedStaffForAdvance.full_name}`)
      setSelectedStaffForAdvance(null)
      setAdvanceAmount('')
    } catch (error) {
      console.error('Error giving advance:', error)
      alert('Failed to record advance.')
    } finally {
      setIsSubmittingAdvance(false)
    }
  }

  const handleEditStaff = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedStaffForEdit) return

    setIsSubmittingEdit(true)
    try {
      await staffService.updateStaff(selectedStaffForEdit.id, editFormData)
      alert('Staff updated successfully!')
      setSelectedStaffForEdit(null)
      loadStaff() // Refresh the list
    } catch (error: any) {
      console.error('Error updating staff:', error)
      alert(`Update failed: ${error.message || 'Unknown error'}`)
    } finally {
      setIsSubmittingEdit(false)
    }
  }

  const handleDeleteStaff = async () => {
    if (!selectedStaffForDelete) return

    setIsDeleting(true)
    try {
      await staffService.deleteStaff(selectedStaffForDelete.id)
      alert('Staff deleted successfully!')
      setSelectedStaffForDelete(null)
      loadStaff() // Refresh the list
    } catch (error: any) {
      console.error('Error deleting staff:', error)
      alert(`Delete failed: ${error.message || 'Unknown error'}`)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleStartEdit = (staff: any) => {
    setSelectedStaffForEdit(staff)
    setEditFormData({
      full_name: staff.full_name || '',
      cnic_number: staff.cnic_number || '',
      phone_primary: staff.phone_primary || '',
      district: staff.district || '',
      category: staff.category || 'Nurse',
      position_applied: staff.position_applied || '',
      experience_years: staff.experience_years || 0,
      expected_salary_pkr: staff.expected_salary_pkr || 0,
      is_active: staff.is_active ?? true,
      is_available: staff.is_available ?? true,
    })
  }

  const filteredStaff = staffList.filter((s) => {
    const matchesSearch =
      (s.full_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.district || '').toLowerCase().includes(searchTerm.toLowerCase())

    if (categoryFilter === 'Action Required') {
      return matchesSearch && s.critical_missing_info
    }

    const matchesCategory =
      categoryFilter === 'All' ||
      s.position_applied === categoryFilter ||
      s.category === categoryFilter
    return matchesSearch && matchesCategory
  })

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <Loader2 className="text-emerald-500 animate-spin" size={40} />
        <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black">
          Decrypting Staff Ledger...
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white/5 p-4 rounded-xl border border-white/5">
        <div>
          <h2 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
            Staff Management
          </h2>
          <p className="text-[9px] text-slate-500 uppercase font-bold tracking-widest mt-0.5">
            Manage and register Karachi medical professionals
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn-primary flex items-center gap-2 px-6"
        >
          {showForm ? (
            'Cancel'
          ) : (
            <>
              <Plus size={16} /> Register Staff
            </>
          )}
        </button>
      </div>

      {showForm && (
        <div className="bg-slate-900/40 border border-white/5 p-8 rounded-xl shadow-2xl animate-in fade-in slide-in-from-top-4 duration-300">
          <h3 className="text-sm font-black text-blue-400 uppercase tracking-[0.2em] mb-6">
            Staff Registration Form
          </h3>
          <form onSubmit={handleRegisterStaff} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[9px] text-slate-500 uppercase font-black tracking-widest text-left block">
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
              <label className="text-[9px] text-slate-500 uppercase font-black tracking-widest text-left block">
                CNIC (XXXXX-XXXXXXX-X)
              </label>
              <input
                required
                placeholder="42101-1234567-1"
                value={formData.cnic_number}
                onChange={(e) =>
                  setFormData({ ...formData, cnic_number: formatCNICInput(e.target.value) })
                }
                className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-white text-sm font-mono outline-none focus:border-emerald-500/40"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[9px] text-slate-500 uppercase font-black tracking-widest text-left block">
                Mobile Number
              </label>
              <input
                required
                value={formData.phone_primary}
                onChange={(e) =>
                  setFormData({ ...formData, phone_primary: formatPhoneInput(e.target.value) })
                }
                className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-white text-sm font-mono outline-none focus:border-emerald-500/40"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[9px] text-slate-500 uppercase font-black tracking-widest text-left block">
                District
              </label>
              <select
                required
                value={formData.district}
                onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-emerald-500/40"
              >
                <option value="">Select District</option>
                {KARACHI_AREAS.map((area) => (
                  <option key={area} value={area}>
                    {area}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[9px] text-slate-500 uppercase font-black tracking-widest text-left block">
                Category
              </label>
              <select
                required
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-emerald-500/40"
              >
                {STAFF_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[9px] text-slate-500 uppercase font-black tracking-widest text-left block">
                Position Applied
              </label>
              <input
                required
                value={formData.position_applied}
                onChange={(e) => setFormData({ ...formData, position_applied: e.target.value })}
                className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-emerald-500/40"
                placeholder="e.g. ICU Nurse"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[9px] text-slate-500 uppercase font-black tracking-widest text-left block">
                Experience Years
              </label>
              <input
                type="number"
                value={formData.experience_years}
                onChange={(e) =>
                  setFormData({ ...formData, experience_years: parseInt(e.target.value) || 0 })
                }
                className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-white text-sm font-mono outline-none focus:border-emerald-500/40"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[9px] text-slate-500 uppercase font-black tracking-widest text-left block">
                Decided Salary (per shift)
              </label>
              <input
                type="number"
                value={formData.expected_salary_pkr / 30 || 0}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    expected_salary_pkr: (parseInt(e.target.value) || 0) * 30,
                  })
                }
                className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-emerald-400 text-sm font-mono outline-none focus:border-emerald-500/40"
              />
              <p className="text-[8px] text-slate-500 font-mono">
                = Rs {(formData.expected_salary_pkr || 0).toLocaleString()}/month
              </p>
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
                  'Register Professional'
                )}
              </button>
            </div>{' '}
          </form>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center justify-between">
        <div className="relative flex-1 min-w-[300px]">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-ink-dim)]"
            size={18}
          />
          <input
            type="text"
            placeholder="Search staff by name or area..."
            className="w-full pl-10 input-field"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex gap-2 mb-2 w-full overflow-x-auto pb-2 scrollbar-hide">
          {['All', 'Action Required', ...STAFF_CATEGORIES].map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={cn(
                'px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all shrink-0 whitespace-nowrap',
                categoryFilter === cat
                  ? cat === 'Action Required'
                    ? 'bg-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.4)]'
                    : 'bg-emerald-500 text-slate-950'
                  : 'bg-slate-900 text-slate-500 hover:text-slate-300 border border-white/5'
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Staff Grid */}
      {filteredStaff.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredStaff.map((staff) => (
            <div
              key={staff.id}
              className={cn(
                'bg-slate-900/60 border border-white/5 rounded-2xl overflow-hidden hover:border-white/10 transition-all group',
                staff.critical_missing_info && 'border-red-500/30 ring-1 ring-red-500/20'
              )}
            >
              {/* Header - Avatar + Name + Quick Actions */}
              <div className="p-4 flex items-start gap-4 border-b border-white/5">
                {/* Avatar */}
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 flex items-center justify-center text-lg font-bold text-emerald-400 shrink-0">
                  {(staff.full_name || '?')[0]}
                </div>

                {/* Name + ID */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-bold text-white truncate flex items-center gap-2">
                    {staff.full_name}
                    {staff.is_verified && (
                      <CheckCircle2 size={14} className="text-blue-400 shrink-0" />
                    )}
                  </h3>
                  <p className="text-[10px] font-mono text-emerald-500/80 uppercase tracking-wider">
                    {staff.emp_no}
                  </p>
                </div>

                {/* Action buttons */}
                <div className="flex gap-1 shrink-0">
                  <button
                    onClick={() => handleStartEdit(staff)}
                    className="p-1.5 hover:bg-white/5 rounded-lg transition-colors text-slate-500 hover:text-blue-400"
                    title="Edit"
                  >
                    <Edit size={14} />
                  </button>
                  <button
                    onClick={() => setSelectedStaffForDelete(staff)}
                    className="p-1.5 hover:bg-white/5 rounded-lg transition-colors text-slate-500 hover:text-red-400"
                    title="Delete"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {/* Position + Location */}
              <div className="px-4 py-3 flex flex-wrap gap-2">
                <span className="text-[10px] font-medium px-2 py-1 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  {staff.position_applied}
                </span>
                <span className="text-[10px] font-medium px-2 py-1 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center gap-1">
                  <MapPin size={10} /> {staff.district}
                </span>
                {staff.category && staff.category !== staff.position_applied && (
                  <span className="text-[10px] font-medium px-2 py-1 rounded-md bg-white/5 text-slate-400 border border-white/10">
                    {staff.category}
                  </span>
                )}
              </div>

              {/* Details Row */}
              <div className="px-4 py-2 flex flex-wrap gap-1.5 text-[9px]">
                {staff.religion && <span className="text-slate-500">{staff.religion}</span>}
                {calculateAge(staff.dob) && (
                  <span className="text-slate-500">Age {calculateAge(staff.dob)}</span>
                )}
                {staff.father_husband_name && (
                  <span
                    className="text-blue-400/80 truncate max-w-[100px]"
                    title={staff.father_husband_name}
                  >
                    • {staff.father_husband_name}
                  </span>
                )}
                {staff.marital_status && (
                  <span className="text-purple-400/80">• {staff.marital_status}</span>
                )}
              </div>

              {/* Stats Row */}
              <div className="px-4 py-3 flex items-center justify-between border-t border-white/5 bg-black/20">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    <Star size={12} className="text-amber-400" fill="currentColor" />
                    <span className="text-[11px] font-mono font-bold text-amber-400">
                      {(staff.rating || 0).toFixed(1)}
                    </span>
                  </div>
                  <div className="w-px h-4 bg-white/10" />
                  <div className="text-[11px] font-mono font-bold text-emerald-400">
                    Rs.{Math.round((staff.expected_salary_pkr || 0) / 30).toLocaleString()}
                    <span className="text-[8px] text-slate-500 ml-0.5">/shift</span>
                  </div>
                </div>

                {/* Availability Toggle */}
                <div className="flex flex-col items-end gap-1">
                  <button
                    onClick={() =>
                      staff.is_available
                        ? setAssigningStaffId(assigningStaffId === staff.id ? null : staff.id)
                        : handleToggleAvailability(staff.id, true)
                    }
                    className={cn(
                      'px-2.5 py-1 rounded-md text-[9px] font-bold uppercase tracking-wider transition-all',
                      staff.is_available
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                        : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                    )}
                  >
                    {staff.is_available ? 'Available' : 'On Duty'}
                  </button>
                  {!staff.is_available && staffAssignments[staff.id] && (
                    <div className="flex flex-col items-end gap-0.5">
                      <span className="text-[9px] font-mono font-bold uppercase tracking-wider"
                        style={{ color: staffAssignments[staff.id].shiftType === 'Night' ? '#818cf8' : '#f59e0b' }}
                      >
                        {staffAssignments[staff.id].shiftType === 'Night' ? '🌙 NIGHT' : '☀ DAY'}
                      </span>
                      <button
                        onClick={() => {
                          onSelectPatient(staffAssignments[staff.id].id)
                          setActiveView('patients')
                        }}
                        className="text-[11px] text-blue-400 font-bold truncate max-w-[140px] hover:text-blue-300 hover:underline transition-all"
                        title="View patient details"
                      >
                        {staffAssignments[staff.id].name}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Inline Assignment UI */}
              {assigningStaffId === staff.id && (
                <div className="px-4 py-3 border-t border-white/5 bg-emerald-500/5">
                  <div className="space-y-3">
                    <p className="text-[9px] text-emerald-400 font-bold uppercase tracking-widest">
                      Assign to Patient
                    </p>
                    <select
                      value={assignPatientId}
                      onChange={(e) => setAssignPatientId(e.target.value)}
                      className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-white text-[10px] font-mono outline-none focus:border-emerald-500"
                    >
                      <option value="">Select patient...</option>
                      {patients
                        .filter((p) => p.status === 'Active')
                        .map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.full_name} — {p.district}
                          </option>
                        ))}
                    </select>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setAssignShiftType('Morning')}
                        className={cn(
                          'flex-1 py-2 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all border',
                          assignShiftType === 'Morning'
                            ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                            : 'bg-slate-800 text-slate-500 border-white/10 hover:text-slate-300'
                        )}
                      >
                        ☀ Day
                      </button>
                      <button
                        onClick={() => setAssignShiftType('Night')}
                        className={cn(
                          'flex-1 py-2 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all border',
                          assignShiftType === 'Night'
                            ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/40'
                            : 'bg-slate-800 text-slate-500 border-white/10 hover:text-slate-300'
                        )}
                      >
                        🌙 Night
                      </button>
                    </div>
                    {assignPatientId && (
                      <p className="text-[8px] text-slate-500 font-mono">
                        Rate: Rs{' '}
                        {Math.round((staff.expected_salary_pkr || 0) / 30).toLocaleString()}
                        /shift
                      </p>
                    )}
                    <div className="flex gap-2">
                      <button
                        onClick={() => setAssigningStaffId(null)}
                        className="flex-1 py-2 bg-slate-700 hover:bg-slate-600 text-white text-[9px] font-bold uppercase tracking-widest rounded-lg transition-all"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleAssignShift(staff)}
                        disabled={!assignPatientId || isAssigningShift}
                        className="flex-1 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:grayscale text-slate-950 text-[9px] font-bold uppercase tracking-widest rounded-lg transition-all flex items-center justify-center gap-1"
                      >
                        {isAssigningShift ? (
                          <Loader2 size={12} className="animate-spin" />
                        ) : (
                          'Assign'
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Footer - Skills + Actions */}
              <div className="px-4 py-3 border-t border-white/5 flex items-center justify-between gap-3">
                {/* Skills */}
                <div className="flex items-center gap-1.5 overflow-hidden">
                  {(staff.skills || []).slice(0, 2).map((skill: string) => (
                    <span
                      key={skill}
                      className="text-[8px] font-medium px-1.5 py-0.5 bg-white/5 rounded text-slate-500 whitespace-nowrap"
                    >
                      {skill}
                    </span>
                  ))}
                  {(staff.skills || []).length > 2 && (
                    <span className="text-[8px] text-slate-600">+{staff.skills.length - 2}</span>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 shrink-0">
                  {staff.relative_info && (
                    <div className="group/contact relative">
                      <button className="p-1.5 hover:bg-white/5 rounded-lg transition-colors text-slate-500 hover:text-red-400">
                        <Phone size={14} />
                      </button>
                      {/* Tooltip */}
                      <div className="absolute bottom-full right-0 mb-2 px-3 py-2 bg-slate-800 border border-white/10 rounded-lg opacity-0 group-hover/contact:opacity-100 transition-opacity pointer-events-none z-10 whitespace-nowrap">
                        <p className="text-[10px] text-white font-bold">
                          {staff.relative_info.name}
                        </p>
                        <p className="text-[9px] text-slate-400">{staff.relative_info.phone}</p>
                        <p className="text-[8px] text-slate-500">
                          {staff.relative_info.relationship}
                        </p>
                      </div>
                    </div>
                  )}
                  <button
                    onClick={() => setSelectedStaffForAttendance(staff)}
                    className="flex items-center gap-1 px-2 py-1 text-[9px] font-medium text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 rounded-md transition-all"
                    title="Mark Attendance"
                  >
                    <Calendar size={12} />
                    <span>Attendance</span>
                  </button>
                  <button
                    onClick={() => setSelectedStaffForAdvance(staff)}
                    className="flex items-center gap-1 px-2 py-1 text-[9px] font-medium text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 rounded-md transition-all"
                  >
                    <Banknote size={12} />
                    <span>Advance</span>
                  </button>
                </div>
              </div>

              {/* Critical Info Alert */}
              {staff.critical_missing_info && (
                <div className="px-4 py-2 bg-red-500/10 border-t border-red-500/20 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                  <span className="text-[9px] font-medium text-red-400">
                    Missing critical info - needs review
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-20 text-center flex flex-col items-center justify-center">
          <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-6 border border-white/10 text-slate-500">
            <Users size={32} />
          </div>
          <h3 className="text-sm font-black text-white uppercase tracking-widest">
            No Staff Members Found
          </h3>
          <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mt-2 max-w-xs leading-relaxed">
            {searchTerm || categoryFilter !== 'All'
              ? "We couldn't find any staff matching your current search or filters."
              : 'The HQ Ledger is currently empty. Use the Register button or AI OCR to add professionals.'}
          </p>
          {(searchTerm || categoryFilter !== 'All') && (
            <button
              onClick={() => {
                setSearchTerm('')
                setCategoryFilter('All')
              }}
              className="mt-6 text-[10px] font-black text-emerald-400 uppercase tracking-widest border-b border-emerald-400/30 hover:border-emerald-400 transition-all pb-1"
            >
              Clear all filters
            </button>
          )}
        </div>
      )}

      {/* Advance Modal */}
      {selectedStaffForAdvance && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-slate-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xs font-black text-emerald-400 uppercase tracking-widest flex items-center gap-2">
                <Banknote size={16} /> Disburse Advance
              </h3>
              <button
                onClick={() => setSelectedStaffForAdvance(null)}
                className="text-slate-500 hover:text-white"
              >
                <XCircle size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-2">
                  Recipient
                </p>
                <p className="text-sm font-bold text-white mb-4">
                  {selectedStaffForAdvance.full_name}
                </p>

                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-2">
                  Amount (PKR)
                </p>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-500 font-bold ml-1">
                    Rs.
                  </span>
                  <input
                    type="number"
                    value={advanceAmount}
                    onChange={(e) => setAdvanceAmount(e.target.value)}
                    placeholder="E.g. 5000"
                    className="w-full bg-slate-800 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white font-mono focus:border-emerald-500 outline-none"
                    autoFocus
                  />
                </div>
              </div>

              <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-4">
                <p className="text-[9px] text-emerald-400 font-bold uppercase tracking-widest leading-relaxed">
                  Notice: Advances are automatically deducted from the Gross Accrual at end of
                  month. No manual entries required in Payout ledger.
                </p>
              </div>

              <button
                onClick={handleGiveAdvance}
                disabled={!advanceAmount || isSubmittingAdvance}
                className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 disabled:grayscale transition-all text-slate-950 font-black text-[10px] uppercase tracking-widest rounded-xl shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
              >
                {isSubmittingAdvance ? (
                  <Loader2 className="animate-spin" size={16} />
                ) : (
                  <>Confirm Disbursement</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Staff Modal */}
      {selectedStaffForEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl bg-slate-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-white/5">
              <h3 className="text-sm font-black text-blue-400 uppercase tracking-[0.2em]">
                Edit Staff Profile
              </h3>
              <button
                onClick={() => setSelectedStaffForEdit(null)}
                className="text-slate-500 hover:text-white"
              >
                <XCircle size={20} />
              </button>
            </div>

            <form onSubmit={handleEditStaff} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[9px] text-slate-500 uppercase font-black tracking-widest text-left block">
                    Full Name
                  </label>
                  <input
                    required
                    value={editFormData.full_name}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        full_name: formatNameInput(e.target.value),
                      })
                    }
                    className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-blue-500/40"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] text-slate-500 uppercase font-black tracking-widest text-left block">
                    CNIC (XXXXX-XXXXXXX-X)
                  </label>
                  <input
                    required
                    placeholder="42101-1234567-1"
                    value={editFormData.cnic_number}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        cnic_number: formatCNICInput(e.target.value),
                      })
                    }
                    className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-white text-sm font-mono outline-none focus:border-blue-500/40"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] text-slate-500 uppercase font-black tracking-widest text-left block">
                    Mobile Number
                  </label>
                  <input
                    required
                    value={editFormData.phone_primary}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        phone_primary: formatPhoneInput(e.target.value),
                      })
                    }
                    className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-white text-sm font-mono outline-none focus:border-blue-500/40"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] text-slate-500 uppercase font-black tracking-widest text-left block">
                    District
                  </label>
                  <select
                    required
                    value={editFormData.district}
                    onChange={(e) => setEditFormData({ ...editFormData, district: e.target.value })}
                    className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-blue-500/40"
                  >
                    <option value="">Select District</option>
                    {KARACHI_AREAS.map((area) => (
                      <option key={area} value={area}>
                        {area}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] text-slate-500 uppercase font-black tracking-widest text-left block">
                    Category
                  </label>
                  <select
                    required
                    value={editFormData.category}
                    onChange={(e) => setEditFormData({ ...editFormData, category: e.target.value })}
                    className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-blue-500/40"
                  >
                    {STAFF_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] text-slate-500 uppercase font-black tracking-widest text-left block">
                    Position Applied
                  </label>
                  <input
                    required
                    value={editFormData.position_applied}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, position_applied: e.target.value })
                    }
                    className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-blue-500/40"
                    placeholder="e.g. ICU Nurse"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] text-slate-500 uppercase font-black tracking-widest text-left block">
                    Experience Years
                  </label>
                  <input
                    type="number"
                    value={editFormData.experience_years}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        experience_years: parseInt(e.target.value) || 0,
                      })
                    }
                    className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-white text-sm font-mono outline-none focus:border-blue-500/40"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] text-slate-500 uppercase font-black tracking-widest text-left block">
                    Decided Salary (per shift)
                  </label>
                  <input
                    type="number"
                    value={editFormData.expected_salary_pkr / 30 || 0}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        expected_salary_pkr: (parseInt(e.target.value) || 0) * 30,
                      })
                    }
                    className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-emerald-400 text-sm font-mono outline-none focus:border-blue-500/40"
                  />
                  <p className="text-[8px] text-slate-500 font-mono">
                    = Rs {(editFormData.expected_salary_pkr || 0).toLocaleString()}/month
                  </p>
                </div>
              </div>

              {/* Checkboxes and actions are outside the 2-column grid */}
              <div className="flex items-center gap-4 mt-8 pt-6 border-t border-white/5">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editFormData.is_active}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, is_active: e.target.checked })
                    }
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-[10px] text-slate-400 uppercase font-black tracking-widest">
                    Active Staff Member
                  </span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editFormData.is_available}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, is_available: e.target.checked })
                    }
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-[10px] text-slate-400 uppercase font-black tracking-widest">
                    Currently Available
                  </span>
                </label>
              </div>

              <div className="flex gap-4 mt-8">
                <button
                  type="button"
                  onClick={() => setSelectedStaffForEdit(null)}
                  className="flex-1 py-4 bg-slate-700 hover:bg-slate-600 text-white font-black text-[10px] uppercase tracking-widest rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingEdit}
                  className="flex-1 py-4 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-slate-950 text-[10px] uppercase tracking-widest rounded-xl shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2"
                >
                  {isSubmittingEdit ? (
                    <Loader2 className="animate-spin" size={16} />
                  ) : (
                    'Update Profile'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {selectedStaffForDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-slate-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-black text-red-400 uppercase tracking-[0.2em] flex items-center gap-2">
                <Trash2 size={20} /> Delete Staff Member
              </h3>
              <button
                onClick={() => setSelectedStaffForDelete(null)}
                className="text-slate-500 hover:text-white"
              >
                <XCircle size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                <p className="text-red-400 font-bold text-sm mb-2">
                  ⚠️ This action cannot be undone
                </p>
                <p className="text-slate-300 text-sm leading-relaxed">
                  You are about to permanently delete{' '}
                  <strong>{selectedStaffForDelete.full_name}</strong> (ID:{' '}
                  {selectedStaffForDelete.emp_no}) from the system. This will remove all associated
                  data including shifts, advances, and attendance records.
                </p>
              </div>

              <div className="bg-slate-800 border border-white/5 rounded-xl p-4">
                <h4 className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-2">
                  Staff Details
                </h4>
                <div className="space-y-1 text-sm">
                  <p className="text-white">
                    <strong>Name:</strong> {selectedStaffForDelete.full_name}
                  </p>
                  <p className="text-slate-300">
                    <strong>ID:</strong> {selectedStaffForDelete.emp_no}
                  </p>
                  <p className="text-slate-300">
                    <strong>Position:</strong> {selectedStaffForDelete.position_applied}
                  </p>
                  <p className="text-slate-300">
                    <strong>District:</strong> {selectedStaffForDelete.district}
                  </p>
                </div>
              </div>

              <div className="flex gap-4 mt-8">
                <button
                  onClick={() => setSelectedStaffForDelete(null)}
                  className="flex-1 py-4 bg-slate-700 hover:bg-slate-600 text-white font-black text-[10px] uppercase tracking-widest rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteStaff}
                  disabled={isDeleting}
                  className="flex-1 py-4 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white text-[10px] uppercase tracking-widest rounded-xl shadow-lg shadow-red-500/20 flex items-center justify-center gap-2"
                >
                  {isDeleting ? (
                    <Loader2 className="animate-spin" size={16} />
                  ) : (
                    <>
                      <Trash2 size={14} />
                      Delete Staff
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Attendance Modal */}
      {selectedStaffForAttendance && (
        <StaffAttendanceCalendarModal
          staffId={selectedStaffForAttendance.id}
          staffName={selectedStaffForAttendance.full_name}
          empNo={selectedStaffForAttendance.emp_no}
          dayRate={selectedStaffForAttendance.day_shift_rate}
          nightRate={selectedStaffForAttendance.night_shift_rate}
          expectedSalary={selectedStaffForAttendance.expected_salary_pkr}
          onClose={() => setSelectedStaffForAttendance(null)}
        />
      )}
    </div>
  )
}
