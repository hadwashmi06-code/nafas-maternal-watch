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
      <div className="flex items-start justify-between gap-2">
        <div className="leading-tight">
          <div className="label-caps">{label}</div>
          <div className="text-[11px] text-muted-foreground">{unit}</div>
        </div>
        <div className="flex items-center gap-1.5">
          {flag && <FlagTag level={flag} />}
          <span className="rounded-sm border border-border px-1.5 py-px font-mono text-[10px] text-muted-foreground">{source}</span>
        </div>
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
