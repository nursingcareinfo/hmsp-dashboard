/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Home, 
  ArrowRight, 
  MapPin, 
  Star,
  CheckCircle2,
  Plus,
  Loader2
} from 'lucide-react';
import { cn, formatPKR } from '../lib/utils';
import { motion } from 'motion/react';
import { staffService, Staff } from '../services/staffService';
import { patientService, Patient } from '../services/patientService';

export default function MatchmakerView() {
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [allStaff, allPatients] = await Promise.all([
          staffService.getAllStaff(),
          patientService.getAllPatients()
        ]);
        
        setStaff(allStaff.filter(s => s.is_available && s.is_active));
        setPatients(allPatients.filter(p => p.status === 'Pending'));
      } catch (error) {
        console.error('Error loading matcher data:', error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleMatch = () => {
    if (selectedStaffId && selectedPatientId) {
      const selectedStaff = staff.find(s => s.id === selectedStaffId);
      const selectedPatient = patients.find(p => p.id === selectedPatientId);
      
      alert(`Assigned ${selectedStaff?.full_name} to ${selectedPatient?.patient_name}`);
      setSelectedStaffId(null);
      setSelectedPatientId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <Loader2 className="text-blue-500 animate-spin" size={40} />
        <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black">Scanning Assignment Network...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 h-full flex flex-col">
       <div className="flex justify-between items-center bg-slate-900/40 border border-white/5 p-6 rounded-xl mb-4 shadow-2xl">
          <div>
            <h2 className="text-xl font-black text-white uppercase tracking-tighter">Manual Assignment Wall</h2>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black mt-1">Karachi Operations Hub • Secure Matchmaking</p>
          </div>
          
          <button 
            disabled={!selectedStaffId || !selectedPatientId}
            onClick={handleMatch}
            className="w-full max-w-xs py-4 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs rounded-xl uppercase tracking-[0.2em] shadow-xl shadow-emerald-500/20 transition-all active:scale-[0.98] disabled:grayscale flex items-center justify-center gap-2"
          >
            Confirm Match <ArrowRight size={18} />
          </button>
       </div>

       <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 flex-1 overflow-hidden">
          {/* Staff Column */}
          <div className="flex flex-col gap-4">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 px-2 flex items-center gap-2">
              <Users size={14} className="text-blue-400" /> Available Staff Pool ({staff.length})
            </h3>
            <div className="flex-1 overflow-auto space-y-3 pr-2 scrollbar-none">
              {staff.length === 0 ? (
                <div className="p-12 text-center border border-dashed border-white/5 rounded-xl opacity-50">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">No available staff found</p>
                </div>
              ) : staff.map(s => (
                <button
                  key={s.id}
                  onClick={() => setSelectedStaffId(s.id)}
                  className={cn(
                    "w-full text-left bg-slate-900/40 border p-4 rounded-xl transition-all group",
                    selectedStaffId === s.id 
                      ? "border-blue-500/50 bg-blue-500/5 shadow-lg shadow-blue-500/10" 
                      : "border-white/5 hover:border-white/10"
                  )}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-bold text-white uppercase tracking-tight">{s.full_name}</p>
                      <div className="flex items-center gap-3 text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1.5">
                        <span className="text-blue-400 font-mono">{s.position_applied}</span>
                        <span className="flex items-center gap-1 font-sans"><MapPin size={10} /> {s.district}</span>
                      </div>
                    </div>
                    <div className="text-right">
                       <div className="flex items-center gap-1 text-emerald-400 font-mono font-black text-xs">
                         <Star size={12} fill="currentColor" /> {s.rating}
                       </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Patient Column */}
          <div className="flex flex-col gap-4">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 px-2 flex items-center gap-2">
              <Home size={14} className="text-emerald-400" /> Pending Residence Slots ({patients.length})
            </h3>
            <div className="flex-1 overflow-auto space-y-3 pr-2 scrollbar-none">
              {patients.length === 0 ? (
                <div className="p-12 text-center border border-dashed border-white/5 rounded-xl opacity-50">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">No pending assignments</p>
                </div>
              ) : patients.map(p => (
                <button
                  key={p.id}
                  onClick={() => setSelectedPatientId(p.id)}
                  className={cn(
                    "w-full text-left bg-slate-900/40 border p-4 rounded-xl transition-all group",
                    selectedPatientId === p.id 
                      ? "border-emerald-500/50 bg-emerald-500/5 shadow-lg shadow-emerald-500/10" 
                      : "border-white/5 hover:border-white/10"
                  )}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-bold text-white uppercase tracking-tight">{p.patient_name}</p>
                      <div className="flex items-center gap-3 text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1.5">
                        <span className="text-emerald-400 font-mono">{p.service_type}</span>
                        <span className="flex items-center gap-1 font-sans"><MapPin size={10} /> {p.district}</span>
                      </div>
                    </div>
                    <div className={cn(
                      "w-8 h-8 rounded-full border flex items-center justify-center transition-all",
                      selectedPatientId === p.id 
                        ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400" 
                        : "bg-white/5 border-white/5 text-slate-700"
                    )}>
                      <Plus size={16} />
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
       </div>
    </div>
  );
}
