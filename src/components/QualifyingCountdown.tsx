"use client";
import { useEffect, useState } from "react";
import { Clock } from "lucide-react";

interface QualifyingCountdownProps {
  qualifyingTime: string;
  compact?: boolean;
}

function getTimeLeft(target: string) {
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
      <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1.5 shadow-sm">
        <Clock size={12} className="text-amber-500" />
        <span className="text-[11px] font-bold text-amber-600">Predictions close in</span>
        <span className="font-mono text-[11px] font-extrabold text-[var(--color-text)]">
          {timeLeft.days}d {pad(timeLeft.hours)}:{pad(timeLeft.minutes)}:{pad(timeLeft.seconds)}
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3">
      <Clock size={16} className="text-amber-500 shrink-0" />
      <div className="flex-1">
        <div className="text-xs font-bold text-amber-500 mb-1">Predictions close in</div>
        <div className="flex gap-2 font-mono text-sm font-extrabold text-[var(--color-text)]">
          <span className="bg-[var(--color-background)] px-2 py-1 rounded-lg">{timeLeft.days}<span className="text-[10px] text-[var(--color-text-secondary)] ml-0.5">d</span></span>
          <span className="bg-[var(--color-background)] px-2 py-1 rounded-lg">{pad(timeLeft.hours)}<span className="text-[10px] text-[var(--color-text-secondary)] ml-0.5">h</span></span>
          <span className="bg-[var(--color-background)] px-2 py-1 rounded-lg">{pad(timeLeft.minutes)}<span className="text-[10px] text-[var(--color-text-secondary)] ml-0.5">m</span></span>
          <span className="bg-[var(--color-background)] px-2 py-1 rounded-lg">{pad(timeLeft.seconds)}<span className="text-[10px] text-[var(--color-text-secondary)] ml-0.5">s</span></span>
        </div>
      </div>
    </div>
  );
}
