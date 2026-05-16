import React, { useState, useEffect } from 'react'
import { Calendar, ChevronLeft, ChevronRight, DollarSign, Download } from 'lucide-react'
import { attendanceService } from '../services/attendanceService'
import { staffService } from '../services/staffService'
import { cn } from '../lib/utils'

export default function AttendanceView() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [staff, setStaff] = useState<any[]>([])
  const [attendance, setAttendance] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  useEffect(() => {
    loadData()
  }, [year, month])

  const loadData = async () => {
    setLoading(true)
    try {
      const [staffData, attendanceData] = await Promise.all([
        staffService.getAllStaff(),
        attendanceService.getMonthAttendance(year, month),
      ])
      setStaff(staffData.filter((s: any) => s.is_active))
      setAttendance(attendanceData)
    } catch (error) {
      console.error('Error loading attendance:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusForStaffDay = (staffId: string, day: number) => {
    const dateStr = new Date(year, month, day).toISOString().split('T')[0]
    return attendance.find((a) => a.employee_id === staffId && a.attendance_date === dateStr)
      ?.status
  }

  const cycleStatus = async (staffId: string, day: number) => {
    const current = getStatusForStaffDay(staffId, day)
    const cycle: Record<string, string | undefined> = {
      undefined: 'Present',
      Present: 'Absent',
      Absent: 'Late',
      Late: 'Half-Day',
      'Half-Day': undefined,
    }
    const next = cycle[current ?? 'undefined']

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
    loadData()
  }

  const getStatusColor = (status: string | undefined) => {
    switch (status) {
      case 'Present':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
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

  return (
    <div className="space-y-6 h-full flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center bg-slate-900/40 border border-white/5 p-6 rounded-xl">
        <div>
          <h2 className="text-xl font-black text-white uppercase tracking-tighter flex items-center gap-2">
            <Calendar className="text-blue-500" /> Attendance Ledger
          </h2>
          <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black mt-1">
            Mark daily presence • Auto-calculate payroll
          </p>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setCurrentDate(new Date(year, month - 1, 1))}
            className="p-2 hover:bg-white/5 rounded-lg border border-white/5"
          >
            <ChevronLeft size={20} className="text-slate-400" />
          </button>
          <h3 className="text-sm font-mono font-bold text-white uppercase tracking-widest w-32 text-center">
            {new Date(year, month).toLocaleString('default', { month: 'long', year: 'numeric' })}
          </h3>
          <button
            onClick={() => setCurrentDate(new Date(year, month + 1, 1))}
            className="p-2 hover:bg-white/5 rounded-lg border border-white/5"
          >
            <ChevronRight size={20} className="text-slate-400" />
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="flex-1 overflow-auto bg-slate-900/40 border border-white/5 rounded-xl p-6">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-slate-500 text-xs uppercase tracking-widest">Loading...</div>
          </div>
        ) : (
          <div className="min-w-[800px]">
            {/* Header Row */}
            <div className="grid grid-cols-[200px_repeat(31,1fr)] gap-1 mb-2">
              <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 py-2">
                Staff Member
              </div>
              {Array.from({ length: daysInMonth }, (_, i) => (
                <div
                  key={i}
                  className="text-[8px] text-center font-bold text-slate-600 py-2 border-b border-white/5"
                >
                  {i + 1}
                </div>
              ))}
            </div>

            {/* Staff Rows */}
            {staff.map((s) => (
              <div key={s.id} className="grid grid-cols-[200px_repeat(31,1fr)] gap-1 mb-1">
                <div className="text-[10px] font-bold text-white py-2 truncate pr-2">
                  {s.full_name}
                </div>
                {Array.from({ length: daysInMonth }, (_, i) => {
                  const status = getStatusForStaffDay(s.id, i + 1)
                  return (
                    <button
                      key={i}
                      onClick={() => cycleStatus(s.id, i + 1)}
                      className={cn(
                        'h-8 rounded border text-[8px] font-bold transition-all hover:scale-105',
                        getStatusColor(status)
                      )}
                    >
                      {status?.[0] || ''}
                    </button>
                  )
                })}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
