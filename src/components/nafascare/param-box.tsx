import type { ReactNode } from "react";

import type { SensorState } from "@/lib/nafascare/scenarios";
import { cn } from "@/lib/utils";

export function Sparkline({ data, className }: { data: number[]; className?: string | undefined }) {
  if (data.length < 2) return <div className={cn("h-7", className)} />;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = Math.max(1e-6, max - min) || 1;
  const d = data
    .map(
      (v, i) =>
        `${((i / (data.length - 1)) * 100).toFixed(2)},${(26 - ((v - min) / span) * 22).toFixed(2)}`,
    )
    .join(" ");
  return (
    <svg
      viewBox="0 0 100 28"
      preserveAspectRatio="none"
      className={cn("h-7 w-full", className)}
      aria-hidden
    >
      <polyline
        points={d}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.25"
        vectorEffect="non-scaling-stroke"
        opacity="0.8"
      />
    </svg>
  );
}

export function FlagTag({ level }: { level: "review" | "urgent" }) {
  return (
    <span
      className={cn(
        "rounded-sm px-1.5 py-px text-[10px] font-semibold uppercase tracking-wider",
        level === "urgent"
          ? "bg-status-urgent text-status-urgent-foreground"
          : "bg-status-review text-status-review-foreground",
      )}
    >
      {level === "urgent" ? "Urgent" : "Review"}
    </span>
  );
}

/** Small chip naming the device a value comes from; turns amber when that device needs checking. */
export function SourceChip({
  children,
  state = "connected",
}: {
  children: ReactNode;
  state?: SensorState | undefined;
}) {
  return (
    <span
      className={cn(
        "inline-flex min-w-0 items-center gap-1 whitespace-nowrap rounded-sm border px-1 py-px text-[9px] font-medium uppercase tracking-wider",
        state === "connected"
          ? "border-border text-muted-foreground"
          : "border-status-review/60 text-status-review",
      )}
    >
      <span
        className={cn(
          "size-1 rounded-full",
          state === "connected" ? "bg-status-ok" : "bg-status-review",
        )}
        aria-hidden
      />
      {children}
    </span>
  );
}

export const flagRing = (flag: "review" | "urgent" | null) =>
  cn(
    flag === "urgent" && "bg-status-urgent/10 ring-1 ring-inset ring-status-urgent",
    flag === "review" && "bg-status-review/8 ring-1 ring-inset ring-status-review",
  );

interface VitalTileProps {
  label: string;
  unit: string;
  source: string;
  sourceState?: SensorState | undefined;
  colorClass: string;
  flag: "review" | "urgent" | null;
  value: ReactNode;
  limits?: [string, string] | undefined;
  /** Hide limits on narrow tiles (iPad 1024 px) where the value needs the room */
  compactLimits?: boolean | undefined;
  meta?: ReactNode;
  /** Mini waveform or trend strip shown along the bottom of the tile */
  strip?: ReactNode;
  className?: string | undefined;
}

/** Monitor-style numeric parameter tile with its measurement source. */
export function VitalTile({
  label,
  unit,
  source,
  sourceState,
  colorClass,
  flag,
  value,
  limits,
  compactLimits,
  meta,
  strip,
  className,
}: VitalTileProps) {
  return (
    <section
      aria-label={`${label} (${source})`}
      className={cn(
        "flex min-h-0 min-w-0 flex-col bg-panel-inset px-2.5 pt-1.5 transition-colors",
        flagRing(flag),
        className,
      )}
    >
      <div className="flex items-center justify-between gap-1.5">
        <div className={cn("flex min-w-0 items-baseline gap-1", colorClass)}>
          <span className="text-[13px] font-semibold tracking-wide">{label}</span>
          <span className="truncate text-[10px] opacity-75">{unit}</span>
        </div>
        {flag ? <FlagTag level={flag} /> : null}
      </div>
      <div className="flex min-h-0 flex-1 items-center justify-between gap-1.5">
        <div
          className={cn(
            "font-numeric text-[40px] font-medium leading-none tabular-nums xl:text-[48px]",
            colorClass,
          )}
        >
          {value}
        </div>
        {limits && (
          <div
            className={cn(
              "shrink-0 text-right font-mono text-[9px] leading-snug text-muted-foreground",
              compactLimits && "hidden min-[1100px]:block",
            )}
          >
            <div>{limits[0]}</div>
            <div>{limits[1]}</div>
          </div>
        )}
      </div>
      <div className="relative h-7 shrink-0">{strip}</div>
      <div className="flex h-6 shrink-0 items-center justify-between gap-1.5 border-t border-border/60 text-[10px] text-muted-foreground">
        <SourceChip state={sourceState}>{source}</SourceChip>
        {meta && <span className="hidden truncate font-mono min-[1100px]:inline">{meta}</span>}
      </div>
    </section>
  );
}
