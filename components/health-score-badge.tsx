import React from "react";

export function HealthScoreBadge({ score, size = "md" }: { score: number | null | undefined; size?: "sm" | "md" | "lg" }) {
  if (score === null || score === undefined) {
    return (
      <div className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/50 px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
        Score --
      </div>
    );
  }

  let colorClasses = "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:bg-emerald-500/15 dark:text-emerald-400";
  let label = "Excellent";

  if (score >= 90) {
    colorClasses = "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:bg-emerald-500/15 dark:text-emerald-400";
    label = "Excellent";
  } else if (score >= 75) {
    colorClasses = "bg-blue-500/10 text-blue-600 border-blue-500/20 dark:bg-blue-500/15 dark:text-blue-400";
    label = "Good";
  } else if (score >= 50) {
    colorClasses = "bg-amber-500/10 text-amber-600 border-amber-500/20 dark:bg-amber-500/15 dark:text-amber-400";
    label = "Needs attention";
  } else {
    colorClasses = "bg-red-500/10 text-red-600 border-red-500/20 dark:bg-red-500/15 dark:text-red-400";
    label = "Critical";
  }

  if (size === "sm") {
    return (
      <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-mono text-xs font-semibold ${colorClasses}`}>
        <span className="inline-block size-1.5 rounded-full bg-current" />
        {score}/100
      </span>
    );
  }

  if (size === "lg") {
    return (
      <div className={`flex flex-col items-center justify-center rounded-2xl border p-4 text-center ${colorClasses}`}>
        <div className="font-mono text-4xl font-extrabold tracking-tight">{score}</div>
        <div className="mt-1 text-xs font-semibold uppercase tracking-wider">{label} Health</div>
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${colorClasses}`}>
      <span className="font-mono font-bold">{score}</span>
      <span className="text-[10px] uppercase opacity-80">{label}</span>
    </div>
  );
}
