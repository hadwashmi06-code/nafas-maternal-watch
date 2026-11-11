import { Radio, UserRound } from "lucide-react";

import { formatDuration, formatShortClock } from "@/lib/nafascare/format";
import { SENSOR_IDS, SENSOR_INFO, type SensorId, type SensorReading } from "@/lib/nafascare/scenarios";
import { cn } from "@/lib/utils";

import { Panel } from "./panel";

const DELIVERY_OFFSET_S = 72 * 60;

export function PatientPanel({ sessionStart, elapsed, className }: { sessionStart: number; elapsed: number; className?: string }) {
  const rows: [string, string][] = [
    ["MRN", "SIM-000427"],
    ["Age", "31 y"],
    ["Obstetric history", "G2 P2"],
    ["Gestation at birth", "39+2 wk"],
    ["Mode of birth", "Spontaneous vaginal"],
    ["Time of birth", formatShortClock(sessionStart - DELIVERY_OFFSET_S * 1000)],
    ["Placenta", "Delivered, recorded complete"],
    ["Blood group", "O Rh+ (fictional)"],
    ["Allergies", "None recorded"],
    ["Monitoring since", formatShortClock(sessionStart)],
    ["Care team", "Postnatal Team B (demo)"],
  ];

  return (
    <Panel
      title="Patient details"
      icon={<UserRound className="size-3.5" aria-hidden />}
      actions={
        <span className="rounded-sm border border-status-review/50 px-1.5 py-px text-[10px] font-semibold uppercase tracking-wider text-status-review">
          Fictional
        </span>
      }
      className={className}
      bodyClassName="overflow-y-auto"
    >
      <div className="border-b border-border px-3 py-3">
        <div className="text-base font-semibold">Demo Patient A</div>
        <div className="mt-0.5 text-xs text-muted-foreground">Postnatal Unit · Bed 04</div>
        <div className="mt-2.5 rounded-sm border border-border bg-background px-2.5 py-1.5">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Time since birth</div>
          <div className="font-numeric text-xl font-medium tabular-nums">{formatDuration(DELIVERY_OFFSET_S + elapsed)}</div>
        </div>
      </div>
      <dl className="divide-y divide-border px-3 text-xs">
        {rows.map(([k, v]) => (
          <div key={k} className="flex justify-between gap-3 py-[5px]">
            <dt className="text-muted-foreground">{k}</dt>
            <dd className="text-right font-medium">{v}</dd>
          </div>
        ))}
      </dl>
    </Panel>
  );
}

const STATE_STYLE = {
  connected: { dot: "bg-status-ok", label: "Connected", text: "text-status-ok" },
  degraded: { dot: "bg-status-review", label: "Check", text: "text-status-review" },
  disconnected: { dot: "bg-status-urgent", label: "Disconnected", text: "text-status-urgent" },
} as const;

export function SensorPanel({ sensors, className }: { sensors: Record<SensorId, SensorReading>; className?: string }) {
  return (
    <Panel title="Sensor connection" icon={<Radio className="size-3.5" aria-hidden />} className={cn("shrink-0", className)}>
      <ul className="divide-y divide-border">
        {SENSOR_IDS.map((id) => {
          const s = sensors[id];
          const st = STATE_STYLE[s.state];
          return (
            <li key={id} className="flex items-start gap-2.5 px-3 py-2">
              <span className={cn("mt-1.5 size-2 shrink-0 rounded-full", st.dot)} aria-hidden />
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="truncate text-xs font-medium">{SENSOR_INFO[id].label}</span>
                  <span className={cn("text-[10px] font-semibold uppercase tracking-wider", st.text)}>{st.label}</span>
                </div>
                <div className="truncate text-[11px] text-muted-foreground">{SENSOR_INFO[id].detail}</div>
                <div className={cn("truncate text-[11px]", s.state === "connected" ? "text-muted-foreground" : st.text)}>{s.note}</div>
              </div>
            </li>
          );
        })}
      </ul>
    </Panel>
  );
}
