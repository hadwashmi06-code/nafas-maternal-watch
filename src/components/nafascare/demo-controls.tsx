import { Pause, Play, RotateCcw } from "lucide-react";

import type { RunStatus } from "@/hooks/use-nafas-simulation";
import { formatElapsed } from "@/lib/nafascare/format";
import { SCENARIO_ORDER, SCENARIOS, type ScenarioId } from "@/lib/nafascare/scenarios";
import { cn } from "@/lib/utils";

import { ControlButton } from "./control-button";
import { Panel } from "./panel";

const SCEN_STYLE: Record<ScenarioId, { dot: string; active: string }> = {
  stable: { dot: "bg-status-ok", active: "border-status-ok/70 bg-status-ok/10" },
  review: { dot: "bg-status-review", active: "border-status-review/70 bg-status-review/10" },
  urgent: { dot: "bg-status-urgent", active: "border-status-urgent/70 bg-status-urgent/10" },
};

interface Props {
  status: RunStatus;
  scenario: ScenarioId;
  elapsed: number;
  onPlay: () => void;
  onPause: () => void;
  onReset: () => void;
  onScenario: (id: ScenarioId) => void;
  className?: string | undefined;
}

export function DemoControls({
  status,
  scenario,
  elapsed,
  onPlay,
  onPause,
  onReset,
  onScenario,
  className,
}: Props) {
  return (
    <Panel
      aria-label="Demo control"
      title="Demo control"
      actions={
        <span className="font-mono text-[11px] tabular-nums text-muted-foreground">
          Sim {formatElapsed(elapsed)}
        </span>
      }
      className={className}
      bodyClassName="flex flex-col gap-2 p-2"
    >
      <div role="radiogroup" aria-label="Demo scenario" className="grid grid-cols-3 gap-1.5">
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
                "flex h-11 flex-col items-center justify-center gap-0.5 rounded-md border px-1 text-[11px] font-medium leading-tight transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                active
                  ? cn("text-foreground", SCEN_STYLE[id].active)
                  : "border-border text-muted-foreground hover:bg-accent/60 hover:text-foreground",
              )}
            >
              <span
                className={cn("size-2 rounded-full", SCEN_STYLE[id].dot, !active && "opacity-60")}
                aria-hidden
              />
              {SCENARIOS[id].label}
            </button>
          );
        })}
      </div>
      <div className="grid grid-cols-[1.6fr_1fr_1fr] gap-1.5">
        <ControlButton
          variant="primary"
          className="h-10 whitespace-nowrap px-2"
          onClick={onPlay}
          disabled={status === "running"}
        >
          <Play /> Play Demo
        </ControlButton>
        <ControlButton className="h-10 px-2" onClick={onPause} disabled={status !== "running"}>
          <Pause /> Pause
        </ControlButton>
        <ControlButton className="h-10 px-2" onClick={onReset}>
          <RotateCcw /> Reset
        </ControlButton>
      </div>
    </Panel>
  );
}
