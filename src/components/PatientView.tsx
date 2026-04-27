/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  ClipboardList,
  Clock,
  MapPin,
  User,
  CreditCard,
  Plus,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { Patient } from '../types';
import { cn, formatPKR } from '../lib/utils';
import { patientService } from '../services/patientService';

export default function PatientView() {
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    patient_name: '',
    cnic: '',
    mobile_number: '',
    district: '',
    complete_address: '',
    service_type: '12h_day',
    monthly_package_pkr: '',
    status: 'Pending' as 'Active' | 'Pending' | 'Completed' | 'Cancelled',
    start_date: new Date().toISOString().split('T')[0]
  });

  const loadPatients = async () => {
    try {
      const data = await patientService.getAllPatients();
      setPatients(data);
    } catch (error) {
      console.error('Error fetching patients:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPatients();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await patientService.createPatient({
        ...formData,
        monthly_package_pkr: parseFloat(formData.monthly_package_pkr) || 0
      });
      alert('Patient registered successfully!');
      setShowForm(false);
      setFormData({
        patient_name: '',
        cnic: '',
        mobile_number: '',
        district: '',
        complete_address: '',
        service_type: '12h_day',
        monthly_package_pkr: '',
        status: 'Pending',
        start_date: new Date().toISOString().split('T')[0]
      });
      loadPatients();
    } catch (error) {
      console.error('Error registering patient:', error);
      alert('Registration failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <Loader2 className="text-emerald-500 animate-spin" size={40} />
        <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black">Syncing Residence Hub...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-slate-900/40 border border-white/5 p-6 rounded-xl shadow-2xl">
        <div>
          <h2 className="text-xl font-black text-white uppercase tracking-tighter">Patient Admissions</h2>
          <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black mt-1">Karachi Active Households Ledger</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn-primary flex items-center gap-2 px-6"
        >
          {showForm ? 'Cancel Registration' : <><Plus size={16} /> Register Patient</>}
        </button>
      </div>

      {showForm && (
        <div className="bg-slate-900/40 border border-white/5 p-8 rounded-xl shadow-2xl animate-in fade-in slide-in-from-top-4 duration-300">
          <h3 className="text-sm font-black text-blue-400 uppercase tracking-[0.2em] mb-6">Patient Registration Form</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[9px] text-slate-500 uppercase font-black tracking-widest">Full Name</label>
              <input
                required
                value={formData.patient_name}
                onChange={e => setFormData({ ...formData, patient_name: e.target.value })}
                className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-emerald-500/40"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[9px] text-slate-500 uppercase font-black tracking-widest">CNIC (XXXXX-XXXXXXX-X)</label>
              <input
                placeholder="42101-1234567-1"
                value={formData.cnic}
                onChange={e => setFormData({ ...formData, cnic: e.target.value })}
                className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-white text-sm font-mono outline-none focus:border-emerald-500/40"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[9px] text-slate-500 uppercase font-black tracking-widest">Mobile Number</label>
              <input
                required
                value={formData.mobile_number}
                onChange={e => setFormData({ ...formData, mobile_number: e.target.value })}
                className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-white text-sm font-mono outline-none focus:border-emerald-500/40"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[9px] text-slate-500 uppercase font-black tracking-widest">District (Karachi)</label>
              <select
                required
                value={formData.district}
                onChange={e => setFormData({ ...formData, district: e.target.value })}
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
              <label className="text-[9px] text-slate-500 uppercase font-black tracking-widest">Complete Address</label>
              <textarea
                value={formData.complete_address}
                onChange={e => setFormData({ ...formData, complete_address: e.target.value })}
                className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-emerald-500/40 h-24"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[9px] text-slate-500 uppercase font-black tracking-widest">Service Type</label>
              <select
                value={formData.service_type}
                onChange={e => setFormData({ ...formData, service_type: e.target.value })}
                className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-emerald-500/40"
              >
                <option value="12h_day">12h Day</option>
                <option value="12h_night">12h Night</option>
                <option value="24h">24h Full</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[9px] text-slate-500 uppercase font-black tracking-widest">Monthly Package (PKR)</label>
              <input
                type="number"
                required
                value={formData.monthly_package_pkr}
                onChange={e => setFormData({ ...formData, monthly_package_pkr: e.target.value })}
                className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-emerald-400 text-sm font-mono outline-none focus:border-emerald-500/40"
              />
            </div>
            <div className="space-y-2 text-right md:col-span-2 mt-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-8 py-4 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-slate-950 text-xs font-black uppercase tracking-widest rounded-xl transition-all shadow-xl shadow-emerald-500/20 flex items-center gap-2 ml-auto"
              >
                {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : 'Confirm Registration'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6">
        {patients.length === 0 ? (
          <div className="bg-slate-900/40 border border-dashed border-white/10 rounded-xl p-12 text-center">
            <ClipboardList className="text-slate-700 mx-auto mb-4" size={48} />
            <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">No entries found in registry</p>
          </div>
        ) : patients.map((patient: any) => (
          <div key={patient.id} className="bg-slate-900/40 border border-white/5 rounded-2xl p-6 shadow-2xl group hover:border-white/10 transition-all">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 pb-6 border-b border-white/5">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 border border-emerald-500/20">
                  <User size={20} />
                </div>
                <div>
                  <h3 className="font-black text-white uppercase tracking-tighter text-xl">{patient.patient_name}</h3>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold flex items-center gap-1">
                      <MapPin size={10} className="text-blue-500" /> {patient.district}
                    </span>
                    {patient.cnic && (
                      <>
                        <span className="w-1 h-1 bg-slate-800 rounded-full"></span>
                        <span className="text-[10px] text-slate-500 font-mono font-bold tracking-widest uppercase">{patient.cnic}</span>
                      </>
                    )}
                    <span className="w-1 h-1 bg-slate-800 rounded-full"></span>
                    <span className={cn(
                      "px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border",
                      patient.status === 'Active'
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                        : "bg-blue-500/10 text-blue-400 border-blue-500/20"
                    )}>
                      {patient.status}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between md:justify-end gap-8 bg-black/40 p-4 rounded-xl border border-white/5">
                <div className="text-center md:text-right">
                  <p className="text-[9px] uppercase font-black text-slate-600 tracking-[0.2em] mb-1">Monthly Package</p>
                  <p className="text-lg font-mono font-bold text-emerald-400 tracking-tighter">
                    PKR {(patient.monthly_package_pkr || 0).toLocaleString()}
                  </p>
                </div>
                <div className="h-8 w-px bg-white/5 hidden md:block"></div>
                <div className="text-center">
                  <p className="text-[9px] uppercase font-black text-slate-600 tracking-[0.2em] mb-1">Service</p>
                  <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-white uppercase">
                    <Clock size={12} className="text-blue-400" /> {patient.service_type?.replace('_', ' ') || '---'}
                  </div>
                </div>
              </div>
            </div>

            {patient.complete_address && (
              <div className="mb-6 p-4 bg-white/5 rounded-xl border border-white/5">
                <p className="text-[9px] text-slate-500 uppercase font-bold tracking-widest mb-1 flex items-center gap-2">
                  <MapPin size={10} /> Residence Address
                </p>
                <p className="text-[11px] text-slate-300 font-medium leading-relaxed">{patient.complete_address}</p>
              </div>
            )}

            {/* Assignments & Manual Salary Slots */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white/5 rounded-xl p-4 border border-white/10 relative overflow-hidden">
                <div className="absolute top-0 right-0 px-2 py-1 bg-blue-500/20 text-blue-400 text-[7px] font-black uppercase tracking-widest border-b border-l border-blue-500/30 rounded-bl-md">
                  Day Shift (12h)
                </div>
                <p className="text-[9px] text-slate-500 uppercase font-bold tracking-widest mb-3">Assigned Staff</p>
                {patient.assigned_staff_id ? (
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/5 flex items-center justify-center text-emerald-500">
                        <User size={14} />
                      </div>
                      <p className="text-sm font-bold text-white">Staff Assigned</p>
                    </div>
                    <div className="max-w-[100px]">
                      <p className="text-[8px] text-slate-500 uppercase font-bold tracking-widest text-right mb-1">Decided Rate</p>
                      <input
                        type="number"
                        placeholder="PKR"
                        className="w-full bg-slate-900 border border-white/5 rounded px-2 py-1 text-xs font-mono font-bold text-emerald-400 outline-none focus:border-emerald-500/40 text-right"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-amber-400/50 text-[10px] uppercase font-bold italic py-2">
                    <AlertCircle size={14} /> Slot Unassigned
                  </div>
                )}
              </div>

              {patient.service_type === '24hr' && (
                <div className="bg-white/5 rounded-xl p-4 border border-white/10 relative overflow-hidden">
                  <div className="absolute top-0 right-0 px-2 py-1 bg-purple-500/20 text-purple-400 text-[7px] font-black uppercase tracking-widest border-b border-l border-purple-500/30 rounded-bl-md">
                    Night Shift (12h)
                  </div>
                  <p className="text-[9px] text-slate-500 uppercase font-bold tracking-widest mb-3">Assigned Staff</p>
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-purple-500/5 flex items-center justify-center text-purple-400">
                        <User size={14} />
                      </div>
                      <p className="text-sm font-bold text-white">Pending Match</p>
                    </div>
                    <div className="max-w-[100px]">
                       <p className="text-[8px] text-slate-500 uppercase font-bold tracking-widest text-right mb-1">Decided Rate</p>
                       <input
                        type="number"
                        placeholder="PKR"
                        className="w-full bg-slate-900 border border-white/5 rounded px-2 py-1 text-xs font-mono font-bold text-emerald-400 outline-none focus:border-emerald-500/40 text-right"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button title="Financial Ledger" className="p-3 hover:bg-white/5 rounded-xl transition-colors border border-white/5 group-hover:border-white/10">
                <CreditCard size={18} className="text-slate-500 group-hover:text-white transition-colors" />
              </button>
              <button className="flex-1 md:flex-none px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-[10px] font-black uppercase tracking-[0.2em] rounded-xl transition-all shadow-xl shadow-emerald-500/10">
                Manage Case
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
