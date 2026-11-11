import { Bell } from "lucide-react";

import type { AlertItem, AlertSeverity } from "@/hooks/use-nafas-simulation";
import { formatClock } from "@/lib/nafascare/format";
import { cn } from "@/lib/utils";

import { ControlButton } from "./control-button";
import { Panel } from "./panel";

const SEV: Record<AlertSeverity, { bar: string; text: string }> = {
  urgent: { bar: "bg-status-urgent", text: "text-status-urgent" },
  review: { bar: "bg-status-review", text: "text-status-review" },
  technical: { bar: "bg-status-technical", text: "text-status-technical" },
  info: { bar: "bg-status-ok", text: "text-status-ok" },
};

interface Props {
  alerts: AlertItem[];
  onAck: (id: number) => void;
  onAckAll: () => void;
  className?: string | undefined;
}

export function AlertHistory({ alerts, onAck, onAckAll, className }: Props) {
  const pending = alerts.filter((a) => !a.acknowledged).length;
  return (
    <Panel
      title={
        <>
          Alert history
          {pending > 0 && (
            <span className="rounded-sm bg-status-review px-1.5 py-px font-mono text-[10px] text-status-review-foreground">{pending}</span>
          )}
        </>
      }
      icon={<Bell className="size-3.5" aria-hidden />}
      actions={
        pending > 0 ? (
          <ControlButton size="sm" variant="ghost" onClick={onAckAll}>
            Acknowledge all
          </ControlButton>
        ) : null
      }
      className={className}
      bodyClassName="overflow-y-auto"
    >
      {alerts.length === 0 ? (
        <p className="px-3 py-6 text-center text-xs text-muted-foreground">No alerts recorded this session.</p>
      ) : (
        <ul className="divide-y divide-border">
          {alerts.map((a) => {
            const s = SEV[a.severity];
            return (
              <li
                key={a.id}
                className={cn("grid grid-cols-[3px_56px_minmax(0,1fr)_auto] items-center gap-2.5 px-3 py-1.5", a.acknowledged && "opacity-55")}
              >
                <span className={cn("h-full min-h-4 rounded-full", s.bar)} aria-hidden />
                <span className="font-mono text-[10px] tabular-nums text-muted-foreground">{formatClock(a.wall)}</span>
                <div className="min-w-0 text-[11px] leading-snug">
                  <div className={cn("truncate font-semibold", s.text)}>{a.title}</div>
                  <div className="truncate text-muted-foreground">{a.detail}</div>
                </div>
                {a.acknowledged ? (
                  <span className="font-mono text-[10px] text-muted-foreground">ACK {a.ackWall ? formatClock(a.ackWall) : ""}</span>
                ) : (
                  <ControlButton size="sm" variant="secondary" className="h-5 px-2 text-[10px]" onClick={() => onAck(a.id)}>
                    Acknowledge
                  </ControlButton>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </Panel>
  );
}
