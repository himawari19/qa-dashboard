"use client";

import { useState, useRef, useEffect } from "react";
import { CaretLeft, CaretRight, CalendarBlank } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

// If date-fns is not installed, we can fall back to vanilla JS. Let's make it pure vanilla just to be safe as npm install failed.

export function ModernDatePicker({
  name,
  value,
  onChange,
  required
}: {
  name: string;
  value?: string;
  onChange?: (date: string) => void;
  required?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  // Start with a dummy date, but it won't be rendered due to the !mounted check below
  const [currentDate, setCurrentDate] = useState(new Date()); 
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    
    // Sync with value or set to now only on client side
    if (value) {
      const d = new Date(value);
      setCurrentDate(d);
      setSelectedDate(d);
    } else {
      setCurrentDate(new Date());
    }

    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [value]);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    
    const days = [];
    // Add empty slots for days before the 1st
    for (let i = 0; i < firstDayOfMonth; i++) {
        days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
        days.push(new Date(year, month, i));
    }
    return days;
  };

  const days = getDaysInMonth(currentDate);
  const weekDays = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

  const handleSelect = (date: Date) => {
    setSelectedDate(date);
    setIsOpen(false);
    
    // Format YYYY-MM-DD
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    if (onChange) onChange(`${yyyy}-${mm}-${dd}`);
  };

  if (!mounted) {
    return (
      <div className="h-12 w-full animate-pulse rounded-md border border-slate-200 bg-slate-100 dark:bg-slate-800" />
    );
  }

  return (
    <div className="relative w-full" ref={popoverRef}>
      {/* Hidden native input so forms continue to work without changing module-workspace logic significantly */}
      <input type="hidden" name={name} value={selectedDate ? selectedDate.toISOString().split('T')[0] : ""} />
      
      <div className="group relative flex h-12 w-full items-center rounded-md border border-slate-200 bg-slate-50 transition focus-within:border-blue-300 focus-within:bg-white hover:bg-white">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "flex h-full flex-grow items-center px-4 text-sm outline-none",
            !selectedDate ? "text-slate-400" : "text-slate-800"
          )}
        >
          <span>
            {selectedDate 
              ? selectedDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
              : "Select a date..."}
          </span>
        </button>

        <div className="flex h-full items-center gap-1 pr-2">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleSelect(new Date());
            }}
            className="flex h-8 items-center rounded bg-blue-100 px-2 text-[10px] font-black uppercase tracking-wider text-blue-700 transition hover:bg-blue-200"
          >
            Now
          </button>
          <button 
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="flex h-8 w-8 items-center justify-center text-slate-500 hover:text-blue-600"
          >
            <CalendarBlank size={18} />
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="absolute left-0 top-14 z-50 w-72 rounded-md border border-slate-200 bg-white p-4 shadow-xl animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))}
              className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-slate-100 text-slate-600 transition"
            >
              <CaretLeft size={16} weight="bold" />
            </button>
            <div className="text-sm font-semibold text-slate-800">
              {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </div>
            <button
              type="button"
              onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))}
              className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-slate-100 text-slate-600 transition"
            >
              <CaretRight size={16} weight="bold" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center mb-2">
            {weekDays.map(day => (
              <div key={day} className="text-[11px] font-bold uppercase text-slate-400">{day}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {days.map((day, idx) => {
              if (!day) return <div key={`empty-${idx}`} className="h-8" />;
              
              const isSelected = selectedDate && 
                day.getDate() === selectedDate.getDate() && 
                day.getMonth() === selectedDate.getMonth() && 
                day.getFullYear() === selectedDate.getFullYear();
                
              const isToday = new Date().toDateString() === day.toDateString();

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelect(day)}
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-md text-sm transition-all hover:bg-blue-100",
                    isSelected ? "bg-blue-600 text-white font-semibold shadow-md hover:bg-blue-700" : "text-slate-700",
                    isToday && !isSelected && "text-blue-600 font-bold bg-blue-50"
                  )}
                >
                  {day.getDate()}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
