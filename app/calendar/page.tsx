"use client";

import React, { useState, useEffect } from "react";
import { PageShell } from "@/components/page-shell";
import { Calendar as CalendarIcon, CaretLeft, CaretRight, Plus, X, User, Briefcase, Tag, Note, CheckCircle, Clock, ClipboardText } from "@phosphor-icons/react";
import { cn, formatDate } from "@/lib/utils";

interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  type: 'plan';
  project: string;
  status: string;
  assignee: string;
  sprint: string;
  scope: string;
  notes: string;
  suites: {
    id: number;
    title: string;
    assignee: string;
    status: string;
  }[];
  color: string;
}

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  useEffect(() => {
    fetch("/api/calendar")
      .then(res => res.json())
      .then(data => {
        if (!data.error) setEvents(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthName = currentDate.toLocaleString('default', { month: 'long' });

  const totalDays = daysInMonth(year, month);
  const startDay = firstDayOfMonth(year, month);

  const days = [];
  for (let i = 0; i < startDay; i++) days.push(null);
  for (let i = 1; i <= totalDays; i++) days.push(i);

  const getEventsForDay = (day: number) => {
    if (!day) return [];
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return events.filter(e => {
      const eStart = e.start.split('T')[0];
      const eEnd = e.end.split('T')[0];
      return dateStr >= eStart && dateStr <= eEnd;
    });
  };

  // Monthly stats
  const monthlyEvents = events.filter(e => {
    const d = new Date(e.start);
    return d.getMonth() === month && d.getFullYear() === year;
  });

  const stats = {
    total: monthlyEvents.length,
    active: monthlyEvents.filter(e => e.status.toLowerCase() === 'active').length,
    draft: monthlyEvents.filter(e => e.status.toLowerCase() === 'draft').length,
    closed: monthlyEvents.filter(e => e.status.toLowerCase() === 'closed' || e.status.toLowerCase() === 'completed').length,
  };

  return (
    <PageShell
      title="Shared Calendar"
      eyebrow="Documentation"
      crumbs={[
        { label: "Dashboard", href: "/" },
        { label: "Documentation", href: "/documentation" },
        { label: "Calendar" }
      ]}
      actions={
        <div className="flex items-center gap-2">
           <button 
             onClick={prevMonth}
             className="h-9 w-9 rounded-md border border-slate-200 dark:border-white/10 flex items-center justify-center hover:bg-slate-50 dark:hover:bg-white/5 transition"
           >
             <CaretLeft size={18} />
           </button>
           <div className="px-4 py-2 bg-slate-50 dark:bg-white/5 rounded-md text-sm font-bold min-w-[140px] text-center">
             {monthName} {year}
           </div>
           <button 
             onClick={nextMonth}
             className="h-9 w-9 rounded-md border border-slate-200 dark:border-white/10 flex items-center justify-center hover:bg-slate-50 dark:hover:bg-white/5 transition"
           >
             <CaretRight size={18} />
           </button>
        </div>
      }
    >
      <div className="grid gap-6 lg:grid-cols-4 items-start">
        <div className="lg:col-span-3 glass-card overflow-hidden">
          <div className="grid grid-cols-7 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="py-3 text-center text-[10px] font-black uppercase tracking-widest text-slate-400">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7">
            {days.map((day, idx) => {
              const dayEvents = day ? getEventsForDay(day) : [];
              const isToday = day === new Date().getDate() && month === new Date().getMonth() && year === new Date().getFullYear();

              return (
                <div 
                  key={idx} 
                  className={cn(
                    "min-h-[110px] p-2 border-b border-r border-slate-100 dark:border-white/5 last:border-r-0 transition-colors",
                    !day ? "bg-slate-50/20 dark:bg-black/10" : "hover:bg-slate-50/50 dark:hover:bg-white/2",
                  )}
                >
                  {day && (
                    <>
                      <div className="flex items-center justify-between mb-2">
                        <span className={cn(
                          "text-xs font-black h-6 w-6 flex items-center justify-center rounded-full transition-colors",
                          isToday ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30" : "text-slate-500 dark:text-slate-400"
                        )}>
                          {day}
                        </span>
                        {dayEvents.length > 0 && (
                          <div className="flex -space-x-1">
                            {Array.from(new Set(dayEvents.map(e => e.color))).slice(0, 3).map((color, i) => (
                              <div 
                                key={i} 
                                className="h-1.5 w-1.5 rounded-full border border-white dark:border-slate-900"
                                style={{ backgroundColor: color }}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="space-y-1">
                        {dayEvents.slice(0, 4).map((event) => (
                          <button 
                            key={event.id}
                            onClick={() => setSelectedEvent(event)}
                            className="w-full text-left px-1.5 py-0.5 rounded text-[9px] font-bold truncate transition-all hover:scale-[1.02]"
                            style={{ 
                              backgroundColor: `${event.color}20`, 
                              color: event.color,
                              borderLeft: `2px solid ${event.color}`
                            }}
                          >
                            {event.title}
                          </button>
                        ))}
                        {dayEvents.length > 4 && (
                          <p className="text-[8px] text-slate-400 font-bold pl-1">
                            +{dayEvents.length - 4} more
                          </p>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="space-y-6">
            {/* MONTHLY SUMMARY */}
            <div className="glass-card p-5">
               <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-white mb-6">Monthly Insights</h4>
               <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
                  <div className="p-3 rounded-md bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10">
                     <p className="text-[8px] font-black uppercase text-slate-400">Draft</p>
                     <p className="text-xl font-black text-slate-400 dark:text-slate-500">{stats.draft}</p>
                  </div>
                  <div className="p-3 rounded-md bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/30">
                     <p className="text-[8px] font-black uppercase text-blue-600 dark:text-blue-400">Active</p>
                     <p className="text-xl font-black text-blue-600 dark:text-blue-400">{stats.active}</p>
                  </div>
                  <div className="p-3 rounded-md bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/30">
                     <p className="text-[8px] font-black uppercase text-emerald-600 dark:text-emerald-400">Closed</p>
                     <p className="text-xl font-black text-emerald-600 dark:text-emerald-400">{stats.closed}</p>
                  </div>
               </div>
               <div className="space-y-4">
                  <div className="h-1.5 w-full bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden flex">
                     <div className="h-full bg-slate-400" style={{ width: `${(stats.draft / (stats.total || 1)) * 100}%` }} />
                     <div className="h-full bg-blue-600" style={{ width: `${(stats.active / (stats.total || 1)) * 100}%` }} />
                     <div className="h-full bg-emerald-600" style={{ width: `${(stats.closed / (stats.total || 1)) * 100}%` }} />
                  </div>
                  <p className="text-[9px] text-slate-400 font-medium italic">* Distribution of {stats.total} total plans for {monthName}.</p>
               </div>
            </div>

        </div>
      </div>

      {/* DETAIL MODAL */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-xl bg-white dark:bg-slate-900 p-0 shadow-2xl animate-in zoom-in-95 duration-200 ring-1 ring-slate-200 dark:ring-white/10 overflow-hidden">
            <div className="p-6 border-b border-slate-100 dark:border-white/5 flex items-center justify-between" style={{ backgroundColor: `${selectedEvent.color}05` }}>
               <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-lg flex items-center justify-center text-white shadow-lg" style={{ backgroundColor: selectedEvent.color }}>
                     <ClipboardText size={24} weight="bold" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900 dark:text-white line-clamp-1">{selectedEvent.title}</h3>
                    <div className="flex items-center gap-2">
                       <span className={cn(
                         "text-[9px] font-black uppercase px-2 py-0.5 rounded bg-white dark:bg-slate-800 border",
                         selectedEvent.status.toLowerCase() === 'active' ? "text-blue-500 border-blue-100" :
                         selectedEvent.status.toLowerCase() === 'draft' ? "text-slate-500 border-slate-100" :
                         "text-emerald-500 border-emerald-100"
                       )}>
                         {selectedEvent.status}
                       </span>
                       <span className="text-[10px] font-bold text-slate-400">{selectedEvent.project}</span>
                    </div>
                  </div>
               </div>
               <button onClick={() => setSelectedEvent(null)} className="h-8 w-8 rounded-full flex items-center justify-center hover:bg-slate-100 dark:hover:bg-white/5 transition">
                  <X size={18} />
               </button>
            </div>

            <div className="p-6 space-y-6">
               <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                     <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                        <User size={10} /> Assignee
                     </p>
                     <p className="text-sm font-bold text-slate-700 dark:text-slate-300">{selectedEvent.assignee || 'Unassigned'}</p>
                  </div>
                  <div className="space-y-1">
                     <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                        <Briefcase size={10} /> Sprint
                     </p>
                     <p className="text-sm font-bold text-slate-700 dark:text-slate-300">{selectedEvent.sprint || 'N/A'}</p>
                  </div>
                  <div className="space-y-1">
                     <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                        <Clock size={10} /> Timeline
                     </p>
                     <p className="text-sm font-bold text-slate-700 dark:text-slate-300">{formatDate(selectedEvent.start)} to {formatDate(selectedEvent.end)}</p>
                  </div>
                  <div className="space-y-1">
                     <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                        <Tag size={10} /> Scope
                     </p>
                     <p className="text-sm font-bold text-slate-700 dark:text-slate-300">{selectedEvent.scope || 'General'}</p>
                  </div>
               </div>

               <div className="space-y-2">
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                     <Note size={10} /> Planning Notes
                  </p>
                  <div className="p-4 rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 text-xs text-slate-600 dark:text-slate-400 leading-relaxed italic">
                     {selectedEvent.notes || 'No specific notes for this plan.'}
                  </div>
               </div>

               {selectedEvent.suites && selectedEvent.suites.length > 0 && (
                 <div className="space-y-3">
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                       <CheckCircle size={10} /> Linked Test Suites ({selectedEvent.suites.length})
                    </p>
                    <div className="grid gap-2">
                       {selectedEvent.suites.map(suite => (
                         <div key={suite.id} className="p-3 rounded-lg border border-slate-100 dark:border-white/5 bg-slate-50/30 dark:bg-white/2 flex items-center justify-between group">
                            <div className="flex-1 min-w-0 pr-4">
                               <p className="text-[11px] font-bold text-slate-700 dark:text-slate-200 truncate">{suite.title}</p>
                               <p className="text-[9px] font-medium text-slate-400 flex items-center gap-1 mt-0.5">
                                  <User size={8} /> {suite.assignee || 'Unassigned'}
                               </p>
                            </div>
                            <span className={cn(
                              "text-[8px] font-black uppercase px-1.5 py-0.5 rounded border",
                              suite.status.toLowerCase() === 'active' ? "text-blue-500 border-blue-100 bg-blue-50/50" :
                              suite.status.toLowerCase() === 'draft' ? "text-slate-500 border-slate-100 bg-slate-50/50" :
                              "text-emerald-500 border-emerald-100 bg-emerald-50/50"
                            )}>
                               {suite.status}
                            </span>
                         </div>
                       ))}
                    </div>
                 </div>
               )}
            </div>

            <div className="p-4 bg-slate-50 dark:bg-white/2 flex justify-end gap-3">
               <button 
                 onClick={() => setSelectedEvent(null)}
                 className="px-6 h-10 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/5 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 transition"
               >
                 Close
               </button>
            </div>
          </div>
        </div>
      )}
    </PageShell>
  );
}
