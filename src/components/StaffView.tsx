/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  MoreVertical,
  Phone,
  MapPin,
  Star,
  Plus,
  Users,
  CheckCircle2,
  XCircle,
  Loader2,
  Banknote,
  DollarSign
} from 'lucide-react';
import { Staff } from '../types';
import { cn, formatPKR } from '../lib/utils';
import { STAFF_CATEGORIES, KARACHI_AREAS } from '../constants';
import { staffService } from '../services/staffService';
import { advanceService } from '../services/advanceService';

export default function StaffView() {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [staffList, setStaffList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    cnic_number: '',
    phone_primary: '',
    district: '',
    category: 'Nurse',
    position_applied: '',
    experience_years: 0,
    expected_salary_pkr: 0,
    is_active: true,
    is_available: true
  });
  const [selectedStaffForAdvance, setSelectedStaffForAdvance] = useState<any | null>(null);
  const [advanceAmount, setAdvanceAmount] = useState('');
  const [isSubmittingAdvance, setIsSubmittingAdvance] = useState(false);

  const calculateAge = (dob: string | undefined) => {
    if (!dob) return null;
    try {
      const birthDate = new Date(dob);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      return age;
    } catch {
      return null;
    }
  };

  const handleToggleAvailability = async (staffId: string, currentStatus: boolean) => {
    try {
      await staffService.updateStaff(staffId, { is_available: !currentStatus });
      setStaffList(prev => prev.map(s => s.id === staffId ? { ...s, is_available: !currentStatus } : s));
    } catch (error) {
      console.error('Error toggling availability:', error);
    }
  };

  const loadStaff = async () => {
    try {
      const data = await staffService.getAllStaff();
      setStaffList(data);
    } catch (error) {
      console.error('Error fetching staff:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStaff();
  }, []);

  const handleRegisterStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await staffService.createStaff({
        ...formData,
        rating: 5.0,
        critical_missing_info: !formData.full_name || !formData.cnic_number || !formData.phone_primary
      });
      alert('Staff registered successfully!');
      setShowForm(false);
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
        is_available: true
      });
      loadStaff();
    } catch (error: any) {
      console.error('Error registering staff:', error);
      alert(`Registration failed: ${error.message || 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGiveAdvance = async () => {
    if (!selectedStaffForAdvance || !advanceAmount) return;

    setIsSubmittingAdvance(true);
    try {
      await advanceService.addAdvance({
        employee_id: selectedStaffForAdvance.id,
        amount_pkr: parseFloat(advanceAmount),
        payment_method: 'Cash', // Default to cash for quick advances
        status: 'Pending'
      });
      alert(`Advance of PKR ${advanceAmount} recorded for ${selectedStaffForAdvance.full_name}`);
      setSelectedStaffForAdvance(null);
      setAdvanceAmount('');
    } catch (error) {
      console.error('Error giving advance:', error);
      alert('Failed to record advance.');
    } finally {
      setIsSubmittingAdvance(false);
    }
  };

  const filteredStaff = staffList.filter(s => {
    const matchesSearch = (s.full_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (s.district || '').toLowerCase().includes(searchTerm.toLowerCase());

    if (categoryFilter === 'Action Required') {
      return matchesSearch && s.critical_missing_info;
    }

    const matchesCategory = categoryFilter === 'All' || s.position_applied === categoryFilter || s.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <Loader2 className="text-emerald-500 animate-spin" size={40} />
        <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black">Decrypting Staff Ledger...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white/5 p-4 rounded-xl border border-white/5">
        <div>
          <h2 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
            Staff Management
          </h2>
          <p className="text-[9px] text-slate-500 uppercase font-bold tracking-widest mt-0.5">Manage and register Karachi medical professionals</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn-primary flex items-center gap-2 px-6"
        >
          {showForm ? 'Cancel' : <><Plus size={16} /> Register Staff</>}
        </button>
      </div>

      {showForm && (
        <div className="bg-slate-900/40 border border-white/5 p-8 rounded-xl shadow-2xl animate-in fade-in slide-in-from-top-4 duration-300">
          <h3 className="text-sm font-black text-blue-400 uppercase tracking-[0.2em] mb-6">Staff Registration Form</h3>
          <form onSubmit={handleRegisterStaff} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[9px] text-slate-500 uppercase font-black tracking-widest text-left block">Full Name</label>
              <input
                required
                value={formData.full_name}
                onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-emerald-500/40"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[9px] text-slate-500 uppercase font-black tracking-widest text-left block">CNIC (XXXXX-XXXXXXX-X)</label>
              <input
                required
                placeholder="42101-1234567-1"
                value={formData.cnic_number}
                onChange={e => setFormData({ ...formData, cnic_number: e.target.value })}
                className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-white text-sm font-mono outline-none focus:border-emerald-500/40"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[9px] text-slate-500 uppercase font-black tracking-widest text-left block">Mobile Number</label>
              <input
                required
                value={formData.phone_primary}
                onChange={e => setFormData({ ...formData, phone_primary: e.target.value })}
                className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-white text-sm font-mono outline-none focus:border-emerald-500/40"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[9px] text-slate-500 uppercase font-black tracking-widest text-left block">District</label>
              <select
                required
                value={formData.district}
                onChange={e => setFormData({ ...formData, district: e.target.value })}
                className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-emerald-500/40"
              >
                <option value="">Select District</option>
                {KARACHI_AREAS.map(area => (
                  <option key={area} value={area}>{area}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[9px] text-slate-500 uppercase font-black tracking-widest text-left block">Category</label>
              <select
                required
                value={formData.category}
                onChange={e => setFormData({ ...formData, category: e.target.value })}
                className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-emerald-500/40"
              >
                {STAFF_CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[9px] text-slate-500 uppercase font-black tracking-widest text-left block">Position Applied</label>
              <input
                required
                value={formData.position_applied}
                onChange={e => setFormData({ ...formData, position_applied: e.target.value })}
                className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-emerald-500/40"
                placeholder="e.g. ICU Nurse"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[9px] text-slate-500 uppercase font-black tracking-widest text-left block">Experience Years</label>
              <input
                type="number"
                value={formData.experience_years}
                onChange={e => setFormData({ ...formData, experience_years: parseInt(e.target.value) || 0 })}
                className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-white text-sm font-mono outline-none focus:border-emerald-500/40"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[9px] text-slate-500 uppercase font-black tracking-widest text-left block">Expected Salary (PKR)</label>
              <input
                type="number"
                value={formData.expected_salary_pkr}
                onChange={e => setFormData({ ...formData, expected_salary_pkr: parseInt(e.target.value) || 0 })}
                className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-emerald-400 text-sm font-mono outline-none focus:border-emerald-500/40"
              />
            </div>
            <div className="space-y-2 text-right md:col-span-2 mt-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-8 py-4 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-slate-950 text-xs font-black uppercase tracking-widest rounded-xl transition-all shadow-xl shadow-emerald-500/20 flex items-center gap-2 ml-auto"
              >
                {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : 'Register Professional'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center justify-between">
        <div className="relative flex-1 min-w-[300px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-ink-dim)]" size={18} />
          <input
            type="text"
            placeholder="Search staff by name or area..."
            className="w-full pl-10 input-field"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex gap-2 mb-2 w-full overflow-x-auto pb-2 scrollbar-hide">
          {['All', 'Action Required', ...STAFF_CATEGORIES].map(cat => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={cn(
                "px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all shrink-0 whitespace-nowrap",
                categoryFilter === cat
                  ? (cat === 'Action Required' ? "bg-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.4)]" : "bg-emerald-500 text-slate-950")
                  : "bg-slate-900 text-slate-500 hover:text-slate-300 border border-white/5"
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Staff Grid */}
      {filteredStaff.length > 0 ? (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {filteredStaff.map((staff) => (
            <div
              key={staff.id}
              className={cn(
                "glass-card hover:border-white/20 transition-all group relative overflow-hidden",
                staff.critical_missing_info && "border-red-500/50 shadow-[0_0_20px_rgba(239,68,68,0.15)] ring-1 ring-red-500/20"
              )}
            >
              {staff.critical_missing_info && (
                <div className="absolute top-0 right-0 px-2 py-1 bg-red-500 text-white text-[8px] font-black uppercase tracking-widest rounded-bl-lg z-10 animate-pulse">
                  Action Required: Missing Info
                </div>
              )}
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-[var(--color-border)] flex items-center justify-center text-2xl font-bold text-[var(--color-brand)] uppercase">
                      {(staff.full_name || staff.fullName || '?')[0]}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold flex items-center gap-2 text-white">
                        {staff.full_name}
                        {staff.is_verified && <CheckCircle2 size={16} className="text-blue-400" />}
                      </h3>
                      <div className="flex items-center gap-4 text-sm text-[var(--color-ink-dim)] mt-1">
                        <span className="text-emerald-500 text-[10px] font-mono font-black uppercase tracking-widest">{staff.emp_no}</span>
                        <span className="bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest border border-emerald-500/20">{staff.position_applied}</span>
                        <span className="flex items-center gap-1 font-bold text-[10px] uppercase tracking-widest"><MapPin size={14} className="text-blue-500" /> {staff.district}</span>
                        <span className="text-[10px] bg-white/5 px-2 py-0.5 rounded border border-white/10 font-bold uppercase tracking-widest text-slate-400">
                          {staff.religion || 'Muslim'}
                        </span>
                        {calculateAge(staff.dob) && (
                          <span className="text-[10px] bg-white/5 px-2 py-0.5 rounded border border-white/10 font-bold uppercase tracking-widest">
                            Age: {calculateAge(staff.dob)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <button className="p-2 hover:bg-[var(--color-border)] rounded-lg transition-colors">
                    <MoreVertical size={20} className="text-slate-500" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-slate-900/50 p-3 rounded-xl border border-white/5">
                    <p className="text-slate-500 text-[10px] uppercase font-black tracking-widest mb-1">Rating</p>
                    <div className="flex items-center gap-1 text-emerald-400 font-mono font-bold">
                      <Star size={14} fill="currentColor" /> {(staff.rating || 0).toFixed(1)}
                    </div>
                  </div>
                  <div className="bg-slate-900/50 p-3 rounded-xl border border-white/5 relative group/info">
                    <p className="text-slate-500 text-[10px] uppercase font-black tracking-widest mb-1">Expected Salary</p>
                    <div className="font-mono font-bold text-emerald-400 text-sm">PKR {staff.expected_salary_pkr?.toLocaleString() || '-'}</div>

                    {staff.relative_info && (
                      <div className="absolute inset-0 bg-slate-900 border border-red-500/20 rounded-xl opacity-0 group-hover/info:opacity-100 transition-opacity flex flex-col justify-center px-4 pointer-events-none">
                        <p className="text-[8px] text-red-400 uppercase font-black tracking-widest mb-0.5">Emergency Contact ({staff.relative_info.relationship})</p>
                        <p className="text-[10px] text-white font-bold truncate">{staff.relative_info.name}</p>
                        <p className="text-[9px] text-slate-400 font-mono">{staff.relative_info.phone}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-white/5">
                  <div className="flex gap-2">
                    {(staff.skills || []).slice(0, 3).map((skill: string) => (
                      <span key={skill} className="text-[9px] uppercase tracking-wider font-black px-2 py-1 bg-white/5 border border-white/10 rounded text-slate-400">
                        {skill}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center gap-3">
                      <button
                        onClick={() => setSelectedStaffForAdvance(staff)}
                        className="flex items-center gap-1.5 px-3 py-1 text-[9px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-500/5 hover:bg-emerald-500/10 border border-emerald-500/10 rounded-lg transition-all"
                      >
                        <Banknote size={14} /> Gift Advance
                      </button>
                      <button className="text-blue-400 hover:scale-110 transition-transform">
                        <Phone size={20} />
                      </button>
                      <button
                        onClick={() => handleToggleAvailability(staff.id, staff.is_available)}
                        className={cn(
                          "px-3 py-1 rounded text-[10px] font-black uppercase tracking-widest border transition-all active:scale-95",
                          staff.is_available ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20" : "bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20"
                        )}
                      >
                        {staff.is_available ? 'Available' : 'On Duty'}
                      </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-20 text-center flex flex-col items-center justify-center">
          <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-6 border border-white/10 text-slate-500">
            <Users size={32} />
          </div>
          <h3 className="text-sm font-black text-white uppercase tracking-widest">No Staff Members Found</h3>
          <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mt-2 max-w-xs leading-relaxed">
            {searchTerm || categoryFilter !== 'All'
              ? "We couldn't find any staff matching your current search or filters."
              : "The HQ Ledger is currently empty. Use the Register button or AI OCR to add professionals."}
          </p>
          {(searchTerm || categoryFilter !== 'All') && (
            <button
              onClick={() => { setSearchTerm(''); setCategoryFilter('All'); }}
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
                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-2">Recipient</p>
                <p className="text-sm font-bold text-white mb-4">{selectedStaffForAdvance.full_name}</p>

                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-2">Amount (PKR)</p>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-500 font-bold ml-1">Rs.</span>
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
                  Notice: Advances are automatically deducted from the Gross Accrual at end of month. No manual entries required in Payout ledger.
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
    </div>
  );
}
