/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react'
import {
  ClipboardList,
  Search,
  ChevronDown,
  ChevronUp,
  Phone,
  MapPin,
  User,
  Hash,
  Calendar,
  DollarSign,
  FileText,
  Package,
  CheckCircle2,
  Clock,
  MessageSquare,
  Loader2,
  Share2,
} from 'lucide-react'
import { cn, formatPKR } from '../lib/utils'
import { supabase } from '../lib/supabase'
import ShareIntakeModal from './ShareIntakeModal'

interface PatientIntake {
  id: string
  created_at: string
  full_name: string
  guardian_name: string
  gender: string
  cnic: string
  date_of_birth: string | null
  mobile: string
  district: string | null
  address: string | null
  service_type: string
  billing_rate: number
  start_date: string
  signatory_name: string
  signatory_cnic: string
  terms_accepted: boolean
  equipment: any
  status: string
  staff_notes: string | null
}

const STATUS_FLOW = ['pending', 'reviewed', 'contacted', 'assigned', 'completed'] as const

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  reviewed: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  contacted: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  assigned: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  completed: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
}

function formatDate(iso: string) {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' })
}

function formatDateTime(iso: string) {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleString('en-PK', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        'text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md border',
        STATUS_STYLES[status] || STATUS_STYLES.pending
      )}
    >
      {status}
    </span>
  )
}

export default function PatientIntakesView() {
  const [intakes, setIntakes] = useState<PatientIntake[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [showShare, setShowShare] = useState(false)

  useEffect(() => {
    loadIntakes()
  }, [])

  async function loadIntakes() {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('patient_intakes')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setIntakes(data || [])
    } catch (err) {
      console.error('Error loading intakes:', err)
    } finally {
      setLoading(false)
    }
  }

  async function updateStatus(id: string, newStatus: string) {
    setUpdatingId(id)
    try {
      const { error } = await supabase
        .from('patient_intakes')
        .update({ status: newStatus })
        .eq('id', id)

      if (error) throw error
      setIntakes((prev) => prev.map((i) => (i.id === id ? { ...i, status: newStatus } : i)))
    } catch (err) {
      console.error('Error updating status:', err)
    } finally {
      setUpdatingId(null)
    }
  }

  async function saveNotes(id: string, notes: string) {
    try {
      const { error } = await supabase
        .from('patient_intakes')
        .update({ staff_notes: notes })
        .eq('id', id)

      if (error) throw error
      setIntakes((prev) => prev.map((i) => (i.id === id ? { ...i, staff_notes: notes } : i)))
    } catch (err) {
      console.error('Error saving notes:', err)
    }
  }

  const filtered = intakes.filter((i) => {
    if (statusFilter !== 'all' && i.status !== statusFilter) return false
    if (!search) return true
    const q = search.toLowerCase()
    return (
      i.full_name.toLowerCase().includes(q) ||
      i.mobile.includes(q) ||
      i.cnic.includes(q) ||
      i.service_type.toLowerCase().includes(q)
    )
  })

  const counts = {
    total: intakes.length,
    pending: intakes.filter((i) => i.status === 'pending').length,
    reviewed: intakes.filter((i) => i.status === 'reviewed').length,
    contacted: intakes.filter((i) => i.status === 'contacted').length,
    assigned: intakes.filter((i) => i.status === 'assigned').length,
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <Loader2 className="text-emerald-500 animate-spin" size={40} />
        <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black">
          Loading Intakes...
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 bg-slate-900/40 border border-white/5 p-6 rounded-xl">
        <div>
          <h2 className="text-xl font-black text-white uppercase tracking-tighter flex items-center gap-3">
            <ClipboardList size={22} className="text-emerald-400" />
            Patient Intake Queue
          </h2>
          <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black mt-1">
            Review &amp; Manage Incoming Referrals
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowShare(true)}
            className="text-[10px] font-black uppercase tracking-widest px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-colors text-slate-400 flex items-center gap-1.5"
          >
            <Share2 size={12} />
            Share Link
          </button>
          <button
            onClick={loadIntakes}
            className="text-[10px] font-black uppercase tracking-widest px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-colors text-slate-400"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          {
            label: 'Total',
            count: counts.total,
            color: 'text-white',
            active: statusFilter === 'all',
          },
          {
            label: 'Pending',
            count: counts.pending,
            color: 'text-yellow-400',
            active: statusFilter === 'pending',
          },
          {
            label: 'Reviewed',
            count: counts.reviewed,
            color: 'text-blue-400',
            active: statusFilter === 'reviewed',
          },
          {
            label: 'Contacted',
            count: counts.contacted,
            color: 'text-purple-400',
            active: statusFilter === 'contacted',
          },
          {
            label: 'Assigned',
            count: counts.assigned,
            color: 'text-emerald-400',
            active: statusFilter === 'assigned',
          },
        ].map((s) => (
          <button
            key={s.label}
            onClick={() => setStatusFilter(s.active ? 'all' : s.label.toLowerCase())}
            className={cn(
              'bg-slate-900/40 border rounded-xl p-4 text-left transition-all',
              s.active ? 'border-white/20 bg-white/5' : 'border-white/5 hover:border-white/10'
            )}
          >
            <p className="text-[9px] text-slate-500 uppercase tracking-widest font-black">
              {s.label}
            </p>
            <p className={cn('text-xl font-black mt-1', s.color)}>{s.count}</p>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          type="text"
          placeholder="Search by name, mobile, CNIC, or service..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-slate-900/40 border border-white/5 rounded-xl pl-10 pr-4 py-3 text-sm text-white outline-none focus:border-emerald-500/30 transition-colors placeholder:text-slate-600"
        />
      </div>

      {/* Intake List */}
      {filtered.length === 0 ? (
        <div className="p-16 text-center border border-dashed border-white/5 rounded-xl">
          <ClipboardList size={40} className="mx-auto mb-4 text-slate-600" />
          <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">
            {intakes.length === 0 ? 'No intake submissions yet' : 'No intakes match your filter'}
          </p>
          <p className="text-[10px] text-slate-600 mt-2">
            {intakes.length === 0
              ? 'Patient intake forms will appear here once submitted via the public form.'
              : 'Try adjusting your search or filter.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((intake) => {
            const isExpanded = expandedId === intake.id
            const equipment =
              typeof intake.equipment === 'string'
                ? JSON.parse(intake.equipment || '[]')
                : intake.equipment || []
            const currentIdx = STATUS_FLOW.indexOf(intake.status as (typeof STATUS_FLOW)[number])
            const nextStatus =
              currentIdx < STATUS_FLOW.length - 1 ? STATUS_FLOW[currentIdx + 1] : null

            return (
              <div
                key={intake.id}
                className="bg-slate-900/40 border border-white/5 rounded-xl overflow-hidden transition-all hover:border-white/10"
              >
                {/* Summary Row */}
                <button
                  onClick={() => setExpandedId(isExpanded ? null : intake.id)}
                  className="w-full text-left p-5 flex flex-col md:flex-row md:items-center gap-3 md:gap-6"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <h3 className="font-bold text-white truncate">{intake.full_name}</h3>
                      <StatusBadge status={intake.status} />
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                      <span className="flex items-center gap-1">
                        <Phone size={10} /> {intake.mobile}
                      </span>
                      <span className="flex items-center gap-1">
                        <User size={10} /> {intake.service_type}
                      </span>
                      {intake.district && (
                        <span className="flex items-center gap-1">
                          <MapPin size={10} /> {intake.district}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Calendar size={10} /> {formatDate(intake.created_at)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-slate-500">
                    {nextStatus && (
                      <span
                        onClick={(e) => {
                          e.stopPropagation()
                          updateStatus(intake.id, nextStatus)
                        }}
                        className="text-[9px] font-black uppercase tracking-widest px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded-lg transition-colors flex items-center gap-1.5"
                      >
                        {updatingId === intake.id ? (
                          <Loader2 size={10} className="animate-spin" />
                        ) : (
                          <CheckCircle2 size={10} />
                        )}
                        Mark {nextStatus}
                      </span>
                    )}
                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </div>
                </button>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="px-5 pb-5 border-t border-white/5 pt-4 space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Patient Info */}
                      <div className="space-y-2">
                        <h4 className="text-[9px] font-black uppercase tracking-widest text-emerald-400 flex items-center gap-1.5">
                          <User size={10} /> Patient Details
                        </h4>
                        <div className="bg-black/30 rounded-lg p-3 space-y-1.5 text-xs">
                          <p>
                            <span className="text-slate-500">Guardian:</span>{' '}
                            <span className="text-white">{intake.guardian_name}</span>
                          </p>
                          <p>
                            <span className="text-slate-500">CNIC:</span>{' '}
                            <span className="text-white font-mono">{intake.cnic}</span>
                          </p>
                          <p>
                            <span className="text-slate-500">Gender:</span>{' '}
                            <span className="text-white">{intake.gender}</span>
                          </p>
                          {intake.date_of_birth && (
                            <p>
                              <span className="text-slate-500">DOB:</span>{' '}
                              <span className="text-white">{formatDate(intake.date_of_birth)}</span>
                            </p>
                          )}
                          <p>
                            <span className="text-slate-500">Address:</span>{' '}
                            <span className="text-white">{intake.address || '—'}</span>
                          </p>
                        </div>
                      </div>

                      {/* Service Info */}
                      <div className="space-y-2">
                        <h4 className="text-[9px] font-black uppercase tracking-widest text-blue-400 flex items-center gap-1.5">
                          <FileText size={10} /> Service Details
                        </h4>
                        <div className="bg-black/30 rounded-lg p-3 space-y-1.5 text-xs">
                          <p>
                            <span className="text-slate-500">Service:</span>{' '}
                            <span className="text-white">{intake.service_type}</span>
                          </p>
                          <p>
                            <span className="text-slate-500">Rate:</span>{' '}
                            <span className="text-emerald-400 font-mono font-bold">
                              {formatPKR(intake.billing_rate)}/day
                            </span>
                          </p>
                          <p>
                            <span className="text-slate-500">Start:</span>{' '}
                            <span className="text-white">{formatDate(intake.start_date)}</span>
                          </p>
                          <p>
                            <span className="text-slate-500">Submitted:</span>{' '}
                            <span className="text-white">{formatDateTime(intake.created_at)}</span>
                          </p>
                          <p>
                            <span className="text-slate-500">Signed by:</span>{' '}
                            <span className="text-white">{intake.signatory_name}</span>
                          </p>
                        </div>
                      </div>

                      {/* Equipment */}
                      <div className="space-y-2">
                        <h4 className="text-[9px] font-black uppercase tracking-widest text-purple-400 flex items-center gap-1.5">
                          <Package size={10} /> Equipment Rental
                        </h4>
                        <div className="bg-black/30 rounded-lg p-3 space-y-1.5 text-xs">
                          {equipment.length === 0 ? (
                            <p className="text-slate-500 italic">No equipment requested</p>
                          ) : (
                            equipment.map((eq: any, i: number) => (
                              <div
                                key={i}
                                className="border-b border-white/5 pb-1.5 last:border-0 last:pb-0"
                              >
                                <p className="text-white font-bold">{eq.name}</p>
                                <p className="text-slate-500 text-[10px]">
                                  Qty: {eq.quantity}
                                  {eq.daily_fee > 0 && ` • ${formatPKR(eq.daily_fee)}/day`}
                                  {eq.start_date && ` • ${formatDate(eq.start_date)}`}
                                  {eq.end_date && ` → ${formatDate(eq.end_date)}`}
                                </p>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Notes & Actions */}
                    <div className="flex flex-col md:flex-row gap-4 items-start">
                      <div className="flex-1 w-full">
                        <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-1.5 mb-1.5">
                          <MessageSquare size={10} /> Staff Notes
                        </label>
                        <textarea
                          defaultValue={intake.staff_notes || ''}
                          rows={2}
                          placeholder="Add notes about this intake..."
                          onBlur={(e) => saveNotes(intake.id, e.target.value)}
                          className="w-full bg-black/30 border border-white/5 rounded-lg p-3 text-xs text-white outline-none focus:border-emerald-500/30 transition-colors placeholder:text-slate-600 resize-none"
                        />
                      </div>
                      <div className="flex gap-2">
                        {STATUS_FLOW.map((s) => (
                          <button
                            key={s}
                            onClick={() => updateStatus(intake.id, s)}
                            disabled={s === intake.status}
                            className={cn(
                              'text-[9px] font-black uppercase tracking-widest px-3 py-2 rounded-lg border transition-all',
                              s === intake.status
                                ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400'
                                : 'border-white/5 text-slate-500 hover:border-white/20 hover:text-white'
                            )}
                          >
                            {updatingId === intake.id ? (
                              <Loader2 size={10} className="animate-spin" />
                            ) : (
                              s
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
      <ShareIntakeModal open={showShare} onClose={() => setShowShare(false)} />
    </div>
  )
}
