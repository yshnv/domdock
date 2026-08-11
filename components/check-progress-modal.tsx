"use client";

import React from "react";
import { Check, Loader2, ShieldCheck } from "lucide-react";

export type CheckProgressModalProps = {
  isOpen: boolean;
  domainName: string;
  currentStep: number;
  error?: string | null;
  onClose?: () => void;
};

const STEPS = [
  "Validating format & security rules...",
  "Performing RDAP lookup & registrar detection...",
  "Resolving DNS & detecting DNS provider...",
  "Inspecting CNAMEs & hosting provider...",
  "Testing TLS/SSL certificate & HTTPS handshake...",
  "Measuring website availability & response latency...",
  "Calculating domain health score & recording change history..."
];

export function CheckProgressModal({
  isOpen,
  domainName,
  currentStep,
  error,
  onClose
}: CheckProgressModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="grid size-10 place-items-center rounded-xl bg-[#3139fb]/10 text-[#3139fb]">
            <ShieldCheck className="size-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-foreground">Monitoring Domain</h3>
            <p className="text-xs font-mono text-muted-foreground">{domainName}</p>
          </div>
        </div>

        {error ? (
          <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-xs text-red-600 dark:text-red-400">
            <p className="font-semibold">Check Failed</p>
            <p className="mt-1">{error}</p>
            <button
              onClick={onClose}
              className="mt-3 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700"
            >
              Close
            </button>
          </div>
        ) : (
          <div className="mt-6 space-y-3">
            {STEPS.map((stepText, idx) => {
              const isDone = currentStep > idx;
              const isCurrent = currentStep === idx;

              return (
                <div key={stepText} className="flex items-center gap-3 text-xs">
                  <div className="grid size-5 place-items-center shrink-0">
                    {isDone ? (
                      <div className="grid size-5 place-items-center rounded-full bg-emerald-500 text-white">
                        <Check className="size-3" />
                      </div>
                    ) : isCurrent ? (
                      <Loader2 className="size-4 animate-spin text-[#3139fb]" />
                    ) : (
                      <div className="size-2 rounded-full bg-muted-foreground/30" />
                    )}
                  </div>
                  <span
                    className={
                      isDone
                        ? "font-medium text-foreground line-through opacity-70"
                        : isCurrent
                        ? "font-semibold text-[#3139fb]"
                        : "text-muted-foreground"
                    }
                  >
                    {stepText}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
