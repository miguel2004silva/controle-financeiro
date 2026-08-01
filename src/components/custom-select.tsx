'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronsUpDown, Search, Check, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface SelectOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
  color?: string;
}

interface CustomSelectProps {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  leftIcon?: React.ReactNode;
  className?: string;
  disabled?: boolean;
}

export const CustomSelect: React.FC<CustomSelectProps> = ({
  options,
  value,
  onChange,
  placeholder = 'Selecione uma opção',
  searchPlaceholder = 'PESQUISAR OPÇÃO',
  leftIcon,
  className = '',
  disabled = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  const filteredOptions = options.filter((opt) =>
    opt.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      
      {/* Trigger Box (Custom Select Button) */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          if (!disabled) {
            setIsOpen(!isOpen);
            setSearchTerm('');
          }
        }}
        className={`w-full bg-[#FAF6ED] dark:bg-card border border-border/30 hover:border-[#2D7D46]/50 rounded-2xl px-4 py-3 text-xs font-bold text-foreground flex items-center justify-between shadow-xs transition-all outline-none ${
          isOpen ? 'border-[#2D7D46] ring-2 ring-[#2D7D46]/10' : ''
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <div className="flex items-center gap-2.5 truncate">
          {leftIcon || (selectedOption?.icon && (
            <span className="shrink-0 text-muted-foreground">{selectedOption.icon}</span>
          ))}
          <span className={`truncate ${selectedOption ? 'text-foreground font-extrabold' : 'text-muted-foreground/70'}`}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </div>

        <ChevronsUpDown size={16} className="shrink-0 text-muted-foreground/70 ml-2" />
      </button>

      {/* Popover Menu Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 4, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 right-0 top-full z-50 bg-[#FAF6ED] dark:bg-card border border-border/25 rounded-3xl p-2.5 shadow-2xl space-y-2 max-h-72 flex flex-col overflow-hidden"
          >
            {/* Search Input inside Dropdown */}
            {options.length > 3 && (
              <div className="px-3 py-2 bg-white/90 dark:bg-muted/40 border border-border/20 rounded-2xl flex items-center gap-2 shadow-inner shrink-0">
                <Search size={14} className="text-muted-foreground shrink-0" />
                <input
                  type="text"
                  placeholder={searchPlaceholder}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-transparent text-xs font-bold text-foreground placeholder:text-[10px] placeholder:font-bold placeholder:uppercase placeholder:text-muted-foreground/60 outline-none uppercase"
                  autoFocus
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm('')}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>
            )}

            {/* Options List */}
            <div className="overflow-y-auto max-h-48 space-y-1 pr-0.5">
              {filteredOptions.length > 0 ? (
                filteredOptions.map((opt) => {
                  const isSelected = opt.value === value;
                  return (
                    <div
                      key={opt.value}
                      onClick={() => {
                        onChange(opt.value);
                        setIsOpen(false);
                      }}
                      className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center justify-between cursor-pointer select-none ${
                        isSelected
                          ? 'bg-[#F7E5D8] text-[#D95D39] dark:bg-emerald-950/80 dark:text-emerald-300 font-extrabold shadow-xs'
                          : 'text-zinc-700 dark:text-zinc-300 hover:bg-[#F3EBD8] dark:hover:bg-zinc-800/60 hover:text-zinc-900'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        {opt.icon && <span className="shrink-0">{opt.icon}</span>}
                        <span className="truncate">{opt.label}</span>
                      </div>
                      {isSelected && <Check size={14} className="shrink-0 text-[#D95D39] dark:text-emerald-400" />}
                    </div>
                  );
                })
              ) : (
                <div className="p-4 text-center text-xs text-muted-foreground font-medium">
                  Nenhuma opção encontrada
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
