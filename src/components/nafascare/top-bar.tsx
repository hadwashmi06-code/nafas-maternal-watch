import { useEffect, useState } from "react";

import type { RunStatus } from "@/hooks/use-nafas-simulation";
import { formatClock, formatDate, formatDuration } from "@/lib/nafascare/format";
import { DEMO_PATIENT } from "@/lib/nafascare/patient";
import { cn } from "@/lib/utils";

function useNow() {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);
  return now;
}

function Logo() {
  return (
    <svg viewBox="0 0 28 28" className="size-7 shrink-0" aria-hidden>
      <rect
        x="0.75"
        y="0.75"
        width="26.5"
        height="26.5"
        rx="5"
        className="fill-none stroke-primary"
        strokeWidth="1.5"
      />
      <path
        d="M5 15h4.5l2-5 3 9 2.5-6.5 1.5 2.5H23"
        className="fill-none stroke-primary"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const STATUS_STYLE: Record<RunStatus, { label: string; dot: string; text: string }> = {
  standby: { label: "Standby", dot: "bg-muted-foreground", text: "text-muted-foreground" },
  running: { label: "Live · simulated", dot: "bg-status-ok animate-pulse", text: "text-status-ok" },
  paused: { label: "Paused", dot: "bg-status-review", text: "text-status-review" },
};

export function TopBar({ status, elapsed }: { status: RunStatus; elapsed: number }) {
  const now = useNow();
  const st = STATUS_STYLE[status];
  const p = DEMO_PATIENT;

  return (
    <header className="flex h-12 shrink-0 items-center justify-between gap-3 border-b border-border bg-card px-3">
      <div className="flex min-w-0 items-center gap-3">
        <Logo />
        <div className="shrink-0 leading-tight">
          <div className="text-[15px] font-semibold tracking-tight">NafasCare</div>
          <div className="text-[10px] text-muted-foreground">Postpartum Maternal Monitoring</div>
        </div>
        <div className="mx-1 hidden h-7 w-px bg-border md:block" />
        <div className="hidden min-w-0 leading-tight md:block">
          <div className="flex items-baseline gap-2 text-sm">
            <span className="font-semibold">{p.name}</span>
            <span className="font-mono text-[11px] text-muted-foreground">{p.mrn}</span>
            <span className="rounded-sm border border-status-review/50 px-1 text-[9px] font-semibold uppercase tracking-wider text-status-review">
              Fictional
            </span>
          </div>
          <div className="truncate text-[11px] text-muted-foreground">
            {p.age} y · {p.gravidaPara} · {p.unit} ·{" "}
            <span className="text-foreground">{p.bed}</span> · Allergies: {p.allergies}
          </div>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-3">
        <div className="hidden text-right leading-tight lg:block">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Since birth
          </div>
          <div className="font-numeric text-sm font-medium tabular-nums">
            {formatDuration(p.deliveryOffsetS + elapsed)}
          </div>
        </div>
        <div
          className={cn(
            "flex items-center gap-2 rounded-sm border border-border px-2 py-1 text-[11px] font-semibold uppercase tracking-wider",
            st.text,
          )}
        >
          <span className={cn("size-1.5 rounded-full", st.dot)} aria-hidden />
          {st.label}
        </div>
        <div className="text-right leading-tight">
          <div className="font-mono text-sm tabular-nums">{formatClock(now)}</div>
          <div className="text-[10px] text-muted-foreground">{formatDate(now)}</div>
        </div>
      </div>
    </header>
  );
}

export function SimulationStrip() {
  return (
    <div
      role="note"
      className="flex h-6 shrink-0 items-center justify-center gap-4 overflow-hidden whitespace-nowrap border-b border-status-review/40 bg-status-review/10 px-4"
    >
      <span className="shrink-0 text-xs font-bold tracking-[0.12em] text-status-review">
        SIMULATION — NOT FOR CLINICAL USE
      </span>
      <span className="truncate text-[11px] text-muted-foreground">
        Fictional data · Demo alert thresholds are illustrative, not clinically validated · EHG
        patch records uterine activity only — not blood loss, not a validated PPH predictor
      </span>
    </div>
  );
}
