/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { 
  Upload, 
  Loader2, 
  CheckCircle2, 
  XCircle,
  FileText, 
  CreditCard,
  User,
  MapPin,
  ShieldCheck,
  Phone
} from 'lucide-react';
import { extractStaffData } from '../services/geminiService';
import { staffService } from '../services/staffService';
import { cn, formatPKR } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

export default function OCRView() {
  const [files, setFiles] = useState<File[]>([]);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [extractedData, setExtractedData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const onDrop = (acceptedFiles: File[]) => {
    setFiles(prev => [...prev, ...acceptedFiles].slice(0, 4)); // Max 4 files
    setExtractedData(null);
    setError(null);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpeg', '.jpg', '.png'] } as any,
    multiple: true
  } as any);

  const handleStartExtraction = async () => {
    if (files.length === 0) return;
    
    setIsExtracting(true);
    setError(null);
    
    try {
      const base64Promises = files.map(file => {
        return new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve((reader.result as string).split(',')[1]);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      });

      const base64s = await Promise.all(base64Promises);
      const data = await extractStaffData(base64s);
      setExtractedData(data);
    } catch (err) {
      console.error(err);
      setError("Failed to extract data. Please ensure documents are clear and in frame.");
    } finally {
      setIsExtracting(false);
    }
  };

  const clearFiles = (e: React.MouseEvent) => {
    e.stopPropagation();
    setFiles([]);
    setExtractedData(null);
  };

  const handleCommit = async () => {
    if (!extractedData) return;
    
    setIsSaving(true);
    setError(null);
    
    const { identity, professional_profile, geographic_data, financial_reference, audit_metadata } = extractedData;
    
    try {
      // Cleaner formatting for phone and CNIC to satisfy Supabase regex
      const cleanPhone = (phone: string | null | undefined) => {
        if (!phone) return null;
        // Remove all non-digits
        const digits = phone.replace(/\D/g, '');
        
        let normalized = '';
        if (digits.startsWith('92') && digits.length === 12) {
          normalized = digits;
        } else if (digits.startsWith('03') && digits.length === 11) {
          normalized = '92' + digits.slice(1);
        } else if (digits.startsWith('3') && digits.length === 10) {
          normalized = '92' + digits;
        }

        if (normalized.length === 12) {
          return `+${normalized.slice(0, 2)} ${normalized.slice(2, 5)} ${normalized.slice(5)}`;
        }
        
        return null;
      };

      const cleanCNIC = (cnic: string | null | undefined) => {
        if (!cnic) return null;
        const digits = cnic.replace(/\D/g, '');
        if (digits.length === 13) {
          return `${digits.slice(0, 5)}-${digits.slice(5, 12)}-${digits.slice(12)}`;
        }
        return null; // Return null if not exactly 13 digits to satisfy DB regex
      };

      const cleanDate = (dateStr: string) => {
        if (!dateStr) return null;
        // If it's already YYYY-MM-DD
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
        // Try parsing common formats or just returning null if invalid for Supabase DATE
        try {
          const d = new Date(dateStr);
          if (isNaN(d.getTime())) return null;
          return d.toISOString().split('T')[0];
        } catch {
          return null;
        }
      };

      const getCategory = (position: string) => {
        const p = (position || '').toLowerCase();
        if (p.includes('nurse') || p.includes('rn') || p.includes('bsn')) return 'Nurse';
        if (p.includes('attendant')) return 'Attendant';
        if (p.includes('baby') || p.includes('child')) return 'Babysitter';
        if (p.includes('doctor')) return 'Doctor';
        if (p.includes('physio') || p.includes('dpt')) return 'Physiotherapist';
        return 'Nurse'; // Default
      };

      const staffPayload = {
        full_name: identity.fullName,
        father_husband_name: identity.fatherHusbandName,
        cnic_number: cleanCNIC(identity.cnicNumber),
        dob: cleanDate(identity.dateOfBirth),
        gender: identity.gender,
        marital_status: identity.maritalStatus,
        religion: identity.religion,
        relative_info: identity.emergencyContact ? {
          name: identity.emergencyContact.name,
          relationship: identity.emergencyContact.relationship,
          phone: cleanPhone(identity.emergencyContact.phone)
        } : null,
        phone_primary: cleanPhone(identity.mobileNumber),
        whatsapp_number: cleanPhone(identity.whatsappNumber || identity.mobileNumber),
        district: geographic_data.district?.split('(')[0]?.trim() || geographic_data.district, 
        complete_address: geographic_data.completeAddress,
        position_applied: professional_profile.positionApplied || 'Nurse',
        category: getCategory(professional_profile.positionApplied),
        experience_years: parseFloat(professional_profile.experienceYears as any) || 0,
        shift_preference: professional_profile.shiftPreference,
        expected_salary_pkr: parseFloat(financial_reference.expectedSalaryPKR as any) || 0,
        preferred_payment_method: financial_reference.preferredPayment,
        bank_info: financial_reference.bankDetails,
        is_active: true,
        is_available: true,
        is_acknowledgment_signed: audit_metadata.acknowledgmentSigned,
        data_confidence: audit_metadata.dataConfidence,
        critical_missing_info: !!audit_metadata.criticalMissingInfo,
        missing_fields_list: audit_metadata.missingFieldsList || [],
        rating: 5.0
      };

      console.debug('HMSP Commit Payload:', staffPayload);
      await staffService.createStaff(staffPayload);
      
      alert('Staff successfully committed to Karachi HQ Ledger.');
      setExtractedData(null);
      setFiles([]);
    } catch (err: any) {
      console.error('HMSP Commit error:', err);
      // Detailed error for common Supabase failures
      let msg = err.message || 'Check database connection or data format';
      if (err.code === '23505') msg = 'Duplicate CNIC or Employee ID found in HQ Ledger.';
      if (err.code === '23514') msg = 'Data failed Karachi HQ validation (CNIC or Phone format error).';
      setError(`Failed to commit data: ${msg}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="max-w-4xl mx-auto">
        {!extractedData ? (
          <div className="bg-slate-900/40 border border-white/5 rounded-xl p-8 text-center flex flex-col items-center">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-8 flex items-center gap-2">
              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
              Registration Gatekeeper (Multimodal AI Batch)
            </h2>
            
            <div 
              {...getRootProps()} 
              className={cn(
                "w-full border-2 border-dashed rounded-2xl p-12 transition-all cursor-pointer mb-8 flex flex-col items-center bg-white/5",
                isDragActive ? "border-blue-500/50 bg-blue-500/5" : "border-white/10 hover:border-blue-500/30"
              )}
            >
              <input {...getInputProps()} />
              {files.length > 0 ? (
                <div className="w-full">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    {files.map((f, i) => (
                      <div key={i} className="aspect-square bg-slate-800 rounded-lg border border-white/10 flex flex-col items-center justify-center p-2 relative group">
                        <FileText size={24} className="text-blue-400 mb-2" />
                        <span className="text-[8px] text-slate-300 truncate w-full text-center px-1 font-mono uppercase tracking-tighter">{f.name}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex flex-col items-center">
                    <p className="text-sm text-white font-medium">{files.length} Documents Selected</p>
                    <button 
                      onClick={clearFiles}
                      className="text-[9px] text-red-500 font-black uppercase tracking-widest mt-2 hover:text-red-400 transition-colors"
                    >
                      Clear Batch
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center opacity-40">
                  <div className="w-16 h-16 bg-white/10 text-slate-400 rounded-full flex items-center justify-center mb-4 border border-white/10">
                    <Upload size={32} />
                  </div>
                  <p className="text-sm font-bold uppercase tracking-[0.1em]">Batch Upload Documents</p>
                  <p className="text-[10px] text-slate-500 mt-2">Employee Form • CNIC • Curriculum Vitae (Max 4)</p>
                </div>
              )}
            </div>

            <button
              onClick={handleStartExtraction}
              disabled={files.length === 0 || isExtracting}
              className="w-full max-w-sm py-4 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs rounded-xl uppercase tracking-[0.2em] shadow-xl shadow-emerald-500/20 transition-all active:scale-[0.98] disabled:grayscale flex items-center justify-center gap-3"
            >
              {isExtracting ? (
                <>
                  <Loader2 className="animate-spin" size={16} /> Reasoning Across docs...
                </>
              ) : (
                "Run Multimodal Extraction"
              )}
            </button>
            
            {error && <p className="text-red-400 mt-4 text-xs font-bold uppercase tracking-widest">{error}</p>}
          </div>
        ) : (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <h2 className="text-xl font-black flex items-center gap-3 tracking-tighter text-white uppercase">
                <CheckCircle2 className="text-emerald-400" /> AI Extraction Result
              </h2>
              <button 
                onClick={() => setExtractedData(null)}
                className="text-[10px] font-black text-slate-500 hover:text-white uppercase tracking-widest transition-colors"
               >
                Reset & New Upload
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Identity & Personal */}
              <div className={cn(
                "bg-slate-900/40 border rounded-xl p-6 shadow-2xl relative overflow-hidden transition-colors",
                extractedData.audit_metadata.criticalMissingInfo ? "border-red-500/50 bg-red-500/5" : "border-white/5"
              )}>
                {extractedData.audit_metadata.dataConfidence === 'High' && !extractedData.audit_metadata.criticalMissingInfo && (
                  <div className="absolute top-0 right-0 px-3 py-1 bg-emerald-500/10 text-emerald-400 text-[8px] font-black uppercase tracking-widest border-b border-l border-emerald-500/20 rounded-bl-lg">
                    High Confidence
                  </div>
                )}
                {extractedData.audit_metadata.criticalMissingInfo && (
                  <div className="absolute top-0 right-0 px-3 py-1 bg-red-500 text-white text-[8px] font-black uppercase tracking-[0.15em] border-b border-l border-red-600 rounded-bl-lg shadow-[0_0_15px_rgba(239,68,68,0.5)]">
                    MISSING CRITICAL DATA
                  </div>
                )}
                <div className="flex items-center gap-2 text-[10px] font-black text-blue-400 uppercase tracking-[0.2em] mb-6">
                  <User size={14} /> Identity Details
                </div>
                <div className="space-y-1">
                  <DataRow 
                    label="Full Name" 
                    value={extractedData.identity.fullName} 
                    error={extractedData.audit_metadata.missingFieldsList?.includes('fullName')}
                  />
                  <DataRow label="Father/Husband" value={extractedData.identity.fatherHusbandName} />
                  <DataRow 
                    label="CNIC Number" 
                    value={extractedData.identity.cnicNumber} 
                    mono 
                    error={extractedData.audit_metadata.missingFieldsList?.includes('cnicNumber')}
                  />
                  <DataRow label="Date of Birth" value={extractedData.identity.dateOfBirth} mono />
                  <DataRow label="Marital Status" value={extractedData.identity.maritalStatus} />
                  <DataRow label="Gender" value={extractedData.identity.gender} />
                  <DataRow label="Religion" value={extractedData.identity.religion} />
                  <DataRow 
                    label="Mobile" 
                    value={extractedData.identity.mobileNumber} 
                    mono 
                    error={extractedData.audit_metadata.missingFieldsList?.includes('mobileNumber')}
                  />
                  <DataRow label="WhatsApp" value={extractedData.identity.whatsappNumber} mono />
                  {extractedData.identity.emergencyContact && (
                    <div className="mt-4 p-3 bg-red-500/5 rounded-lg border border-red-500/10">
                      <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                        <Phone size={10} className="text-red-400" /> Relative Contact (Emergency)
                      </p>
                      <div className="space-y-1 text-[10px]">
                        <div className="text-slate-400">Name: <span className="text-white font-bold">{extractedData.identity.emergencyContact.name}</span></div>
                        <div className="text-slate-400">Relation: <span className="text-white">{extractedData.identity.emergencyContact.relationship}</span></div>
                        <div className="text-slate-400">Phone: <span className="text-white font-mono">{extractedData.identity.emergencyContact.phone}</span></div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Professional */}
              <div className="bg-slate-900/40 border border-white/5 rounded-xl p-6 shadow-2xl">
                <div className="flex items-center gap-2 text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em] mb-6">
                  <ShieldCheck size={14} /> Professional Mapping
                </div>
                <div className="space-y-1">
                  <DataRow label="Position" value={extractedData.professional_profile.positionApplied} bold />
                  <DataRow label="Experience" value={`${extractedData.professional_profile.experienceYears} Years`} mono />
                  <DataRow label="Shift Preference" value={extractedData.professional_profile.shiftPreference} />
                  <div className="py-4">
                     <p className="text-[10px] uppercase font-black text-slate-500 tracking-[0.2em] mb-3">Skills Found</p>
                     <div className="flex flex-wrap gap-2">
                        {extractedData.professional_profile.topSkills?.map((s: string) => (
                          <span key={s} className="px-2 py-1 bg-white/5 border border-white/10 rounded text-[10px] font-bold text-slate-300 uppercase tracking-tight">
                            {s}
                          </span>
                        ))}
                     </div>
                  </div>
                </div>
              </div>

              {/* Geography & Finance */}
              <div className="bg-slate-900/40 border border-white/5 rounded-xl p-6 shadow-2xl relative overflow-hidden">
                {extractedData.geographic_data.reconciliationAlert && (
                  <div className="absolute top-0 right-0 bg-red-500/20 text-red-400 text-[8px] px-2 py-1 font-black uppercase tracking_widest border-b border-l border-red-500/30 rounded-bl-lg animate-pulse">
                    Identity Alert: Address Mismatch
                  </div>
                )}
                <div className="flex items-center gap-2 text-[10px] font-black text-amber-400 uppercase tracking-[0.2em] mb-6">
                  <MapPin size={14} /> Geographic & Financial
                </div>
                <div className="space-y-1">
                  <DataRow label="District" value={extractedData.geographic_data.district} />
                  <DataRow label="Form Address" value={extractedData.geographic_data.completeAddress} />
                  <DataRow label="Bill Anchor" value={extractedData.geographic_data.addressFromBill} />
                  <DataRow label="Method" value={extractedData.financial_reference.preferredPayment} />
                  
                  {extractedData.financial_reference.bankDetails && (
                    <div className="mt-4 p-3 bg-white/5 rounded-lg border border-white/5">
                      <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">Extraction: Bank Info</p>
                      <div className="grid grid-cols-2 gap-2 text-[10px]">
                        <div className="text-slate-400">Bank: <span className="text-white font-mono">{extractedData.financial_reference.bankDetails.bankName}</span></div>
                        <div className="text-slate-400">Title: <span className="text-white">{extractedData.financial_reference.bankDetails.accountTitle}</span></div>
                        <div className="col-span-2 text-slate-400">IBAN: <span className="text-white font-mono">{extractedData.financial_reference.bankDetails.iban}</span></div>
                      </div>
                    </div>
                  )}

                  <div className="pt-6">
                     <p className="text-[10px] uppercase font-black text-slate-500 tracking-[0.2em] mb-2">Expected Salary</p>
                     <div className="flex items-baseline gap-1">
                        <span className="text-xs text-emerald-500 font-mono font-bold">PKR</span>
                        <p className="text-2xl font-mono font-bold text-white tracking-tighter">{formatPKR(extractedData.financial_reference.expectedSalaryPKR || 0).replace('Rs. ', '')}</p>
                     </div>
                  </div>
                </div>
              </div>

              {/* Audit */}
              <div className="bg-slate-900/40 border border-white/5 rounded-xl p-6 shadow-2xl flex flex-col">
                <div className="flex items-center gap-2 text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em] mb-6">
                   Policy Audit & Compliance
                </div>
                
                <div className="space-y-4 mb-auto">
                  <div className="flex items-center gap-4 p-4 bg-white/5 rounded-xl border border-white/10">
                    <div className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center border shrink-0",
                      extractedData.audit_metadata.policyCheck === 'Pass' ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400" : "bg-red-500/20 border-red-500/30 text-red-400"
                    )}>
                        {extractedData.audit_metadata.policyCheck === 'Pass' ? <CheckCircle2 size={20} /> : <XCircle size={20} />}
                    </div>
                    <div>
                      <p className="text-xs font-black text-white uppercase tracking-widest">Verification Status</p>
                      <p className={cn(
                        "text-[10px] font-bold mt-0.5",
                        extractedData.audit_metadata.policyCheck === 'Pass' ? "text-emerald-500" : "text-amber-500"
                      )}>
                        {extractedData.audit_metadata.policyCheck === 'Pass' ? 'PASSED: Cross-Document Reasoning' : 'MANUAL AUDIT: Identity Reconciliation Needed'}
                      </p>
                      {extractedData.audit_metadata.reconciliationDetails && (
                        <p className="text-[9px] text-slate-500 mt-1 italic leading-tight">
                          {extractedData.audit_metadata.reconciliationDetails}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 p-4 bg-emerald-500/5 rounded-xl border border-emerald-500/10">
                    <div className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center border shrink-0",
                      extractedData.audit_metadata.acknowledgmentSigned ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400" : "bg-red-500/20 border-red-500/30 text-red-400"
                    )}>
                        {extractedData.audit_metadata.acknowledgmentSigned ? <CheckCircle2 size={20} /> : <XCircle size={20} />}
                    </div>
                    <div>
                      <p className="text-xs font-black text-white uppercase tracking-widest">
                        {extractedData.audit_metadata.acknowledgmentSigned ? 'Notice Clause Signed' : 'Notice Clause Missing'}
                      </p>
                      <p className="text-[10px] text-slate-500 font-bold mt-0.5">Form 49 Duty Abandonment Status</p>
                    </div>
                  </div>
                </div>
                
                <button 
                  onClick={handleCommit}
                  disabled={isSaving}
                  className="w-full mt-8 py-4 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs rounded-xl uppercase tracking-[0.2em] shadow-xl shadow-emerald-500/20 transition-all active:scale-[0.98] disabled:grayscale flex items-center justify-center gap-2"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="animate-spin" size={16} /> Committing...
                    </>
                  ) : (
                    "Commit (Add to Staff Ledger)"
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

function DataRow({ label, value, mono, bold, error }: { label: string, value: string, mono?: boolean, bold?: boolean, error?: boolean }) {
  return (
    <div className={cn(
      "flex justify-between items-center py-3 border-b border-white/5 last:border-0 group transition-colors",
      error && "bg-red-500/10 -mx-6 px-6"
    )}>
      <span className={cn(
        "text-[10px] font-black uppercase tracking-widest transition-colors",
        error ? "text-red-400" : "text-slate-500 group-hover:text-slate-400"
      )}>{label} {error && <span className="text-[8px] animate-pulse">(REQUIRED)</span>}</span>
      <span className={cn(
        "text-xs transition-colors",
        mono && "font-mono",
        bold ? "font-black text-white" : "font-semibold text-slate-300",
        error && "text-red-500 font-black"
      )}>{value || '---'}</span>
    </div>
  );
}
