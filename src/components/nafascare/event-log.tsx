import { ListOrdered } from "lucide-react";

import type { EventCategory, LogEvent } from "@/hooks/use-nafas-simulation";
import { formatClock, formatElapsed } from "@/lib/nafascare/format";
import { cn } from "@/lib/utils";

import { Panel } from "./panel";

const CAT: Record<EventCategory, string> = {
  SYSTEM: "text-muted-foreground",
  SCENARIO: "text-signal-spo2",
  ALERT: "text-status-review",
  EBL: "text-foreground",
  SENSOR: "text-status-technical",
  USER: "text-signal-hr",
};

export function EventLog({ events, className }: { events: LogEvent[]; className?: string }) {
  return (
    <Panel
      title="Clinical event log"
      icon={<ListOrdered className="size-3.5" aria-hidden />}
      actions={<span className="font-mono text-[10px] text-muted-foreground">{events.length} entries</span>}
      className={className}
      bodyClassName="overflow-y-auto"
    >
      <ol className="divide-y divide-border">
        {events.map((e) => (
          <li key={e.id} className="grid grid-cols-[56px_58px_minmax(0,1fr)] gap-2 px-3 py-1.5 text-[11px] leading-snug">
            <span className="font-mono tabular-nums text-muted-foreground" title={`Sim time ${formatElapsed(e.elapsed)}`}>
              {formatClock(e.wall)}
            </span>
            <span className={cn("font-mono text-[10px] font-semibold tracking-wider", CAT[e.category])}>{e.category}</span>
            <span className="text-foreground/90">{e.text}</span>
          </li>
        ))}
      </ol>
    </Panel>
  );
}
