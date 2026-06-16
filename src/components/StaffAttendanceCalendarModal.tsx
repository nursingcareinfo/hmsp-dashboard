/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, X, Calendar, DollarSign } from 'lucide-react'
import { attendanceService } from '../services/attendanceService'
import { cn, formatPKR } from '../lib/utils'

interface StaffAttendanceCalendarModalProps {
  staffId: string
  staffName: string
  empNo: string
  dayRate?: number
  nightRate?: number
  expectedSalary?: number
  onClose: () => void
}

export default function StaffAttendanceCalendarModal({
  staffId,
  staffName,
  empNo,
  dayRate,
  nightRate,
  expectedSalary,
  onClose,
}: StaffAttendanceCalendarModalProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [attendance, setAttendance] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  // Prefer day shift rate, fall back to night rate, then expected salary ÷ 30
  const effectiveDailyRate = dayRate || nightRate || (expectedSalary ? expectedSalary / 30 : 0)

  useEffect(() => {
    loadAttendance()
  }, [year, month, staffId])

  const loadAttendance = async () => {
    setLoading(true)
    try {
      const data = await attendanceService.getStaffMonthAttendance(staffId, year, month)
      setAttendance(data)
    } catch (error) {
      console.error('Error loading attendance:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusForDay = (day: number) => {
    const dateStr = new Date(year, month, day).toISOString().split('T')[0]
    return attendance.find((a) => a.employee_id === staffId && a.attendance_date === dateStr)
      ?.status
  }

  const cycleStatus = async (day: number) => {
    const current = getStatusForDay(day)

    // Determine the cycle based on available rates
    let statuses: (string | undefined)[] = []

    if (dayRate && !nightRate) {
      statuses = [undefined, 'Day', 'Absent', 'Late', 'Half-Day']
    } else if (nightRate && !dayRate) {
      statuses = [undefined, 'Night', 'Absent', 'Late', 'Half-Day']
    } else {
      // Both or neither set - show both options
      statuses = [undefined, 'Day', 'Night', 'Absent', 'Late', 'Half-Day']
    }

    const currentIndex = statuses.indexOf(current)
    const nextIndex = (currentIndex + 1) % statuses.length
    const next = statuses[nextIndex]

    const dateStr = new Date(year, month, day).toISOString().split('T')[0]

    if (next) {
      await attendanceService.upsertAttendance({
        employee_id: staffId,
        attendance_date: dateStr,
        status: next as any,
      })
    } else {
      await attendanceService.deleteAttendance(staffId, dateStr)
    }
    loadAttendance()
  }

  const getStatusColor = (status: string | undefined) => {
    switch (status) {
      case 'Day':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
      case 'Night':
        return 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30'
      case 'Absent':
        return 'bg-red-500/20 text-red-400 border-red-500/30'
      case 'Late':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/30'
      case 'Half-Day':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      default:
        return 'bg-white/5 text-slate-600 border-white/10'
    }
  }

  const calculateSummary = () => {
    const staffAttendance = attendance.filter((a) => a.employee_id === staffId)

    const dayCount = staffAttendance.filter((a) => a.status === 'Day').length
    const nightCount = staffAttendance.filter((a) => a.status === 'Night').length
    const absent = staffAttendance.filter((a) => a.status === 'Absent').length
    const late = staffAttendance.filter((a) => a.status === 'Late').length
    const halfDay = staffAttendance.filter((a) => a.status === 'Half-Day').length

    // Base rate for Late/Half-Day (prefer day, then night, then expected/30)
    const baseRate = dayRate || nightRate || (expectedSalary ? expectedSalary / 30 : 0)

    let totalSalary = 0
    totalSalary += dayCount * (dayRate || baseRate)
    totalSalary += nightCount * (nightRate || baseRate)
    totalSalary += late * baseRate // Treat late as full shift for now
    totalSalary += halfDay * (baseRate * 0.5)

    const totalShifts = dayCount + nightCount + late + halfDay * 0.5

    return { dayCount, nightCount, absent, late, halfDay, totalShifts, totalSalary }
  }

  const summary = calculateSummary()

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-slate-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/5">
          <div>
            <h3 className="text-sm font-black text-emerald-400 uppercase tracking-widest flex items-center gap-2">
              <Calendar size={16} /> Attendance Tracker
            </h3>
            <p className="text-[10px] text-slate-500 mt-1">
              {staffName} <span className="text-emerald-500 font-mono">({empNo})</span>
            </p>
            {(dayRate || nightRate) && (
              <div className="flex items-center gap-3 mt-1.5">
                {dayRate && (
                  <span className="text-[9px] font-mono text-amber-400 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded">
                    ☀ Day: Rs.{dayRate.toLocaleString()}/shift
                  </span>
                )}
                {nightRate && (
                  <span className="text-[9px] font-mono text-blue-400 bg-blue-500/10 border border-blue-500/20 px-1.5 py-0.5 rounded">
                    🌙 Night: Rs.{nightRate.toLocaleString()}/shift
                  </span>
                )}
              </div>
            )}
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white">
            <X size={20} />
          </button>
        </div>

        {/* Calendar */}
        <div className="p-6">
          {/* Month Navigation */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => setCurrentDate(new Date(year, month - 1, 1))}
              className="p-2 hover:bg-white/5 rounded-lg border border-white/5"
            >
              <ChevronLeft size={18} className="text-slate-400" />
            </button>
            <h4 className="text-xs font-mono font-bold text-white uppercase tracking-widest">
              {new Date(year, month).toLocaleString('default', { month: 'long', year: 'numeric' })}
            </h4>
            <button
              onClick={() => setCurrentDate(new Date(year, month + 1, 1))}
              className="p-2 hover:bg-white/5 rounded-lg border border-white/5"
            >
              <ChevronRight size={18} className="text-slate-400" />
            </button>
          </div>

          {/* Calendar Grid */}
          {loading ? (
            <div className="text-center py-8 text-slate-500 text-xs">Loading...</div>
          ) : (
            <div className="grid grid-cols-7 gap-1">
              {/* Day of week headers */}
              {['Su', 'M', 'T', 'W', 'Th', 'F', 'Sa'].map((d) => (
                <div key={d} className="text-[8px] text-center font-bold text-slate-600 py-1">
                  {d === 'Su' ? 'S' : d === 'Sa' ? 'S' : d}
                </div>
              ))}

              {/* Empty cells for days before month starts */}
              {Array.from({ length: new Date(year, month, 1).getDay() }, (_, i) => (
                <div key={`empty-${i}`} className="h-8" />
              ))}

              {/* Calendar days */}
              {Array.from({ length: daysInMonth }, (_, i) => {
                const day = i + 1
                const status = getStatusForDay(day)
                return (
                  <button
                    key={day}
                    onClick={() => cycleStatus(day)}
                    className={cn(
                      'h-8 rounded border text-[10px] font-bold transition-all hover:scale-105 flex items-center justify-center',
                      getStatusColor(status)
                    )}
                    title={`${day} - ${status || 'Not marked'}`}
                  >
                    {day}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Summary */}
        <div className="p-4 bg-black/20 border-t border-white/5">
          <div className="flex items-center justify-between text-[10px]">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                {summary.dayCount > 0 && (
                  <div>
                    <span className="text-emerald-400 font-bold">{summary.dayCount}</span>
                    <span className="text-slate-600 ml-1">day</span>
                  </div>
                )}
                {summary.nightCount > 0 && (
                  <div>
                    <span className="text-indigo-400 font-bold">{summary.nightCount}</span>
                    <span className="text-slate-600 ml-1">night</span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-3">
                <div>
                  <span className="text-amber-400 font-bold">{summary.late}</span>
                  <span className="text-slate-600 ml-1">late</span>
                </div>
                <div>
                  <span className="text-red-400 font-bold">{summary.absent}</span>
                  <span className="text-slate-600 ml-1">absent</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1 text-emerald-400">
              <DollarSign size={12} />
              <span className="font-mono font-bold">{formatPKR(summary.totalSalary)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
