'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface DatePickerProps {
  value?: string; // YYYY-MM-DD or ISO string
  onChange: (isoValue: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

const MONTH_NAMES_PT = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const WEEKDAYS_PT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export const DatePicker: React.FC<DatePickerProps> = ({
  value = '',
  onChange,
  placeholder = 'DD/MM/AAAA',
  className = '',
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Helper to extract YYYY, MM (1-indexed), DD from ISO string (YYYY-MM-DD)
  const parseISO = (isoStr: string) => {
    if (!isoStr) return null;
    const clean = isoStr.split('T')[0];
    const parts = clean.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10);
      const day = parseInt(parts[2], 10);
      if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
        return { year, month, day };
      }
    }
    return null;
  };

  // Convert ISO string (YYYY-MM-DD) -> Display string (DD/MM/AAAA)
  const formatDisplay = (isoStr: string) => {
    const parsed = parseISO(isoStr);
    if (!parsed) return '';
    const d = String(parsed.day).padStart(2, '0');
    const m = String(parsed.month).padStart(2, '0');
    return `${d}/${m}/${parsed.year}`;
  };

  // Input raw display value (e.g. "05/08/2026")
  const [displayText, setDisplayText] = useState(() => formatDisplay(value));

  // Calendar view states
  const today = new Date();
  const parsedVal = parseISO(value);
  const [viewYear, setViewYear] = useState(() => parsedVal?.year || today.getFullYear());
  const [viewMonth, setViewMonth] = useState(() => (parsedVal ? parsedVal.month - 1 : today.getMonth()));

  // Sync internal display text when prop value changes
  useEffect(() => {
    setDisplayText(formatDisplay(value));
    const p = parseISO(value);
    if (p) {
      setViewYear(p.year);
      setViewMonth(p.month - 1);
    }
  }, [value]);

  // Click outside to close calendar popover
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle typing inside text input with DD/MM/AAAA mask
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '');
    let masked = '';

    if (raw.length > 0) {
      masked += raw.slice(0, 2);
    }
    if (raw.length >= 3) {
      masked += '/' + raw.slice(2, 4);
    }
    if (raw.length >= 5) {
      masked += '/' + raw.slice(4, 8);
    }

    setDisplayText(masked);

    // If fully typed (8 digits), emit YYYY-MM-DD
    if (raw.length === 8) {
      const day = parseInt(raw.slice(0, 2), 10);
      const month = parseInt(raw.slice(2, 4), 10);
      const year = parseInt(raw.slice(4, 8), 10);

      // Simple validation
      if (month >= 1 && month <= 12 && day >= 1 && day <= 31 && year >= 1900 && year <= 2100) {
        const iso = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        onChange(iso);
        setViewYear(year);
        setViewMonth(month - 1);
      }
    } else if (raw.length === 0) {
      onChange('');
    }
  };

  // Select day from calendar grid
  const handleSelectDay = (dayNum: number) => {
    const m = viewMonth + 1;
    const iso = `${viewYear}-${String(m).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
    onChange(iso);
    setDisplayText(formatDisplay(iso));
    setIsOpen(false);
  };

  // Calendar month navigation
  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(prev => prev - 1);
    } else {
      setViewMonth(prev => prev - 1);
    }
  };

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(prev => prev + 1);
    } else {
      setViewMonth(prev => prev + 1);
    }
  };

  const selectToday = () => {
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth() + 1;
    const d = now.getDate();
    const iso = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    onChange(iso);
    setDisplayText(formatDisplay(iso));
    setViewYear(y);
    setViewMonth(m - 1);
    setIsOpen(false);
  };

  // Build calendar matrix
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay(); // 0 = Sunday

  const calendarDays: (number | null)[] = [];
  for (let i = 0; i < firstDayOfWeek; i++) {
    calendarDays.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    calendarDays.push(d);
  }

  const selectedIso = parseISO(value);

  return (
    <div className="relative inline-block w-full" ref={containerRef}>
      {/* Input Field with Calendar Trigger Icon */}
      <div className="relative flex items-center">
        <input
          type="text"
          value={displayText}
          onChange={handleInputChange}
          placeholder={placeholder}
          disabled={disabled}
          maxLength={10}
          className={`w-full shadcn-input pr-10 text-xs font-medium tracking-wide ${className}`}
        />
        <button
          type="button"
          disabled={disabled}
          onClick={() => setIsOpen(!isOpen)}
          className="absolute right-2 p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
          title="Abrir Calendário (Dia/Mês/Ano)"
        >
          <CalendarIcon size={15} />
        </button>
      </div>

      {/* Calendar Popover */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.98 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="absolute z-50 mt-1.5 left-0 w-72 bg-card border border-border/30 rounded-2xl shadow-2xl p-4 glass-panel text-foreground select-none"
          >
            {/* Header: Month and Year Nav */}
            <div className="flex items-center justify-between pb-3 mb-2 border-b border-border/15">
              <button
                type="button"
                onClick={prevMonth}
                className="p-1.5 rounded-xl border border-border/20 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                title="Mês Anterior"
              >
                <ChevronLeft size={16} />
              </button>

              <span className="text-xs font-extrabold text-foreground capitalize tracking-tight">
                {MONTH_NAMES_PT[viewMonth]} {viewYear}
              </span>

              <button
                type="button"
                onClick={nextMonth}
                className="p-1.5 rounded-xl border border-border/20 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                title="Próximo Mês"
              >
                <ChevronRight size={16} />
              </button>
            </div>

            {/* Weekdays header */}
            <div className="grid grid-cols-7 gap-1 text-center mb-2">
              {WEEKDAYS_PT.map((wd) => (
                <span key={wd} className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider">
                  {wd}
                </span>
              ))}
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-1 text-center">
              {calendarDays.map((day, idx) => {
                if (day === null) {
                  return <div key={`empty-${idx}`} className="h-8" />;
                }

                const isSelected =
                  selectedIso &&
                  selectedIso.year === viewYear &&
                  selectedIso.month === viewMonth + 1 &&
                  selectedIso.day === day;

                const isToday =
                  today.getFullYear() === viewYear &&
                  today.getMonth() === viewMonth &&
                  today.getDate() === day;

                return (
                  <button
                    key={`day-${day}`}
                    type="button"
                    onClick={() => handleSelectDay(day)}
                    className={`h-8 rounded-xl text-xs font-bold transition-all flex items-center justify-center ${
                      isSelected
                        ? 'bg-foreground text-background font-extrabold shadow-sm scale-105'
                        : isToday
                        ? 'border border-primary text-primary font-bold hover:bg-primary/10'
                        : 'text-foreground/90 hover:bg-muted/80 hover:text-foreground'
                    }`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>

            {/* Footer Quick Actions */}
            <div className="flex items-center justify-between pt-3 mt-3 border-t border-border/15">
              <button
                type="button"
                onClick={selectToday}
                className="text-[10px] font-extrabold text-primary hover:underline uppercase tracking-wider"
              >
                Hoje
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-[10px] font-extrabold text-muted-foreground hover:text-foreground uppercase tracking-wider"
              >
                Fechar
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
