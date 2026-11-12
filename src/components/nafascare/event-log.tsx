import type { EventCategory, LogEvent } from "@/hooks/use-nafas-simulation";
import { formatClock, formatElapsed } from "@/lib/nafascare/format";
import { cn } from "@/lib/utils";

const CAT: Record<EventCategory, string> = {
  SYSTEM: "text-muted-foreground",
  SCENARIO: "text-signal-spo2",
  ALERT: "text-status-review",
  EBL: "text-foreground",
  SENSOR: "text-status-technical",
  USER: "text-signal-hr",
  OBS: "text-signal-rr",
  MED: "text-signal-temp",
};

export function EventList({ events }: { events: LogEvent[] }) {
  return (
    <ol className="divide-y divide-border" aria-label="Clinical event log">
      {events.map((e) => (
        <li
          key={e.id}
          className="grid grid-cols-[60px_60px_minmax(0,1fr)] gap-2 px-3 py-1.5 text-[11px] leading-snug"
        >
          <span
            className="font-mono tabular-nums text-muted-foreground"
            title={`Sim time ${formatElapsed(e.elapsed)}`}
          >
            {formatClock(e.wall)}
          </span>
          <span
            className={cn("font-mono text-[10px] font-semibold tracking-wider", CAT[e.category])}
          >
            {e.category}
          </span>
          <span className="text-foreground/90">{e.text}</span>
        </li>
      ))}
    </ol>
  );
}
