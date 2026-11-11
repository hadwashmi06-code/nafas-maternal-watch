import { Bell } from "lucide-react";

import type { AlertItem, AlertSeverity } from "@/hooks/use-nafas-simulation";
import { formatClock } from "@/lib/nafascare/format";
import { cn } from "@/lib/utils";

import { ControlButton } from "./control-button";
import { Panel } from "./panel";

const SEV: Record<AlertSeverity, { bar: string; tag: string; label: string }> = {
  urgent: { bar: "bg-status-urgent", tag: "text-status-urgent", label: "Urgent review" },
  review: { bar: "bg-status-review", tag: "text-status-review", label: "Clinical review" },
  technical: { bar: "bg-status-technical", tag: "text-status-technical", label: "Technical" },
  info: { bar: "bg-status-ok", tag: "text-status-ok", label: "Information" },
};

interface Props {
  alerts: AlertItem[];
  onAck: (id: number) => void;
  onAckAll: () => void;
  className?: string;
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
        <ul>
          {alerts.map((a) => {
            const s = SEV[a.severity];
            return (
              <li key={a.id} className={cn("flex gap-2.5 border-b border-border px-3 py-2", a.acknowledged && "opacity-60")}>
                <span className={cn("w-0.5 shrink-0 self-stretch rounded-full", s.bar)} aria-hidden />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-xs font-semibold">{a.title}</span>
                    <span className="font-mono text-[10px] text-muted-foreground">{formatClock(a.wall)}</span>
                  </div>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">{a.detail}</p>
                  <div className="mt-1 flex items-center justify-between gap-2">
                    <span className={cn("text-[10px] font-semibold uppercase tracking-wider", s.tag)}>{s.label}</span>
                    {a.acknowledged ? (
                      <span className="text-[10px] text-muted-foreground">
                        Acknowledged {a.ackWall ? formatClock(a.ackWall) : ""}
                      </span>
                    ) : (
                      <ControlButton size="sm" variant="secondary" className="h-5 px-2 text-[10px]" onClick={() => onAck(a.id)}>
                        Acknowledge
                      </ControlButton>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Panel>
  );
}
