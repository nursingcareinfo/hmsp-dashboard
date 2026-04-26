/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  UserPlus, 
  ClipboardList, 
  Wallet, 
  MessageSquare,
  Settings,
  LogOut,
  ChevronRight,
  Menu,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';
import { supabase } from './lib/supabase';

type View = 'dashboard' | 'staff' | 'patients' | 'matchmaker' | 'finance' | 'ocr' | 'attendance';

import StaffView from './components/StaffView';
import OCRView from './components/OCRView';
import PatientView from './components/PatientView';
import MatchmakerView from './components/MatchmakerView';
import LedgerView from './components/LedgerView';
import DashboardView from './components/DashboardView';
import CalendarView from './components/CalendarView';
import FinanceView from './components/FinanceView';

export default function App() {
  const [activeView, setActiveView] = useState<View>('dashboard');
  const [isSidebarOpen, setSidebarOpen] = useState(true);

  const menuItems = [
    { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
    { id: 'staff', label: 'Staff Tool', icon: Users },
    { id: 'ocr', label: 'Registrar', icon: UserPlus },
    { id: 'patients', label: 'Patients', icon: ClipboardList },
    { id: 'attendance', label: 'Calendar', icon: ClipboardList },
    { id: 'finance', label: 'Payouts', icon: Wallet },
  ];

  const [mtdMargin, setMtdMargin] = useState<number>(0);

  useEffect(() => {
    async function loadMtdMargin() {
      try {
        const { data } = await supabase.from('real_time_margin_view').select('daily_margin');
        if (data) {
          const total = data.reduce((acc: number, curr: any) => acc + Number(curr.daily_margin), 0);
          setMtdMargin(total * 30); // Project MTD based on current daily run rate
        }
      } catch (error) {
        console.error('Error fetching MTD margin:', error);
      }
    }
    loadMtdMargin();
    // Refresh every 5 mins
    const interval = setInterval(loadMtdMargin, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex h-screen bg-[var(--color-bg)] text-[var(--color-ink)] overflow-hidden font-sans">
      {/* Sidebar - Desktop Only */}
      <motion.aside
        initial={false}
        animate={{ width: isSidebarOpen ? 260 : 80 }}
        className="bg-black border-r border-white/10 hidden md:flex flex-col overflow-hidden z-20"
      >
        <div className="p-6 flex items-center justify-between mb-8">
          {isSidebarOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="font-black text-xl tracking-tighter text-white"
            >
              HMSP <span className="text-emerald-500">HQ</span>
            </motion.div>
          )}
          <button 
            onClick={() => setSidebarOpen(!isSidebarOpen)}
            className="p-2 hover:bg-white/5 rounded-lg transition-colors text-slate-500"
          >
            {isSidebarOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>

        <nav className="flex-1 px-3 space-y-1">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id as View)}
              className={cn(
                "w-full flex items-center gap-3 p-3 rounded-lg transition-all duration-200 group uppercase tracking-[0.15em] text-[10px] font-black",
                activeView === item.id 
                  ? "bg-white/10 text-white border border-white/10" 
                  : "hover:bg-white/5 text-slate-500 hover:text-slate-300"
              )}
            >
              <item.icon size={16} className={cn(
                "shrink-0",
                activeView === item.id ? "text-emerald-400" : "group-hover:text-emerald-500/50"
              )} />
              {isSidebarOpen && (
                <span className="truncate">{item.label}</span>
              )}
            </button>
          ))}
        </nav>

        <div className="p-4 mt-auto border-t border-white/5">
          <button className="w-full flex items-center gap-3 p-3 text-slate-600 hover:text-red-400 transition-colors uppercase text-[9px] font-black tracking-[0.2em] px-6">
            <LogOut size={14} />
            {isSidebarOpen && <span>Secure Logout</span>}
          </button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 relative overflow-auto pb-24 md:pb-8 p-4 md:p-8">
        <header className="mb-8 flex flex-col md:flex-row md:justify-between md:items-center border-b border-white/10 pb-6 gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-black tracking-tighter text-white">
              HMSP <span className="text-emerald-500 uppercase">High-Performance</span> Ledger
            </h1>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-1 font-bold">
              Manual Management • Karachi HQ • Karachi-S1
            </p>
          </div>
          
          <div className="flex gap-4 md:gap-8 items-center justify-between md:justify-end">
            <div className="text-right">
              <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black mb-1">Estimated MTD Margin</p>
              <p className="text-xl md:text-2xl font-mono text-emerald-400 font-bold tracking-tighter">
                PKR {mtdMargin.toLocaleString()}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_10px_rgba(52,211,153,0.8)]"></div>
              </div>
            </div>
          </div>
        </header>

        <div className="mb-8 flex justify-between items-center">
          <div>
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
              {activeView.replace('-', ' ')}
            </h2>
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeView}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="h-full"
          >
            {activeView === 'dashboard' && <DashboardView />}
            {activeView === 'staff' && <StaffView />}
            {activeView === 'ocr' && <OCRView />}
            {activeView === 'patients' && <PatientView />}
            {activeView === 'matchmaker' && <MatchmakerView />}
            {activeView === 'attendance' && <CalendarView />}
            {activeView === 'finance' && <FinanceView />}
            
            {activeView === 'whatsapp' && (
              <div className="glass-card p-12 text-center opacity-50">
                <MessageSquare size={48} className="mx-auto mb-4" />
                <h2 className="text-xl font-medium">WhatsApp Analytics</h2>
                <p>Broadcast engagement and contact label tracking coming in Phase 2.</p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Mobile Bottom Navigation */}
        <div className="fixed bottom-0 left-0 right-0 h-20 bg-black/80 backdrop-blur-xl border-t border-white/10 flex items-center justify-around px-2 z-50 md:hidden pb-safe">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id as View)}
              className={cn(
                "flex flex-col items-center gap-1 p-2 transition-all",
                activeView === item.id ? "text-emerald-400" : "text-slate-500"
              )}
            >
              <item.icon size={20} />
              <span className="text-[8px] font-black uppercase tracking-widest">{item.label}</span>
            </button>
          ))}
        </div>
      </main>
    </div>
  );
}

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

