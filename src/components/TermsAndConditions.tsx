"use client";
import { useState } from "react";
import { X } from "lucide-react";

export default function TermsAndConditions() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] transition-colors underline underline-offset-2"
      >
        Terms & Conditions
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="relative w-full max-w-3xl h-[90vh] rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-2xl flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-[var(--color-border)]">
              <h2 className="text-sm font-bold text-[var(--color-text)]">Terms and Conditions</h2>
              <button
                onClick={() => setOpen(false)}
                className="p-1.5 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            <iframe
              src="/terms-and-conditions.pdf"
              className="flex-1 w-full"
              title="Terms and Conditions"
            />
          </div>
        </div>
      )}
    </>
  );
}
