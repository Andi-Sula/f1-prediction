"use client";
import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";

interface Option {
  value: string;
  label: string;
  icon?: string;
}

interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  placeholder?: string;
  className?: string;
}

export default function CustomSelect({ value, onChange, options, placeholder = "Select...", className = "" }: CustomSelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const selected = options.find(o => o.value === value);

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between bg-[var(--color-background)] border border-[var(--color-border)] rounded-xl px-4 py-3 text-sm text-left cursor-pointer hover:border-[var(--color-text-secondary)] focus:border-[var(--color-primary)] focus:outline-none transition-colors"
      >
        <span className={`flex items-center gap-2 ${selected ? "text-[var(--color-text)]" : "text-[var(--color-text-secondary)]"}`}>
          {selected?.icon && <img src={selected.icon} alt="" className="w-5 h-5 shrink-0" />}
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown size={16} className={`text-[var(--color-text-secondary)] transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute z-50 mt-1.5 w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl shadow-xl shadow-black/20 overflow-hidden">
          <div className="max-h-64 overflow-y-auto py-1">
            {options.map(opt => {
              const active = opt.value === value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => { onChange(opt.value); setOpen(false); }}
                  className={`w-full flex items-center gap-2 px-4 py-2.5 text-sm text-left transition-colors ${
                    active
                      ? "bg-[var(--color-primary)]/10 text-[var(--color-primary)] font-semibold"
                      : "text-[var(--color-text)] hover:bg-[var(--color-border)]/40"
                  }`}
                >
                  {opt.icon && <img src={opt.icon} alt="" className="w-5 h-5 shrink-0" />}
                  <span className="flex-1 truncate">{opt.label}</span>
                  {active && <Check size={14} className="text-[var(--color-primary)] shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
