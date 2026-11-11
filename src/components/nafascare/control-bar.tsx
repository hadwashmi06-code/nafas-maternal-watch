import { Pause, Play, RotateCcw } from "lucide-react";

import type { RunStatus } from "@/hooks/use-nafas-simulation";
import { formatElapsed } from "@/lib/nafascare/format";
import { SCENARIO_ORDER, SCENARIOS, type ScenarioId } from "@/lib/nafascare/scenarios";
import { cn } from "@/lib/utils";

import { ControlButton } from "./control-button";

const DOT: Record<ScenarioId, string> = {
  stable: "bg-status-ok",
  review: "bg-status-review",
  urgent: "bg-status-urgent",
};

interface Props {
  status: RunStatus;
  scenario: ScenarioId;
  elapsed: number;
  onPlay: () => void;
  onPause: () => void;
  onReset: () => void;
  onScenario: (id: ScenarioId) => void;
}

export function ControlBar({ status, scenario, elapsed, onPlay, onPause, onReset, onScenario }: Props) {
  return (
    <div className="flex shrink-0 flex-wrap items-center gap-x-6 gap-y-2 border-b border-border px-4 py-2">
      <div className="flex items-center gap-3">
        <span className="label-caps">Demo scenario</span>
        <div role="radiogroup" aria-label="Demo scenario" className="flex rounded-md border border-border bg-background p-0.5">
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
                  "flex h-7 items-center gap-2 rounded-sm px-3 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  active ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <span className={cn("size-2 rounded-full", DOT[id], !active && "opacity-60")} aria-hidden />
                {SCENARIOS[id].label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <ControlButton variant="primary" onClick={onPlay} disabled={status === "running"}>
          <Play /> Play Demo
        </ControlButton>
        <ControlButton onClick={onPause} disabled={status !== "running"}>
          <Pause /> Pause
        </ControlButton>
        <ControlButton onClick={onReset}>
          <RotateCcw /> Reset
        </ControlButton>
      </div>

      <div className="ml-auto flex items-center gap-5 text-xs text-muted-foreground">
        <span>
          Sim time <span className="font-mono text-foreground tabular-nums">{formatElapsed(elapsed)}</span>
        </span>
        <span className="hidden lg:inline">{SCENARIOS[scenario].description}</span>
      </div>
    </div>
  );
}
