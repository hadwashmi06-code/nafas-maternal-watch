import { Pause, Play, RotateCcw } from "lucide-react";
import type { ReactNode } from "react";

import type { RunStatus } from "@/hooks/use-nafas-simulation";
import { formatDuration, formatElapsed, formatShortClock } from "@/lib/nafascare/format";
import {
  SCENARIO_ORDER,
  SCENARIOS,
  SENSOR_IDS,
  type ScenarioId,
  type SensorId,
  type SensorReading,
} from "@/lib/nafascare/scenarios";
import { cn } from "@/lib/utils";

import { ControlButton } from "./control-button";

const DELIVERY_OFFSET_S = 72 * 60;

function Section({ title, aside, children, className }: { title: string; aside?: ReactNode; children: ReactNode; className?: string | undefined }) {
  return (
    <section className={cn("border-b border-border px-3 py-2.5 last:border-b-0", className)}>
      <div className="mb-2 flex items-center justify-between gap-2">
        <h2 className="label-caps">{title}</h2>
        {aside}
      </div>
      {children}
    </section>
  );
}

function PatientSummary({ sessionStart, elapsed }: { sessionStart: number; elapsed: number }) {
  const rows: [string, string][] = [
    ["Birth", "Spontaneous vaginal"],
    ["Gestation", "39+2 wk"],
    ["Time of birth", formatShortClock(sessionStart - DELIVERY_OFFSET_S * 1000)],
    ["Placenta", "Recorded complete"],
    ["Blood group", "O Rh+ (fict.)"],
    ["Allergies", "None recorded"],
    ["Team", "Postnatal B (demo)"],
  ];
  return (
    <Section
      title="Patient"
      aside={
        <span className="rounded-sm border border-status-review/50 px-1 py-px text-[9px] font-semibold uppercase tracking-wider text-status-review">
          Fictional
        </span>
      }
    >
      <div className="text-sm font-semibold leading-tight">Demo Patient A</div>
      <div className="mt-0.5 font-mono text-[11px] text-muted-foreground">SIM-000427 · 31 y · G2 P2</div>
      <div className="mt-2 flex items-baseline justify-between rounded-sm border border-border bg-background px-2 py-1">
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Since birth</span>
        <span className="font-numeric text-base font-medium tabular-nums">{formatDuration(DELIVERY_OFFSET_S + elapsed)}</span>
      </div>
      <dl className="mt-1.5 text-[11px]">
        {rows.map(([k, v]) => (
          <div key={k} className="flex justify-between gap-2 py-[3px]">
            <dt className="text-muted-foreground">{k}</dt>
            <dd className="truncate text-right font-medium">{v}</dd>
          </div>
        ))}
      </dl>
    </Section>
  );
}

const SENSOR_SHORT: Record<SensorId, string> = { ehg: "EHG array", ecg: "ECG", nibp: "NIBP cuff", spo2: "SpO₂ probe" };
const DOT = { connected: "bg-status-ok", degraded: "bg-status-review", disconnected: "bg-status-urgent" } as const;

function SensorList({ sensors }: { sensors: Record<SensorId, SensorReading> }) {
  return (
    <Section title="Sensors">
      <ul className="space-y-1.5">
        {SENSOR_IDS.map((id) => {
          const s = sensors[id];
          return (
            <li key={id} className="text-[11px]">
              <div className="flex items-center gap-2">
                <span className={cn("size-1.5 shrink-0 rounded-full", DOT[s.state])} aria-hidden />
                <span className="font-medium">{SENSOR_SHORT[id]}</span>
                <span className={cn("ml-auto text-[9px] font-semibold uppercase tracking-wider", s.state === "connected" ? "text-status-ok" : "text-status-review")}>
                  {s.state === "connected" ? "OK" : "Check"}
                </span>
              </div>
              <div className={cn("truncate pl-3.5", s.state === "connected" ? "text-muted-foreground" : "text-status-review")}>{s.note}</div>
            </li>
          );
        })}
      </ul>
    </Section>
  );
}

const SCEN_DOT: Record<ScenarioId, string> = { stable: "bg-status-ok", review: "bg-status-review", urgent: "bg-status-urgent" };

interface DemoControlsProps {
  status: RunStatus;
  scenario: ScenarioId;
  elapsed: number;
  onPlay: () => void;
  onPause: () => void;
  onReset: () => void;
  onScenario: (id: ScenarioId) => void;
}

function DemoControls({ status, scenario, elapsed, onPlay, onPause, onReset, onScenario }: DemoControlsProps) {
  return (
    <Section
      title="Demo control"
      aside={<span className="font-mono text-[11px] tabular-nums text-muted-foreground">{formatElapsed(elapsed)}</span>}
      className="mt-auto bg-background/40"
    >
      <div role="radiogroup" aria-label="Demo scenario" className="space-y-1">
        {SCENARIO_ORDER.map((id) => {
          const active = id === scenario;
          return (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onScenario(id)}
              className={cn(
                "flex h-7 w-full items-center gap-2 rounded-sm border px-2 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                active ? "border-input bg-accent text-foreground" : "border-transparent text-muted-foreground hover:bg-accent/60 hover:text-foreground",
              )}
            >
              <span className={cn("size-2 rounded-full", SCEN_DOT[id], !active && "opacity-60")} aria-hidden />
              {SCENARIOS[id].label}
            </button>
          );
        })}
      </div>
      <ControlButton variant="primary" className="mt-2.5 w-full" onClick={onPlay} disabled={status === "running"}>
        <Play /> Play Demo
      </ControlButton>
      <div className="mt-1.5 grid grid-cols-2 gap-1.5">
        <ControlButton onClick={onPause} disabled={status !== "running"}>
          <Pause /> Pause
        </ControlButton>
        <ControlButton onClick={onReset}>
          <RotateCcw /> Reset
        </ControlButton>
      </div>
    </Section>
  );
}

interface SidebarProps extends DemoControlsProps {
  sessionStart: number;
  sensors: Record<SensorId, SensorReading>;
  className?: string | undefined;
}

export function Sidebar({ sessionStart, sensors, className, ...controls }: SidebarProps) {
  return (
    <aside className={cn("flex min-h-0 flex-col overflow-y-auto rounded-md border border-border bg-card", className)}>
      <PatientSummary sessionStart={sessionStart} elapsed={controls.elapsed} />
      <SensorList sensors={sensors} />
      <DemoControls {...controls} />
    </aside>
  );
}
