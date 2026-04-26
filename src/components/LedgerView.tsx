/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Wallet, 
  TrendingUp, 
  Package, 
  UserMinus, 
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { cn, formatPKR } from '../lib/utils';

// Mock ledger data
const LEDGER_DATA = [
  {
    patientName: 'Haji Mohammed Yousuf',
    packagePrice: 120000,
    assignments: [
      { staffName: 'Amna Ahmed', rate: 45000, status: 'Completed' },
      { staffName: 'Asad Shah', rate: 45000, status: 'Active' }
    ]
  },
  {
    patientName: 'Mrs. Fatima Zahra',
    packagePrice: 75000,
    assignments: [
      { staffName: 'Zubair Khan', rate: 35000, status: 'Completed' }
    ]
  }
];

export default function LedgerView() {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="bg-slate-900/40 border border-white/5 rounded-xl p-6 relative overflow-hidden group">
           <p className="text-[10px] uppercase font-black text-slate-500 tracking-[0.2em] mb-4">Total Monthly Revenue</p>
           <div className="flex items-baseline gap-1">
             <span className="text-xs text-emerald-500 font-mono font-bold">PKR</span>
             <div className="text-2xl font-mono font-bold text-white tracking-tighter">{formatPKR(195000).replace('Rs. ', '')}</div>
           </div>
           <div className="absolute bottom-0 left-0 w-full h-[2px] bg-emerald-500/20"></div>
         </div>
         <div className="bg-slate-900/40 border border-white/5 rounded-xl p-6 relative overflow-hidden group">
           <p className="text-[10px] uppercase font-black text-slate-500 tracking-[0.2em] mb-4">Staff Liabilities (MTD)</p>
           <div className="flex items-baseline gap-1">
             <span className="text-xs text-red-500 font-mono font-bold">PKR</span>
             <div className="text-2xl font-mono font-bold text-red-400 tracking-tighter">{formatPKR(125000).replace('Rs. ', '')}</div>
           </div>
           <div className="absolute bottom-0 left-0 w-full h-[2px] bg-red-500/20"></div>
         </div>
         <div className="bg-slate-900/40 border border-white/5 rounded-xl p-6 relative overflow-hidden group">
           <p className="text-[10px] uppercase font-black text-slate-500 tracking-[0.2em] mb-4">Projected Margin</p>
           <div className="flex items-baseline gap-1">
             <span className="text-xs text-emerald-500 font-mono font-bold">PKR</span>
             <div className="text-2xl font-mono font-bold text-emerald-400 tracking-tighter">{formatPKR(70000).replace('Rs. ', '')}</div>
           </div>
           <div className="absolute bottom-0 left-0 w-full h-[2px] bg-emerald-500/40"></div>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
            Active Assignments Wall
          </h2>

          <div className="space-y-4">
            {LEDGER_DATA.map((row, i) => {
              const totalSalaries = row.assignments.reduce((sum, a) => sum + a.rate, 0);
              const marginPct = Math.round(((row.packagePrice - totalSalaries) / row.packagePrice) * 100);
              
              return (
                <div key={i} className="p-4 bg-emerald-950/20 border border-emerald-500/20 rounded-xl relative">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-white font-semibold">{row.patientName}</h3>
                      <p className="text-[10px] text-emerald-400/70 font-mono uppercase tracking-tighter">Package: {formatPKR(row.packagePrice)} / Month</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Margin: {marginPct}%</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    {row.assignments.map((assignment, j) => (
                      <div key={j} className="flex items-center gap-3 p-3 bg-white/5 rounded-lg border border-white/5 group hover:border-emerald-500/30 transition-all">
                        <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center font-bold text-xs text-white uppercase">
                          {assignment.staffName.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div className="flex-1">
                          <p className="text-xs font-medium text-white">{assignment.staffName}</p>
                          <p className="text-[10px] text-slate-400">Manual Entry • Status: {assignment.status}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-slate-500 font-mono">PKR</span>
                          <input 
                            type="text" 
                            defaultValue={assignment.rate.toLocaleString()} 
                            className="w-20 bg-black/40 border border-white/10 rounded px-2 py-1 text-xs text-emerald-400 font-mono focus:outline-none focus:border-emerald-500/50" 
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-4 pt-3 border-t border-white/5 flex justify-between items-center">
                    <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Verify Shift Completion</div>
                    <button className="px-3 py-1 bg-emerald-500/20 text-emerald-400 text-[10px] rounded border border-emerald-500/30 uppercase font-bold hover:bg-emerald-500/30 transition-colors">
                      Confirm Monthly Payout
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Sidebar Financials */}
        <div className="space-y-6">
          <div className="bg-slate-900/40 border border-white/5 rounded-xl p-6">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">Financial Ledger</h2>
            
            <div className="space-y-8">
              <div>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-2 font-bold">Total Staff Liabilities</p>
                <div className="flex justify-between items-end border-b border-white/10 pb-2">
                  <span className="text-2xl font-mono text-white font-bold">895,000</span>
                  <span className="text-xs text-slate-400 mb-1">PKR</span>
                </div>
              </div>

              <div className="space-y-4">
                 <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Unpaid Balance (Verified)</p>
                 <div className="p-4 bg-red-500/5 border border-red-500/10 rounded-lg group hover:bg-red-500/10 transition-colors">
                   <div className="flex justify-between text-xs mb-2">
                     <span className="text-slate-400 font-medium">A. Rehman (JazzCash)</span>
                     <span className="text-white font-mono font-bold">14,500</span>
                   </div>
                   <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                     <div className="bg-red-500 h-full w-3/4 rounded-full"></div>
                   </div>
                 </div>
                 <div className="p-4 bg-white/5 border border-white/10 rounded-lg group hover:bg-white/10 transition-colors">
                   <div className="flex justify-between text-xs">
                     <span className="text-slate-400 font-medium">Z. Almas (Bank Transfer)</span>
                     <span className="text-white font-mono font-bold">32,000</span>
                   </div>
                 </div>
              </div>

              <div className="pt-2">
                 <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-3 font-bold">Policy Audit Checks</p>
                 <div className="space-y-2">
                   <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 border border-white/5">
                     <span className="text-[10px] text-slate-300 font-medium font-mono uppercase tracking-widest">Notice Period Signed</span>
                     <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                   </div>
                   <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 border border-white/5">
                     <span className="text-[10px] text-slate-300 font-medium font-mono uppercase tracking-widest">Abandonment Penalty</span>
                     <div className="relative inline-flex items-center cursor-pointer group">
                       <div className="w-8 h-4 bg-slate-700 rounded-full border border-white/10 group-hover:bg-slate-600 transition-colors"></div>
                       <div className="absolute left-1 w-2 h-2 bg-white rounded-full transition-transform"></div>
                     </div>
                   </div>
                 </div>
              </div>
            </div>

            <button className="w-full mt-10 py-4 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs rounded-xl uppercase tracking-[0.2em] shadow-xl shadow-emerald-500/20 transition-all active:scale-[0.98]">
              Process Payout List
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
