"use client";
import { useEffect, useState } from "react";
import { Clock } from "lucide-react";

interface QualifyingCountdownProps {
  qualifyingTime: string;
  compact?: boolean;
}

function getTimeLeft(target: string) {
  // Predictions close 5 minutes before qualifying
  const diff = new Date(target).getTime() - 5 * 60 * 1000 - Date.now();
  if (diff <= 0) return null;
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);
  return { days, hours, minutes, seconds };
}

export default function QualifyingCountdown({ qualifyingTime, compact }: QualifyingCountdownProps) {
  const [timeLeft, setTimeLeft] = useState(getTimeLeft(qualifyingTime));

  useEffect(() => {
    const interval = setInterval(() => {
      const left = getTimeLeft(qualifyingTime);
      setTimeLeft(left);
      if (!left) clearInterval(interval);
    }, 1000);
    return () => clearInterval(interval);
  }, [qualifyingTime]);

  if (!timeLeft) return null;

  const pad = (n: number) => String(n).padStart(2, "0");

  if (compact) {
    return (
      <div className="flex items-center gap-1.5 text-[10px] font-extrabold text-[var(--color-primary)] mt-1">
        <Clock size={9} />
        <span className="font-mono">{timeLeft.days}d {pad(timeLeft.hours)}:{pad(timeLeft.minutes)}:{pad(timeLeft.seconds)}</span>
      </div>
    );
  }

  return (
    <div className="bg-[var(--color-surface)] rounded border border-[var(--color-border)] p-5">
      <div className="flex items-center gap-2 mb-3">
        <Clock size={14} className="text-[var(--color-primary)]" />
        <span className="text-[10px] font-extrabold text-[var(--color-text-secondary)] tracking-[0.15em] uppercase">PREDICTIONS CLOSE IN</span>
      </div>
      <div className="flex gap-3">
        {[
          { value: pad(timeLeft.days), label: "DAYS" },
          { value: pad(timeLeft.hours), label: "HRS" },
          { value: pad(timeLeft.minutes), label: "MIN" },
          { value: pad(timeLeft.seconds), label: "SEC" },
        ].map((b) => (
          <div key={b.label} className="text-center">
            <div className="bg-[var(--color-border)]/30 rounded-sm px-4 py-2.5 min-w-[52px]">
              <span className="text-xl font-extrabold font-mono">{b.value}</span>
            </div>
            <div className="text-[9px] font-bold text-[var(--color-text-secondary)] tracking-wider mt-1">{b.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
