import React, { useState, useEffect } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon,
  Clock,
  User,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { cn, formatPKR } from '../lib/utils';
import { shiftService } from '../services/shiftService';

export default function CalendarView() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [shifts, setShifts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  useEffect(() => {
    async function loadShifts() {
      setLoading(true);
      try {
        const data = await shiftService.getShiftsByMonth(year, month);
        setShifts(data);
      } catch (error) {
        console.error('Error fetching shifts:', error);
      } finally {
        setLoading(false);
      }
    }
    loadShifts();
  }, [year, month]);

  const daysInMonth = (y: number, m: number) => new Date(y, m + 1, 0).getDate();
  const firstDayOfMonth = (y: number, m: number) => new Date(y, m, 1).getDay();

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const totalDays = daysInMonth(year, month);
  const startOffset = firstDayOfMonth(year, month);

  const days = [];
  for (let i = 0; i < startOffset; i++) {
    days.push(null);
  }
  for (let i = 1; i <= totalDays; i++) {
    days.push(new Date(year, month, i));
  }

  const getDayShifts = (date: Date) => {
    const dStr = date.toISOString().split('T')[0];
    return shifts.filter(s => s.shift_date === dStr);
  };

  const selectedDayShifts = selectedDate ? getDayShifts(selectedDate) : [];

  return (
    <div className="space-y-6 h-full flex flex-col">
       <div className="flex justify-between items-center bg-slate-900/40 border border-white/5 p-6 rounded-xl shadow-2xl">
          <div>
            <h2 className="text-xl font-black text-white uppercase tracking-tighter flex items-center gap-2">
              <CalendarIcon className="text-blue-500" /> Attendance Management
            </h2>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black mt-1">Operational Shift Ledger • {monthNames[month]} {year}</p>
          </div>
          
          <div className="flex items-center gap-4">
             <button onClick={prevMonth} className="p-2 hover:bg-white/5 rounded-lg border border-white/5 transition-colors">
               <ChevronLeft size={20} className="text-slate-400" />
             </button>
             <h3 className="text-sm font-mono font-bold text-white uppercase tracking-widest w-32 text-center">
               {monthNames[month]}
             </h3>
             <button onClick={nextMonth} className="p-2 hover:bg-white/5 rounded-lg border border-white/5 transition-colors">
               <ChevronRight size={20} className="text-slate-400" />
             </button>
          </div>
       </div>

       <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 flex-1 overflow-hidden">
          <div className="lg:col-span-3 bg-slate-900/40 border border-white/5 rounded-xl p-6 shadow-2xl flex flex-col h-full overflow-hidden">
             <div className="grid grid-cols-7 mb-4">
               {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                 <div key={d} className="text-[10px] text-center font-black uppercase tracking-widest text-slate-500 py-2 border-b border-white/5">{d}</div>
               ))}
             </div>
             
             <div className="grid grid-cols-7 flex-1 overflow-auto scrollbar-none relative">
                {loading && (
                  <div className="absolute inset-0 bg-slate-950/20 backdrop-blur-sm z-10 flex items-center justify-center">
                    <Loader2 className="text-blue-500 animate-spin" size={32} />
                  </div>
                )}
                {days.map((date, i) => {
                  if (!date) return <div key={i} className="aspect-square border border-white/5 opacity-10"></div>;
                  
                  const dayShifts = getDayShifts(date);
                  const isSelected = selectedDate?.toDateString() === date.toDateString();
                  const isToday = new Date().toDateString() === date.toDateString();

                  return (
                    <div 
                      key={i} 
                      onClick={() => setSelectedDate(date)}
                      className={cn(
                        "aspect-square border border-white/5 p-2 cursor-pointer transition-all hover:bg-white/5 flex flex-col items-start gap-1",
                        isSelected ? "bg-blue-500/10 border-blue-500/30" : "",
                        isToday ? "relative before:absolute before:top-2 before:right-2 before:w-1.5 before:h-1.5 before:bg-blue-500 before:rounded-full" : ""
                      )}
                    >
                      <span className={cn(
                        "text-[10px] font-mono font-bold",
                        isSelected ? "text-blue-400" : "text-slate-500"
                      )}>{date.getDate()}</span>
                      
                      <div className="flex flex-col gap-1 w-full overflow-hidden">
                         {dayShifts.map((s, idx) => (
                           <div 
                             key={idx}
                             title={`${s.staff?.full_name} - ${s.shift_type}`}
                             className={cn(
                               "h-1.5 rounded-full w-full",
                               s.is_completed ? "bg-emerald-500/40" : 
                               s.is_abandoned ? "bg-red-500/40" : "bg-slate-500/40"
                             )}
                           />
                         ))}
                      </div>
                    </div>
                  );
                })}
             </div>
          </div>

          <div className="flex flex-col gap-4 overflow-hidden">
             <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 px-2 flex items-center gap-2">
               <Clock size={14} className="text-emerald-400" /> Shift Details
             </h3>
             <div className="flex-1 overflow-auto space-y-4 pr-1 scrollbar-none">
                {!selectedDate ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-8 border border-dashed border-white/5 rounded-xl opacity-40">
                     <CalendarIcon size={32} className="text-slate-700 mb-4" />
                     <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Pick a date to audit shifts</p>
                  </div>
                ) : (
                  <>
                    <h4 className="text-[10px] text-white font-mono font-bold uppercase tracking-widest px-2 mb-4">
                      {selectedDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </h4>
                    
                    {selectedDayShifts.length === 0 ? (
                      <div className="p-8 text-center border border-dashed border-white/5 rounded-xl opacity-40">
                        <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest leading-relaxed">No shifts logged for<br/>this date.</p>
                      </div>
                    ) : selectedDayShifts.map((s: any) => (
                      <div key={s.id} className="bg-slate-900/40 border border-white/5 rounded-xl p-4 space-y-4 group hover:border-white/10 transition-colors">
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-3">
                             <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center border border-white/5">
                               <User size={14} className="text-emerald-400" />
                             </div>
                             <div>
                               <p className="text-xs font-bold text-white uppercase tracking-tight">{s.employee?.full_name}</p>
                               <p className="text-[9px] text-slate-500 uppercase font-bold tracking-widest">Shift: {s.shift_type} (12h)</p>
                             </div>
                          </div>
                          <div className={cn(
                            "px-2 py-0.5 rounded border text-[8px] font-black uppercase tracking-widest",
                            s.attendance_status === 'Completed' ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" :
                            s.attendance_status === 'Abandoned' ? "bg-red-500/10 border-red-500/20 text-red-400" :
                            "bg-slate-500/10 border-slate-500/20 text-slate-400"
                          )}>
                            {s.attendance_status}
                          </div>
                        </div>
                        
                        <div className="pt-2 border-t border-white/5 flex justify-between items-center">
                           <div className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Rate (PKR)</div>
                           <div className="text-xs font-mono font-bold text-emerald-400">
                             {s.decided_rate_pkr.toLocaleString()}
                             {s.penalty_applied && <span className="ml-2 text-red-500 text-[10px]">(Penalty Applied)</span>}
                           </div>
                        </div>

                        {s.attendance_status === 'Scheduled' && (
                          <div className="pt-4 grid grid-cols-2 gap-2">
                            <button 
                              onClick={async () => {
                                await shiftService.updateShiftStatus(s.id, 'Completed');
                                const data = await shiftService.getShiftsByMonth(year, month);
                                setShifts(data);
                              }}
                              className="py-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-emerald-500/20 transition-all flex items-center justify-center gap-1"
                            >
                              <CheckCircle2 size={12} /> Complete
                            </button>
                            <button 
                              onClick={async () => {
                                if (confirm("Mark shift as abandoned? This will apply a penalty (withholding one day's pay) as per policy.")) {
                                  await shiftService.updateShiftStatus(s.id, 'Abandoned', true);
                                  const data = await shiftService.getShiftsByMonth(year, month);
                                  setShifts(data);
                                }
                              }}
                              className="py-2 bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-red-500/20 transition-all flex items-center justify-center gap-1"
                            >
                              <XCircle size={12} /> Abandoned
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                    
                    <button className="w-full mt-4 py-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-black text-xs rounded-xl uppercase tracking-[0.2em] hover:bg-emerald-500/20 transition-all">
                       Log New Manual Override
                    </button>
                  </>
                )}
             </div>
          </div>
       </div>
    </div>
  );
}
