"use client";
import { useState } from "react";
import { X } from "lucide-react";
import Image from "next/image";

export default function ScoringRegulations() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] transition-colors underline underline-offset-2"
      >
        Scoring Regulations
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="relative max-w-lg w-full max-h-[90vh] overflow-auto rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setOpen(false)}
              className="absolute top-3 right-3 z-10 p-1.5 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
            >
              <X size={18} />
            </button>
            <Image
              src="/scoring-regulations.png"
              alt="Scoring Regulations"
              width={768}
              height={1024}
              className="w-full h-auto rounded-2xl"
              priority
            />
          </div>
        </div>
      )}
    </>
  );
}
