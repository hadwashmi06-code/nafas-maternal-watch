import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function Sparkline({ data, className }: { data: number[]; className?: string }) {
  const pts = data.slice(-60);
  if (pts.length < 2) return <div className="h-7" />;
  const min = Math.min(...pts);
  const max = Math.max(...pts);
  const span = Math.max(1, max - min);
  const d = pts
    .map((v, i) => `${((i / (pts.length - 1)) * 100).toFixed(2)},${(26 - ((v - min) / span) * 22).toFixed(2)}`)
    .join(" ");
  return (
    <svg viewBox="0 0 100 28" preserveAspectRatio="none" className={cn("h-7 w-full", className)} aria-hidden>
      <polyline points={d} fill="none" stroke="currentColor" strokeWidth="1.25" vectorEffect="non-scaling-stroke" opacity="0.8" />
    </svg>
  );
}

export function FlagTag({ level }: { level: "review" | "urgent" }) {
  return (
    <span
      className={cn(
        "rounded-sm px-1.5 py-px text-[10px] font-semibold uppercase tracking-wider",
        level === "urgent" ? "bg-status-urgent text-status-urgent-foreground" : "bg-status-review text-status-review-foreground",
      )}
    >
      {level === "urgent" ? "Urgent" : "Review"}
    </span>
  );
}

interface VitalTileProps {
  label: string;
  unit: string;
  source: string;
  flag: "review" | "urgent" | null;
  valueClassName: string;
  value: ReactNode;
  meta?: ReactNode;
  history?: number[];
  limits: string;
  children?: ReactNode;
  className?: string;
}

export function VitalTile({ label, unit, source, flag, valueClassName, value, meta, history, limits, children, className }: VitalTileProps) {
  return (
    <section
      className={cn(
        "flex min-w-0 flex-col rounded-md border bg-card p-3 transition-colors",
        flag === "urgent" ? "border-status-urgent" : flag === "review" ? "border-status-review" : "border-border",
        className,
      )}
      aria-label={label}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="label-caps truncate">{label}</div>
        <span className="shrink-0 rounded-sm border border-border px-1.5 py-px font-mono text-[10px] text-muted-foreground">{source}</span>
      </div>
      <div className="mt-0.5 flex h-4 items-center justify-between gap-2">
        <div className="truncate text-[11px] text-muted-foreground">{unit}</div>
        {flag && <FlagTag level={flag} />}
      </div>
      <div className={cn("mt-1.5 font-numeric text-5xl font-medium leading-none tabular-nums", valueClassName)}>{value}</div>
      {meta && <div className="mt-1 text-[11px] text-muted-foreground">{meta}</div>}
      {children}
      <div className="mt-auto pt-2">
        {history && <Sparkline data={history} className={valueClassName} />}
        <div className="mt-1 text-[10px] text-muted-foreground">{limits}</div>
      </div>
    </section>
  );
}
