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
  Ban,
  Receipt,
  UserX,
  Undo2,
} from 'lucide-react'
import { Staff } from '../types'
import { cn, formatPKR, formatNameInput, formatCNICInput, formatPhoneInput } from '../lib/utils'
import { fillRandomStaff } from '../lib/randomData'
import { STAFF_CATEGORIES, KARACHI_AREAS } from '../constants'
import { staffService } from '../services/staffService'
import { advanceService } from '../services/advanceService'
import { patientService, type Patient } from '../services/patientService'
import { shiftService } from '../services/shiftService'
import StaffAttendanceCalendarModal from './StaffAttendanceCalendarModal'
import StaffLedgerModal from './StaffLedgerModal'

export default function StaffView({
  setActiveView,
  onSelectPatient,
}: {
  setActiveView: (view: string) => void
  onSelectPatient: (patientId: string) => void
}) {
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('All')
  const [availabilityFilter, setAvailabilityFilter] = useState('All')
  const [staffList, setStaffList] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    full_name: '',
    cnic_number: '',
    phone_primary: '',
    gender: '',
    marital_status: '',
    religion: '',
    dob: '',
    district: '',
    category: 'Nurse',
    position_applied: '',
    experience_years: 0,
    expected_salary_pkr: 0,
    is_active: true,
    is_available: true,
  })
  const [selectedStaffForAdvance, setSelectedStaffForAdvance] = useState<any | null>(null)
  const [advanceAmount, setAdvanceAmount] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<string>('Cash')
  const [recentAdvances, setRecentAdvances] = useState<any[]>([])
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
    is_active: true,
    is_available: true,
  })
  const [selectedStaffForDelete, setSelectedStaffForDelete] = useState<any | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [staffAssignments, setStaffAssignments] = useState<
    Record<string, { name: string; id: string; shiftType: string }>
  >({})
  const [selectedStaffForAttendance, setSelectedStaffForAttendance] = useState<any | null>(null)
  const [selectedStaffForLedger, setSelectedStaffForLedger] = useState<any | null>(null)
  const [patients, setPatients] = useState<Patient[]>([])
  const [assigningStaffId, setAssigningStaffId] = useState<string | null>(null)
  const [assignPatientId, setAssignPatientId] = useState('')
  const [assignShiftType, setAssignShiftType] = useState<'Morning' | 'Night'>('Morning')
  const [isAssigningShift, setIsAssigningShift] = useState(false)
  const [selectedStaffForEndService, setSelectedStaffForEndService] = useState<any | null>(null)
  const [endServiceDate, setEndServiceDate] = useState('')
  const [endServiceReason, setEndServiceReason] = useState('')
  const [endServiceNotes, setEndServiceNotes] = useState('')
  const [isEndingService, setIsEndingService] = useState(false)
  const [isReinstating, setIsReinstating] = useState(false)

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

  useEffect(() => {
    if (selectedStaffForAdvance) {
      advanceService.getAdvancesByEmployee(selectedStaffForAdvance.id).then((advances) => {
        setRecentAdvances(advances.slice(0, 3))
      })
    }
  }, [selectedStaffForAdvance])

  const handleToggleBlacklist = async (staff: any) => {
    const newStatus = !staff.is_blacklisted
    // Optimistic update: update UI immediately, revert on failure
    setStaffList((prev) =>
      prev.map((s) => (s.id === staff.id ? { ...s, is_blacklisted: newStatus } : s))
    )
    try {
      await staffService.updateStaff(staff.id, { is_blacklisted: newStatus })
    } catch (error) {
      console.error('Error toggling blacklist:', error)
      // Revert optimistic update on failure
      setStaffList((prev) =>
        prev.map((s) => (s.id === staff.id ? { ...s, is_blacklisted: !newStatus } : s))
      )
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
    patientService
      .getAllPatients()
      .then(setPatients)
      .catch((err) => {
        console.error('Error fetching patients:', err)
      })
  }, [])

  const handleRegisterStaff = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      await staffService.createStaff({
        ...formData,
        dob: formData.dob || null,
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
        gender: '',
        marital_status: '',
        religion: '',
        dob: '',
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
      alert('Registration failed. Please try again or contact support.')
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
        payment_method: paymentMethod as 'Cash' | 'JazzCash' | 'EasyPesa' | 'Bank',
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
      alert('Update failed. Please try again or contact support.')
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
      alert('Delete failed. Please try again or contact support.')
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

    const matchesAvailability =
      availabilityFilter === 'All' ||
      (availabilityFilter === 'Available' && s.is_available && !s.service_end_date) ||
      (availabilityFilter === 'On Duty' && !s.is_available && !s.service_end_date) ||
      (availabilityFilter === 'Blacklisted' && s.is_blacklisted && !s.service_end_date) ||
      (availabilityFilter === 'Service Ended' && s.service_end_date)

    return matchesSearch && matchesCategory && matchesAvailability
  })

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <Loader2 className="text-emerald-500 animate-spin" size={40} />
        <p className="text-[10px] text-gray-500 dark:text-neutral-400 uppercase tracking-widest font-black">
          Decrypting Staff Ledger...
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-gray-50 dark:bg-neutral-800/80 p-4 rounded-xl border border-gray-200 dark:border-neutral-700">
        <div>
          <h2 className="text-sm font-black text-gray-800 dark:text-neutral-100 uppercase tracking-widest flex items-center gap-2">
            Staff Management
          </h2>
          <p className="text-[9px] text-gray-500 dark:text-neutral-400 uppercase font-bold tracking-widest mt-0.5">
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
        <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 p-8 rounded-xl shadow-2xl dark:shadow-none animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-black text-blue-600 dark:text-blue-300 uppercase tracking-[0.2em]">
              Staff Registration Form
            </h3>
            <button
              type="button"
              onClick={() => setFormData(fillRandomStaff(formData))}
              className="text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 hover:bg-amber-100 dark:hover:bg-amber-950 transition-colors"
            >
              Fill Random
            </button>
          </div>
          <form onSubmit={handleRegisterStaff} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[9px] text-gray-500 dark:text-neutral-400 uppercase font-black tracking-widest text-left block">
                Full Name
              </label>
              <input
                required
                value={formData.full_name}
                onChange={(e) =>
                  setFormData({ ...formData, full_name: formatNameInput(e.target.value) })
                }
                className="w-full bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 rounded-xl px-4 py-3 text-gray-800 dark:text-neutral-100 text-sm outline-none focus:border-emerald-500/40"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[9px] text-gray-500 dark:text-neutral-400 uppercase font-black tracking-widest text-left block">
                CNIC (XXXXX-XXXXXXX-X)
              </label>
              <input
                required
                placeholder="42101-1234567-1"
                value={formData.cnic_number}
                onChange={(e) =>
                  setFormData({ ...formData, cnic_number: formatCNICInput(e.target.value) })
                }
                className="w-full bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 rounded-xl px-4 py-3 text-gray-800 dark:text-neutral-100 text-sm font-mono outline-none focus:border-emerald-500/40"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[9px] text-gray-500 dark:text-neutral-400 uppercase font-black tracking-widest text-left block">
                Mobile Number
              </label>
              <input
                required
                value={formData.phone_primary}
                onChange={(e) =>
                  setFormData({ ...formData, phone_primary: formatPhoneInput(e.target.value) })
                }
                className="w-full bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 rounded-xl px-4 py-3 text-gray-800 dark:text-neutral-100 text-sm font-mono outline-none focus:border-emerald-500/40"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[9px] text-gray-500 dark:text-neutral-400 uppercase font-black tracking-widest text-left block">
                Gender
              </label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                className="w-full bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 rounded-xl px-4 py-3 text-gray-800 dark:text-neutral-100 text-sm outline-none focus:border-emerald-500/40"
              >
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[9px] text-gray-500 dark:text-neutral-400 uppercase font-black tracking-widest text-left block">
                Marital Status
              </label>
              <select
                value={formData.marital_status}
                onChange={(e) => setFormData({ ...formData, marital_status: e.target.value })}
                className="w-full bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 rounded-xl px-4 py-3 text-gray-800 dark:text-neutral-100 text-sm outline-none focus:border-emerald-500/40"
              >
                <option value="">Select...</option>
                <option value="Single">Single</option>
                <option value="Married">Married</option>
                <option value="Divorced">Divorced</option>
                <option value="Widowed">Widowed</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[9px] text-gray-500 dark:text-neutral-400 uppercase font-black tracking-widest text-left block">
                Religion
              </label>
              <select
                value={formData.religion}
                onChange={(e) => setFormData({ ...formData, religion: e.target.value })}
                className="w-full bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 rounded-xl px-4 py-3 text-gray-800 dark:text-neutral-100 text-sm outline-none focus:border-emerald-500/40"
              >
                <option value="">Select Religion</option>
                <option value="Christian">Christian</option>
                <option value="Muslim">Muslim</option>
                <option value="Hindu">Hindu</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[9px] text-gray-500 dark:text-neutral-400 uppercase font-black tracking-widest text-left block">
                Date of Birth
              </label>
              <input
                type="date"
                value={formData.dob}
                onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                className="w-full bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 rounded-xl px-4 py-3 text-gray-800 dark:text-neutral-100 text-sm outline-none focus:border-emerald-500/40"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[9px] text-gray-500 dark:text-neutral-400 uppercase font-black tracking-widest text-left block">
                Age
              </label>
              <input
                readOnly
                value={
                  formData.dob
                    ? (() => {
                        const b = new Date(formData.dob)
                        const t = new Date()
                        let a = t.getFullYear() - b.getFullYear()
                        const m = t.getMonth() - b.getMonth()
                        if (m < 0 || (m === 0 && t.getDate() < b.getDate())) a--
                        return a + ' years'
                      })()
                    : ''
                }
                className="w-full bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 rounded-xl px-4 py-3 text-gray-400 dark:text-neutral-500 text-sm font-mono outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[9px] text-gray-500 dark:text-neutral-400 uppercase font-black tracking-widest text-left block">
                District
              </label>
              <select
                required
                value={formData.district}
                onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                className="w-full bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 rounded-xl px-4 py-3 text-gray-800 dark:text-neutral-100 text-sm outline-none focus:border-emerald-500/40"
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
              <label className="text-[9px] text-gray-500 dark:text-neutral-400 uppercase font-black tracking-widest text-left block">
                Category
              </label>
              <select
                required
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 rounded-xl px-4 py-3 text-gray-800 dark:text-neutral-100 text-sm outline-none focus:border-emerald-500/40"
              >
                {STAFF_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[9px] text-gray-500 dark:text-neutral-400 uppercase font-black tracking-widest text-left block">
                Position Applied
              </label>
              <input
                required
                value={formData.position_applied}
                onChange={(e) => setFormData({ ...formData, position_applied: e.target.value })}
                className="w-full bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 rounded-xl px-4 py-3 text-gray-800 dark:text-neutral-100 text-sm outline-none focus:border-emerald-500/40"
                placeholder="e.g. ICU Nurse"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[9px] text-gray-500 dark:text-neutral-400 uppercase font-black tracking-widest text-left block">
                Experience Years
              </label>
              <input
                type="number"
                value={formData.experience_years}
                onChange={(e) =>
                  setFormData({ ...formData, experience_years: parseInt(e.target.value) || 0 })
                }
                className="w-full bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 rounded-xl px-4 py-3 text-gray-800 dark:text-neutral-100 text-sm font-mono outline-none focus:border-emerald-500/40"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[9px] text-gray-500 dark:text-neutral-400 uppercase font-black tracking-widest text-left block">
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
                className="w-full bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 rounded-xl px-4 py-3 text-emerald-600 dark:text-emerald-300 text-sm font-mono outline-none focus:border-emerald-500/40"
              />
              <p className="text-[8px] text-gray-500 dark:text-neutral-400 font-mono">
                = Rs {(formData.expected_salary_pkr || 0).toLocaleString()}/month
              </p>
            </div>
            <div className="space-y-2 text-right md:col-span-2 mt-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-8 py-4 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-slate-950 text-xs font-black uppercase tracking-widest rounded-xl transition-all shadow-xl dark:shadow-none shadow-emerald-500/20 flex items-center gap-2 ml-auto"
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

        <div className="flex gap-2 w-full overflow-x-auto pb-2 scrollbar-hide">
          {['All', 'Available', 'On Duty', 'Blacklisted', 'Service Ended'].map((filter) => (
            <button
              key={filter}
              onClick={() => setAvailabilityFilter(filter)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all shrink-0 whitespace-nowrap',
                availabilityFilter === filter
                  ? filter === 'Blacklisted'
                    ? 'bg-red-500/20 dark:bg-red-950 text-red-600 dark:text-red-400 border border-red-500/30 dark:border-red-800'
                    : filter === 'On Duty'
                      ? 'bg-amber-500/20 dark:bg-amber-950 text-amber-600 dark:text-amber-400 border border-amber-500/30 dark:border-amber-800'
                      : filter === 'Service Ended'
                        ? 'bg-red-500/20 dark:bg-red-950 text-red-600 dark:text-red-400 border border-red-500/30 dark:border-red-800'
                        : 'bg-emerald-500/20 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30 dark:border-emerald-800'
                  : 'bg-gray-100 dark:bg-neutral-800/50 text-gray-500 dark:text-neutral-400 hover:text-gray-600 dark:text-neutral-300 border border-gray-200 dark:border-neutral-700'
              )}
            >
              {filter === 'Available'
                ? '✓ Available'
                : filter === 'Blacklisted'
                  ? '✕ Blacklisted'
                  : filter === 'Service Ended'
                    ? 'Service Ended'
                    : filter}
            </button>
          ))}
        </div>

        <div className="flex gap-2 w-full overflow-x-auto pb-2 scrollbar-hide">
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
                  : 'bg-white dark:bg-neutral-900 text-gray-500 dark:text-neutral-400 hover:text-gray-600 dark:text-neutral-300 border border-gray-200 dark:border-neutral-700'
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
                'bg-white dark:bg-neutral-900 border-2 border-gray-200 dark:border-neutral-700 rounded-2xl overflow-hidden hover:border-gray-200 dark:hover:border-neutral-700 dark:border-neutral-700 transition-all group',
                staff.critical_missing_info &&
                  'border-red-500/30 dark:border-red-800 ring-1 ring-red-500/20 dark:ring-red-900/50',
                staff.is_blacklisted &&
                  'border-rose-500/40 dark:border-rose-800 ring-1 ring-rose-500/20 opacity-70',
                staff.service_end_date &&
                  'border-red-500/40 dark:border-red-800 ring-1 ring-red-500/20 opacity-70'
              )}
            >
              {/* Header - Avatar + Name + Quick Actions */}
              <div className="p-4 flex items-start gap-4 border-b border-gray-200 dark:border-neutral-700">
                {/* Avatar */}
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 flex items-center justify-center text-lg font-bold text-emerald-600 dark:text-emerald-300 shrink-0">
                  {(staff.full_name || '?')[0]}
                </div>

                {/* Name + ID */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-bold text-gray-800 dark:text-neutral-100 truncate flex items-center gap-2">
                    {staff.full_name}
                    {staff.is_verified && (
                      <CheckCircle2
                        size={14}
                        className="text-blue-600 dark:text-blue-300 shrink-0"
                      />
                    )}
                    {staff.is_blacklisted && (
                      <XCircle size={14} className="text-rose-400 shrink-0" />
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
                    className="p-1.5 hover:bg-gray-50 dark:bg-neutral-800/80 rounded-lg transition-colors text-gray-500 dark:text-neutral-400 hover:text-blue-600 dark:text-blue-300"
                    title="Edit"
                  >
                    <Edit size={14} />
                  </button>
                  <button
                    onClick={() => setSelectedStaffForDelete(staff)}
                    className="p-1.5 hover:bg-gray-50 dark:bg-neutral-800/80 rounded-lg transition-colors text-gray-500 dark:text-neutral-400 hover:text-red-600 dark:text-red-400"
                    title="Delete"
                  >
                    <Trash2 size={14} />
                  </button>
                  <button
                    onClick={() => handleToggleBlacklist(staff)}
                    className={cn(
                      'p-1.5 rounded-lg transition-colors',
                      staff.is_blacklisted
                        ? 'text-rose-400 hover:text-rose-300 bg-rose-500/10'
                        : 'text-gray-500 dark:text-neutral-400 hover:text-rose-400'
                    )}
                    title={staff.is_blacklisted ? 'Unblacklist' : 'Blacklist'}
                  >
                    <Ban size={14} />
                  </button>
                  {!staff.service_end_date ? (
                    <button
                      onClick={() => {
                        setSelectedStaffForEndService(staff)
                        setEndServiceDate(new Date().toISOString().split('T')[0])
                        setEndServiceReason('')
                        setEndServiceNotes('')
                      }}
                      className="p-1.5 hover:bg-gray-50 dark:bg-neutral-800/80 rounded-lg transition-colors text-gray-500 dark:text-neutral-400 hover:text-red-600 dark:text-red-400"
                      title="End Service"
                    >
                      <UserX size={14} />
                    </button>
                  ) : (
                    <button
                      onClick={async () => {
                        if (!confirm('Reinstate this staff member?')) return
                        setIsReinstating(true)
                        try {
                          await staffService.updateStaff(staff.id, {
                            service_end_date: null,
                            service_end_reason: null,
                            service_end_notes: null,
                            is_active: true,
                            is_available: true,
                          })
                          loadStaff()
                        } catch (err) {
                          console.error('Error reinstating staff:', err)
                          alert('Failed to reinstate staff')
                        } finally {
                          setIsReinstating(false)
                        }
                      }}
                      disabled={isReinstating}
                      className="p-1.5 hover:bg-gray-50 dark:bg-neutral-800/80 rounded-lg transition-colors text-gray-500 dark:text-neutral-400 hover:text-emerald-600 dark:text-emerald-300"
                      title="Reinstate"
                    >
                      <Undo2 size={14} />
                    </button>
                  )}
                </div>
              </div>

              {/* Position + Location */}
              <div className="px-4 py-3 flex flex-wrap gap-2">
                <span className="text-[10px] font-medium px-2 py-1 rounded-md bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  {staff.position_applied}
                </span>
                <span className="text-[10px] font-medium px-2 py-1 rounded-md bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-300 border border-blue-200 dark:border-blue-800 flex items-center gap-1">
                  <MapPin size={10} /> {staff.district}
                </span>
                {staff.category && staff.category !== staff.position_applied && (
                  <span className="text-[10px] font-medium px-2 py-1 rounded-md bg-gray-50 dark:bg-neutral-800/80 text-gray-400 dark:text-neutral-500 border border-gray-200 dark:border-neutral-700">
                    {staff.category}
                  </span>
                )}
              </div>

              {/* Details Row */}
              <div className="px-4 py-2 flex flex-wrap gap-1.5 text-[9px]">
                {staff.religion && (
                  <span className="text-gray-500 dark:text-neutral-400">{staff.religion}</span>
                )}
                {calculateAge(staff.dob) && (
                  <span className="text-gray-500 dark:text-neutral-400">
                    Age {calculateAge(staff.dob)}
                  </span>
                )}
                {staff.father_husband_name && (
                  <span
                    className="text-blue-600 dark:text-blue-300/80 truncate max-w-[100px]"
                    title={staff.father_husband_name}
                  >
                    • {staff.father_husband_name}
                  </span>
                )}
                {staff.marital_status && (
                  <span className="text-purple-600 dark:text-purple-400/80">
                    • {staff.marital_status}
                  </span>
                )}
                {staff.service_end_date && (
                  <span className="text-red-500 dark:text-red-400 font-bold">
                    • Service Ended {new Date(staff.service_end_date).toLocaleDateString('en-GB')}
                  </span>
                )}
              </div>

              {/* Stats Row */}
              <div className="px-4 py-3 flex items-center justify-between border-t border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-800/50">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    <Star
                      size={12}
                      className="text-amber-600 dark:text-amber-400"
                      fill="currentColor"
                    />
                    <span className="text-[11px] font-mono font-bold text-amber-600 dark:text-amber-400">
                      {(staff.rating || 0).toFixed(1)}
                    </span>
                  </div>
                  <div className="w-px h-4 bg-gray-100 dark:bg-neutral-800" />
                  <div className="text-[11px] font-mono font-bold text-emerald-600 dark:text-emerald-300">
                    Rs.{Math.round((staff.expected_salary_pkr || 0) / 30).toLocaleString()}
                    <span className="text-[8px] text-gray-500 dark:text-neutral-400 ml-0.5">
                      /shift
                    </span>
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
                        ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30 dark:border-emerald-800'
                        : 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 dark:border-amber-800'
                    )}
                  >
                    {staff.is_available ? 'Available' : 'On Duty'}
                  </button>
                  {!staff.is_available && (
                    <div className="flex flex-col items-end gap-0.5">
                      {staffAssignments[staff.id] ? (
                        <>
                          <span
                            className="text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded bg-gray-50 dark:bg-neutral-800/80 border border-gray-200 dark:border-neutral-700"
                            style={{
                              color:
                                staffAssignments[staff.id].shiftType === 'Night'
                                  ? '#818cf8'
                                  : '#f59e0b',
                              borderColor:
                                staffAssignments[staff.id].shiftType === 'Night'
                                  ? '#818cf833'
                                  : '#f59e0b33',
                            }}
                          >
                            {staffAssignments[staff.id].shiftType === 'Night'
                              ? '🌙 NIGHT SHIFT'
                              : '☀ DAY SHIFT'}
                          </span>
                          <div className="flex flex-col items-end">
                            <span className="text-[8px] text-gray-500 dark:text-neutral-400 uppercase font-black tracking-tighter">
                              Assigned to:
                            </span>
                            <button
                              onClick={() => {
                                onSelectPatient(staffAssignments[staff.id].id)
                                setActiveView('patients')
                              }}
                              className="text-[10px] text-blue-600 dark:text-blue-300 font-black truncate max-w-[140px] hover:text-blue-300 hover:underline transition-all uppercase tracking-tight"
                              title="View patient details"
                            >
                              {staffAssignments[staff.id].name}
                            </button>
                          </div>
                        </>
                      ) : loading ? (
                        <span className="text-[8px] text-gray-400 dark:text-neutral-500 font-bold uppercase tracking-widest animate-pulse">
                          Syncing Shift...
                        </span>
                      ) : (
                        <span className="text-[8px] text-rose-500/50 font-bold uppercase tracking-widest">
                          No Active Shift
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Inline Assignment UI */}
              {assigningStaffId === staff.id && (
                <div className="px-4 py-3 border-t border-gray-200 dark:border-neutral-700 bg-emerald-500/5">
                  <div className="space-y-3">
                    <p className="text-[9px] text-emerald-600 dark:text-emerald-300 font-bold uppercase tracking-widest">
                      Assign to Patient
                    </p>
                    <select
                      value={assignPatientId}
                      onChange={(e) => setAssignPatientId(e.target.value)}
                      className="w-full bg-gray-100 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg px-3 py-2 text-gray-800 dark:text-neutral-100 text-[10px] font-mono outline-none focus:border-emerald-500"
                    >
                      <option value="">Select patient...</option>
                      {patients
                        .filter((p) => p.status === 'Active')
                        .map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.full_name} — {p.district} (
                            {p.service_type?.replace('_', ' ')?.toUpperCase() || '---'})
                          </option>
                        ))}
                    </select>

                    {(() => {
                      const selectedPatient = patients.find((p) => p.id === assignPatientId)
                      const is24hr =
                        selectedPatient?.service_type === '24h' ||
                        selectedPatient?.service_type === '24hr' ||
                        selectedPatient?.service_type === '24HR'

                      return (
                        <>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setAssignShiftType('Morning')}
                              className={cn(
                                'flex-1 py-2 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all border',
                                assignShiftType === 'Morning' || is24hr
                                  ? 'bg-amber-500/20 dark:bg-amber-950 text-amber-600 dark:text-amber-400 border-amber-500/40'
                                  : 'bg-gray-100 dark:bg-neutral-800 text-gray-500 dark:text-neutral-400 border-gray-200 dark:border-neutral-700 hover:text-gray-600 dark:text-neutral-300'
                              )}
                            >
                              ☀ Day
                            </button>
                            <button
                              onClick={() => setAssignShiftType('Night')}
                              className={cn(
                                'flex-1 py-2 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all border',
                                assignShiftType === 'Night' || is24hr
                                  ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/40'
                                  : 'bg-gray-100 dark:bg-neutral-800 text-gray-500 dark:text-neutral-400 border-gray-200 dark:border-neutral-700 hover:text-gray-600 dark:text-neutral-300'
                              )}
                            >
                              🌙 Night
                            </button>
                          </div>

                          {is24hr && (
                            <p className="text-[8px] text-amber-600 dark:text-amber-400 font-bold uppercase tracking-widest bg-amber-500/10 px-2 py-1 rounded border border-amber-500/20">
                              24HR Service — another staff needed for opposite shift
                            </p>
                          )}

                          {assignPatientId && (
                            <p className="text-[8px] text-gray-500 dark:text-neutral-400 font-mono">
                              Rate: Rs{' '}
                              {Math.round((staff.expected_salary_pkr || 0) / 30).toLocaleString()}
                              /shift
                            </p>
                          )}
                        </>
                      )
                    })()}
                    <div className="flex gap-2">
                      <button
                        onClick={() => setAssigningStaffId(null)}
                        className="flex-1 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 dark:text-neutral-100 text-[9px] font-bold uppercase tracking-widest rounded-lg transition-all"
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
              <div className="px-4 py-3 border-t border-gray-200 dark:border-neutral-700 flex items-center justify-between gap-3">
                {/* Skills */}
                <div className="flex items-center gap-1.5 overflow-hidden">
                  {(staff.skills || []).slice(0, 2).map((skill: string) => (
                    <span
                      key={skill}
                      className="text-[8px] font-medium px-1.5 py-0.5 bg-gray-50 dark:bg-neutral-800/80 rounded text-gray-500 dark:text-neutral-400 whitespace-nowrap"
                    >
                      {skill}
                    </span>
                  ))}
                  {(staff.skills || []).length > 2 && (
                    <span className="text-[8px] text-gray-400 dark:text-neutral-500">
                      +{staff.skills.length - 2}
                    </span>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 shrink-0">
                  {staff.relative_info && (
                    <div className="group/contact relative">
                      <button className="p-1.5 hover:bg-gray-50 dark:bg-neutral-800/80 rounded-lg transition-colors text-gray-500 dark:text-neutral-400 hover:text-red-600 dark:text-red-400">
                        <Phone size={14} />
                      </button>
                      {/* Tooltip */}
                      <div className="absolute bottom-full right-0 mb-2 px-3 py-2 bg-gray-100 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg opacity-0 group-hover/contact:opacity-100 transition-opacity pointer-events-none z-10 whitespace-nowrap">
                        <p className="text-[10px] text-gray-800 dark:text-neutral-100 font-bold">
                          {staff.relative_info.name}
                        </p>
                        <p className="text-[9px] text-gray-400 dark:text-neutral-500">
                          {staff.relative_info.phone}
                        </p>
                        <p className="text-[8px] text-gray-500 dark:text-neutral-400">
                          {staff.relative_info.relationship}
                        </p>
                      </div>
                    </div>
                  )}
                  <button
                    onClick={() => setSelectedStaffForAttendance(staff)}
                    className="flex items-center gap-1 px-2 py-1 text-[9px] font-medium text-blue-600 dark:text-blue-300 bg-blue-50 dark:bg-blue-950 hover:bg-blue-500/20 dark:bg-blue-950 rounded-md transition-all"
                    title="Mark Attendance"
                  >
                    <Calendar size={12} />
                    <span>Attendance</span>
                  </button>
                  <button
                    onClick={() => setSelectedStaffForLedger(staff)}
                    className="flex items-center gap-1 px-2 py-1 text-[9px] font-medium text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20 rounded-md transition-all"
                    title="View Financial Ledger"
                  >
                    <Receipt size={12} />
                    <span>Ledger</span>
                  </button>
                  <button
                    onClick={() => setSelectedStaffForAdvance(staff)}
                    className="flex items-center gap-1 px-2 py-1 text-[9px] font-medium text-emerald-600 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950 hover:bg-emerald-500/20 dark:bg-emerald-950 rounded-md transition-all"
                  >
                    <Banknote size={12} />
                    <span>Advance</span>
                  </button>
                </div>
              </div>

              {/* Critical Info Alert */}
              {staff.critical_missing_info && (
                <div className="px-4 py-2 bg-red-50 dark:bg-red-950 border-t border-red-500/20 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                  <span className="text-[9px] font-medium text-red-600 dark:text-red-400">
                    Missing critical info - needs review
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 rounded-2xl p-20 text-center flex flex-col items-center justify-center">
          <div className="w-16 h-16 bg-gray-50 dark:bg-neutral-800/80 rounded-full flex items-center justify-center mb-6 border border-gray-200 dark:border-neutral-700 text-gray-500 dark:text-neutral-400">
            <Users size={32} />
          </div>
          <h3 className="text-sm font-black text-gray-800 dark:text-neutral-100 uppercase tracking-widest">
            No Staff Members Found
          </h3>
          <p className="text-[10px] text-gray-500 dark:text-neutral-400 uppercase font-bold tracking-widest mt-2 max-w-xs leading-relaxed">
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
              className="mt-6 text-[10px] font-black text-emerald-600 dark:text-emerald-300 uppercase tracking-widest border-b border-emerald-400/30 hover:border-emerald-400 transition-all pb-1"
            >
              Clear all filters
            </button>
          )}
        </div>
      )}

      {/* Advance Modal */}
      {selectedStaffForAdvance && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 rounded-2xl shadow-2xl dark:shadow-none overflow-hidden p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xs font-black text-emerald-600 dark:text-emerald-300 uppercase tracking-widest flex items-center gap-2">
                <Banknote size={16} /> Disburse Advance
              </h3>
              <button
                onClick={() => setSelectedStaffForAdvance(null)}
                className="text-gray-500 dark:text-neutral-400 hover:text-gray-800 dark:text-neutral-100"
              >
                <XCircle size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-[10px] text-gray-500 dark:text-neutral-400 uppercase tracking-widest font-bold mb-2">
                  Recipient
                </p>
                <p className="text-sm font-bold text-gray-800 dark:text-neutral-100 mb-4">
                  {selectedStaffForAdvance.full_name}
                </p>

                <p className="text-[10px] text-gray-500 dark:text-neutral-400 uppercase tracking-widest font-bold mb-2">
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
                    className="w-full bg-gray-100 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl py-3 pl-12 pr-4 text-gray-800 dark:text-neutral-100 font-mono focus:border-emerald-500 outline-none"
                    autoFocus
                  />
                </div>

                <p className="text-[10px] text-gray-500 dark:text-neutral-400 uppercase tracking-widest font-bold mb-2 mt-4">
                  Payment Method
                </p>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full bg-gray-100 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl py-3 px-4 text-gray-800 dark:text-neutral-100 font-mono focus:border-emerald-500 outline-none"
                >
                  <option value="Cash">Cash</option>
                  <option value="JazzCash">JazzCash</option>
                  <option value="EasyPesa">EasyPesa</option>
                  <option value="Bank">Bank Transfer</option>
                </select>
              </div>

              <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-4">
                <p className="text-[9px] text-emerald-600 dark:text-emerald-300 font-bold uppercase tracking-widest leading-relaxed">
                  Notice: Advances are automatically deducted from the Gross Accrual at end of
                  month. No manual entries required in Payout ledger.
                </p>
              </div>

              {recentAdvances.length > 0 && (
                <div>
                  <p className="text-[9px] text-gray-500 dark:text-neutral-400 uppercase tracking-widest font-bold mb-2">
                    Recent Advances
                  </p>
                  <div className="space-y-1.5">
                    {recentAdvances.map((adv) => {
                      const date = adv.disbursement_date
                        ? new Date(adv.disbursement_date)
                        : adv.created_at
                          ? new Date(adv.created_at)
                          : null
                      const dateStr = date
                        ? date.toLocaleDateString('en-GB', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })
                        : ''
                      const timeStr = date
                        ? date.toLocaleTimeString('en-GB', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : ''
                      return (
                        <div
                          key={adv.id}
                          className="flex items-center justify-between bg-gray-100 dark:bg-neutral-800/50 rounded-lg px-3 py-2 border border-gray-200 dark:border-neutral-700"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <span className="text-[10px] text-gray-600 dark:text-neutral-300 font-mono shrink-0">
                              {formatPKR(adv.amount_pkr)}
                            </span>
                            {dateStr && (
                              <span className="text-[8px] text-gray-400 dark:text-neutral-500 font-mono whitespace-nowrap">
                                {dateStr} {timeStr}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-[8px] text-gray-500 dark:text-neutral-400 font-mono">
                              {adv.payment_method || 'Cash'}
                            </span>
                            <span
                              className={
                                'text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ' +
                                (adv.status === 'Settled'
                                  ? 'text-emerald-600 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950'
                                  : 'text-amber-600 dark:text-amber-400 bg-amber-500/10')
                              }
                            >
                              {adv.status}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              <button
                onClick={handleGiveAdvance}
                disabled={!advanceAmount || isSubmittingAdvance}
                className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 disabled:grayscale transition-all text-slate-950 font-black text-[10px] uppercase tracking-widest rounded-xl shadow-lg dark:shadow-none shadow-emerald-500/20 flex items-center justify-center gap-2"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 rounded-2xl shadow-2xl dark:shadow-none overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-neutral-700">
              <h3 className="text-sm font-black text-blue-600 dark:text-blue-300 uppercase tracking-[0.2em]">
                Edit Staff Profile
              </h3>
              <button
                onClick={() => setSelectedStaffForEdit(null)}
                className="text-gray-500 dark:text-neutral-400 hover:text-gray-800 dark:text-neutral-100"
              >
                <XCircle size={20} />
              </button>
            </div>

            <form onSubmit={handleEditStaff} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[9px] text-gray-500 dark:text-neutral-400 uppercase font-black tracking-widest text-left block">
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
                    className="w-full bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 rounded-xl px-4 py-3 text-gray-800 dark:text-neutral-100 text-sm outline-none focus:border-blue-500/40"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] text-gray-500 dark:text-neutral-400 uppercase font-black tracking-widest text-left block">
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
                    className="w-full bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 rounded-xl px-4 py-3 text-gray-800 dark:text-neutral-100 text-sm font-mono outline-none focus:border-blue-500/40"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] text-gray-500 dark:text-neutral-400 uppercase font-black tracking-widest text-left block">
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
                    className="w-full bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 rounded-xl px-4 py-3 text-gray-800 dark:text-neutral-100 text-sm font-mono outline-none focus:border-blue-500/40"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] text-gray-500 dark:text-neutral-400 uppercase font-black tracking-widest text-left block">
                    District
                  </label>
                  <select
                    required
                    value={editFormData.district}
                    onChange={(e) => setEditFormData({ ...editFormData, district: e.target.value })}
                    className="w-full bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 rounded-xl px-4 py-3 text-gray-800 dark:text-neutral-100 text-sm outline-none focus:border-blue-500/40"
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
                  <label className="text-[9px] text-gray-500 dark:text-neutral-400 uppercase font-black tracking-widest text-left block">
                    Category
                  </label>
                  <select
                    required
                    value={editFormData.category}
                    onChange={(e) => setEditFormData({ ...editFormData, category: e.target.value })}
                    className="w-full bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 rounded-xl px-4 py-3 text-gray-800 dark:text-neutral-100 text-sm outline-none focus:border-blue-500/40"
                  >
                    {STAFF_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] text-gray-500 dark:text-neutral-400 uppercase font-black tracking-widest text-left block">
                    Position Applied
                  </label>
                  <input
                    required
                    value={editFormData.position_applied}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, position_applied: e.target.value })
                    }
                    className="w-full bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 rounded-xl px-4 py-3 text-gray-800 dark:text-neutral-100 text-sm outline-none focus:border-blue-500/40"
                    placeholder="e.g. ICU Nurse"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] text-gray-500 dark:text-neutral-400 uppercase font-black tracking-widest text-left block">
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
                    className="w-full bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 rounded-xl px-4 py-3 text-gray-800 dark:text-neutral-100 text-sm font-mono outline-none focus:border-blue-500/40"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] text-gray-500 dark:text-neutral-400 uppercase font-black tracking-widest text-left block">
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
                    className="w-full bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 rounded-xl px-4 py-3 text-emerald-600 dark:text-emerald-300 text-sm font-mono outline-none focus:border-blue-500/40"
                  />
                  <p className="text-[8px] text-gray-500 dark:text-neutral-400 font-mono">
                    = Rs {(editFormData.expected_salary_pkr || 0).toLocaleString()}/month
                  </p>
                </div>
              </div>

              {/* Checkboxes and actions are outside the 2-column grid */}
              <div className="flex items-center gap-4 mt-8 pt-6 border-t border-gray-200 dark:border-neutral-700">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editFormData.is_active}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, is_active: e.target.checked })
                    }
                    className="w-4 h-4 text-blue-600 dark:text-blue-300 bg-gray-100 dark:bg-neutral-800 border-gray-300 dark:border-neutral-600 rounded focus:ring-blue-500"
                  />
                  <span className="text-[10px] text-gray-400 dark:text-neutral-500 uppercase font-black tracking-widest">
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
                    className="w-4 h-4 text-blue-600 dark:text-blue-300 bg-gray-100 dark:bg-neutral-800 border-gray-300 dark:border-neutral-600 rounded focus:ring-blue-500"
                  />
                  <span className="text-[10px] text-gray-400 dark:text-neutral-500 uppercase font-black tracking-widest">
                    Currently Available
                  </span>
                </label>
              </div>

              <div className="flex gap-4 mt-8">
                <button
                  type="button"
                  onClick={() => setSelectedStaffForEdit(null)}
                  className="flex-1 py-4 bg-gray-200 hover:bg-gray-300 text-gray-800 dark:text-neutral-100 font-black text-[10px] uppercase tracking-widest rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingEdit}
                  className="flex-1 py-4 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-slate-950 text-[10px] uppercase tracking-widest rounded-xl shadow-lg dark:shadow-none shadow-blue-500/20 flex items-center justify-center gap-2"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 rounded-2xl shadow-2xl dark:shadow-none overflow-hidden p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-black text-red-600 dark:text-red-400 uppercase tracking-[0.2em] flex items-center gap-2">
                <Trash2 size={20} /> Delete Staff Member
              </h3>
              <button
                onClick={() => setSelectedStaffForDelete(null)}
                className="text-gray-500 dark:text-neutral-400 hover:text-gray-800 dark:text-neutral-100"
              >
                <XCircle size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-red-50 dark:bg-red-950 border border-red-500/20 rounded-xl p-4">
                <p className="text-red-600 dark:text-red-400 font-bold text-sm mb-2">
                  ⚠️ This action cannot be undone
                </p>
                <p className="text-gray-600 dark:text-neutral-300 text-sm leading-relaxed">
                  You are about to permanently delete{' '}
                  <strong>{selectedStaffForDelete.full_name}</strong> (ID:{' '}
                  {selectedStaffForDelete.emp_no}) from the system. This will remove all associated
                  data including shifts, advances, and attendance records.
                </p>
              </div>

              <div className="bg-gray-100 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl p-4">
                <h4 className="text-[10px] text-gray-400 dark:text-neutral-500 uppercase font-black tracking-widest mb-2">
                  Staff Details
                </h4>
                <div className="space-y-1 text-sm">
                  <p className="text-gray-800 dark:text-neutral-100">
                    <strong>Name:</strong> {selectedStaffForDelete.full_name}
                  </p>
                  <p className="text-gray-600 dark:text-neutral-300">
                    <strong>ID:</strong> {selectedStaffForDelete.emp_no}
                  </p>
                  <p className="text-gray-600 dark:text-neutral-300">
                    <strong>Position:</strong> {selectedStaffForDelete.position_applied}
                  </p>
                  <p className="text-gray-600 dark:text-neutral-300">
                    <strong>District:</strong> {selectedStaffForDelete.district}
                  </p>
                </div>
              </div>

              <div className="flex gap-4 mt-8">
                <button
                  onClick={() => setSelectedStaffForDelete(null)}
                  className="flex-1 py-4 bg-gray-200 hover:bg-gray-300 text-gray-800 dark:text-neutral-100 font-black text-[10px] uppercase tracking-widest rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteStaff}
                  disabled={isDeleting}
                  className="flex-1 py-4 bg-red-500 hover:bg-text-red-600 dark:text-red-400 disabled:opacity-50 text-white text-[10px] uppercase tracking-widest rounded-xl shadow-lg dark:shadow-none shadow-red-500/20 flex items-center justify-center gap-2"
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
          dayRate={undefined}
          nightRate={undefined}
          expectedSalary={selectedStaffForAttendance.expected_salary_pkr}
          onClose={() => setSelectedStaffForAttendance(null)}
        />
      )}

      {/* Ledger Modal */}
      {selectedStaffForLedger && (
        <StaffLedgerModal
          staff={selectedStaffForLedger}
          onClose={() => setSelectedStaffForLedger(null)}
        />
      )}

      {/* End Service Modal */}
      {selectedStaffForEndService && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 rounded-2xl shadow-2xl dark:shadow-none overflow-hidden p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-black text-red-600 dark:text-red-400 uppercase tracking-[0.2em] flex items-center gap-2">
                <UserX size={20} /> End Service
              </h3>
              <button
                onClick={() => setSelectedStaffForEndService(null)}
                className="text-gray-500 dark:text-neutral-400 hover:text-gray-800 dark:text-neutral-100"
              >
                <XCircle size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-gray-50 dark:bg-neutral-800/80 rounded-xl p-4 border border-gray-200 dark:border-neutral-700">
                <p className="text-sm font-bold text-gray-800 dark:text-neutral-100">
                  {selectedStaffForEndService.full_name}
                </p>
                <p className="text-[10px] font-mono text-gray-500 dark:text-neutral-400">
                  {selectedStaffForEndService.emp_no}
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-[9px] text-gray-500 dark:text-neutral-400 uppercase font-black tracking-widest">
                  Date of Leaving
                </label>
                <input
                  type="date"
                  value={endServiceDate}
                  onChange={(e) => setEndServiceDate(e.target.value)}
                  className="w-full bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 rounded-xl px-4 py-3 text-gray-800 dark:text-neutral-100 text-sm outline-none focus:border-red-500/40"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[9px] text-gray-500 dark:text-neutral-400 uppercase font-black tracking-widest">
                  Reason
                </label>
                <select
                  value={endServiceReason}
                  onChange={(e) => setEndServiceReason(e.target.value)}
                  className="w-full bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 rounded-xl px-4 py-3 text-gray-800 dark:text-neutral-100 text-sm outline-none focus:border-red-500/40"
                >
                  <option value="">Select a reason...</option>
                  <option value="Resignation">Resignation</option>
                  <option value="Termination">Termination</option>
                  <option value="Contract Ended">Contract Ended</option>
                  <option value="Retirement">Retirement</option>
                  <option value="Deceased">Deceased</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[9px] text-gray-500 dark:text-neutral-400 uppercase font-black tracking-widest">
                  Notes (optional)
                </label>
                <textarea
                  value={endServiceNotes}
                  onChange={(e) => setEndServiceNotes(e.target.value)}
                  rows={3}
                  className="w-full bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 rounded-xl px-4 py-3 text-gray-800 dark:text-neutral-100 text-sm outline-none focus:border-red-500/40"
                />
              </div>

              <div className="bg-red-50 dark:bg-red-950 border border-red-500/20 rounded-xl p-4">
                <p className="text-[10px] text-red-600 dark:text-red-400 font-bold uppercase tracking-widest leading-relaxed">
                  This will mark the staff member as inactive and remove them from available staff
                  assignments.
                </p>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setSelectedStaffForEndService(null)}
                  className="flex-1 py-4 bg-gray-200 hover:bg-gray-300 text-gray-800 dark:text-neutral-100 font-black text-[10px] uppercase tracking-widest rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    if (!endServiceDate || !endServiceReason) {
                      alert('Please fill in date and reason')
                      return
                    }
                    setIsEndingService(true)
                    try {
                      await staffService.updateStaff(selectedStaffForEndService.id, {
                        service_end_date: endServiceDate,
                        service_end_reason: endServiceReason,
                        service_end_notes: endServiceNotes || null,
                        is_active: false,
                        is_available: false,
                      })
                      setSelectedStaffForEndService(null)
                      loadStaff()
                    } catch (err) {
                      console.error('Error ending service:', err)
                      alert('Failed to end service')
                    } finally {
                      setIsEndingService(false)
                    }
                  }}
                  disabled={!endServiceDate || !endServiceReason || isEndingService}
                  className="flex-1 py-4 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white text-[10px] uppercase tracking-widest rounded-xl shadow-lg shadow-red-500/20 flex items-center justify-center gap-2"
                >
                  {isEndingService ? (
                    <Loader2 className="animate-spin" size={16} />
                  ) : (
                    <>End Service</>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
