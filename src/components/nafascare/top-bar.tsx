import { useEffect, useState } from "react";

import type { RunStatus } from "@/hooks/use-nafas-simulation";
import { formatClock, formatDate } from "@/lib/nafascare/format";
import { SENSOR_IDS, type SensorId, type SensorReading } from "@/lib/nafascare/scenarios";
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
      <rect x="0.75" y="0.75" width="26.5" height="26.5" rx="5" className="fill-none stroke-primary" strokeWidth="1.5" />
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

export function TopBar({ status, sensors }: { status: RunStatus; sensors: Record<SensorId, SensorReading> }) {
  const now = useNow();
  const connected = SENSOR_IDS.filter((id) => sensors[id].state !== "disconnected").length;
  const degraded = SENSOR_IDS.filter((id) => sensors[id].state === "degraded").length;
  const st = STATUS_STYLE[status];

  return (
    <header className="flex h-12 shrink-0 items-center justify-between gap-4 border-b border-border bg-card px-4">
      <div className="flex items-center gap-3">
        <Logo />
        <div className="leading-tight">
          <div className="text-[15px] font-semibold tracking-tight">NafasCare</div>
          <div className="text-[11px] text-muted-foreground">Postpartum Maternal Monitoring</div>
        </div>
        <div className="mx-2 hidden h-6 w-px bg-border md:block" />
        <div className="hidden text-xs text-muted-foreground md:block">
          Postnatal Unit · <span className="text-foreground">Bed 04</span>
        </div>
      </div>

      <div className="flex items-center gap-5">
        <div className="hidden items-center gap-2 text-xs sm:flex">
          <span
            className={cn("size-2 rounded-full", degraded > 0 ? "bg-status-review" : "bg-status-ok")}
            aria-hidden
          />
          <span className="text-muted-foreground">
            Sensors <span className="text-foreground tabular-nums">{connected}/{SENSOR_IDS.length}</span> connected
            {degraded > 0 && <span className="text-status-review"> · {degraded} need check</span>}
          </span>
        </div>
        <div className={cn("flex items-center gap-2 rounded-sm border border-border px-2 py-1 text-[11px] font-semibold uppercase tracking-wider", st.text)}>
          <span className={cn("size-1.5 rounded-full", st.dot)} aria-hidden />
          {st.label}
        </div>
        <div className="text-right leading-tight">
          <div className="font-mono text-sm tabular-nums">{formatClock(now)}</div>
          <div className="text-[11px] text-muted-foreground">{formatDate(now)}</div>
        </div>
      </div>
    </header>
  );
}

export function SimulationStrip() {
  return (
    <div
      role="note"
      className="flex shrink-0 flex-wrap items-center justify-center gap-x-4 gap-y-0.5 border-b border-status-review/40 bg-status-review/10 px-4 py-1.5 text-center"
    >
      <span className="text-xs font-bold tracking-[0.12em] text-status-review">SIMULATION — NOT FOR CLINICAL USE</span>
      <span className="text-[11px] text-muted-foreground">
        All data fictional · Review thresholds are illustrative and not medically validated · Simulated EHG does not measure blood loss
      </span>
    </div>
  );
}
