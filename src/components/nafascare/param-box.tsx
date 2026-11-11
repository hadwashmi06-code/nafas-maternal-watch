import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function Sparkline({ data, className }: { data: number[]; className?: string | undefined }) {
  if (data.length < 2) return <div className={cn("h-7", className)} />;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = Math.max(1, max - min);
  const d = data
    .map((v, i) => `${((i / (data.length - 1)) * 100).toFixed(2)},${(26 - ((v - min) / span) * 22).toFixed(2)}`)
    .join(" ");
  return (
    <svg viewBox="0 0 100 28" preserveAspectRatio="none" className={cn("h-7 w-full", className)} aria-hidden>
      <polyline points={d} fill="none" stroke="currentColor" strokeWidth="1.25" vectorEffect="non-scaling-stroke" opacity="0.85" />
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

interface ParamBoxProps {
  label: string;
  unit: string;
  source?: string | undefined;
  colorClass: string;
  flag: "review" | "urgent" | null;
  value: ReactNode;
  limits?: [string, string] | undefined;
  meta?: ReactNode;
  size?: "xl" | "lg" | undefined;
  className?: string | undefined;
  children?: ReactNode;
}

/** Monitor-style numeric parameter box. */
export function ParamBox({ label, unit, source, colorClass, flag, value, limits, meta, size = "xl", className, children }: ParamBoxProps) {
  return (
    <section
      aria-label={label}
      className={cn(
        "flex min-h-0 min-w-0 flex-col px-3 py-2 transition-colors",
        flag === "urgent" && "bg-status-urgent/10 ring-1 ring-inset ring-status-urgent",
        flag === "review" && "bg-status-review/8 ring-1 ring-inset ring-status-review",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <div className={cn("flex items-baseline gap-1.5", colorClass)}>
          <span className="text-xs font-semibold tracking-wide">{label}</span>
          <span className="text-[10px] opacity-75">{unit}</span>
        </div>
        <div className="flex items-center gap-1.5">
          {flag && <FlagTag level={flag} />}
          {source && (
            <span className="rounded-sm border border-border px-1 py-px font-mono text-[9px] text-muted-foreground">{source}</span>
          )}
        </div>
      </div>
      <div className="flex min-h-0 flex-1 items-center justify-between gap-2">
        <div
          className={cn(
            "font-numeric font-medium leading-none tabular-nums",
            size === "xl" ? "text-[64px]" : "text-5xl",
            colorClass,
          )}
        >
          {value}
        </div>
        {limits && (
          <div className="shrink-0 text-right font-mono text-[10px] leading-snug text-muted-foreground">
            <div>{limits[0]}</div>
            <div>{limits[1]}</div>
          </div>
        )}
      </div>
      {meta && <div className="text-[11px] text-muted-foreground">{meta}</div>}
      {children}
    </section>
  );
}
