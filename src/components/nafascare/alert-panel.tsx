import { AlertTriangle, BellRing, CheckCircle2, OctagonAlert } from "lucide-react";

import type { AlertItem } from "@/hooks/use-nafas-simulation";
import type { ReviewResult } from "@/lib/nafascare/review-rules";
import { cn } from "@/lib/utils";

import { ControlButton } from "./control-button";

const STYLE = {
  none: {
    box: "border-status-ok/40 bg-status-ok/8",
    icon: "text-status-ok",
    title: "No review prompts active",
  },
  review: {
    box: "border-status-review bg-status-review/12",
    icon: "text-status-review",
    title: "Clinical review suggested",
  },
  urgent: {
    box: "border-status-urgent bg-status-urgent/16",
    icon: "text-status-urgent",
    title: "Urgent clinical review suggested",
  },
} as const;

interface Props {
  review: ReviewResult;
  alerts: AlertItem[];
  onAckAll: () => void;
  onShowHistory: () => void;
  className?: string | undefined;
}

/** Clinical alert / status panel — always visible above the monitor. */
export function AlertPanel({ review, alerts, onAckAll, onShowHistory, className }: Props) {
  const st = STYLE[review.level];
  const Icon =
    review.level === "urgent"
      ? OctagonAlert
      : review.level === "review"
        ? AlertTriangle
        : CheckCircle2;
  const pending = alerts.filter((a) => !a.acknowledged).length;

  return (
    <section
      role="status"
      aria-live="polite"
      aria-label="Clinical alert status"
      className={cn(
        "flex min-h-[60px] shrink-0 items-center gap-3 rounded-md border px-3 py-1.5",
        st.box,
        className,
      )}
    >
      <Icon className={cn("size-7 shrink-0", st.icon)} aria-hidden />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <h2 className={cn("shrink-0 text-base font-semibold leading-tight", st.icon)}>
            {st.title}
          </h2>
          <span className="hidden truncate text-[10px] uppercase tracking-wider text-muted-foreground xl:inline">
            Demo thresholds · not medically validated · assessment remains with the clinical team
          </span>
        </div>
        {review.level === "none" ? (
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            Monitored and recorded values are within the configured demo ranges.
          </p>
        ) : (
          <ul
            className="mt-1 flex min-w-0 flex-wrap gap-1.5 overflow-hidden"
            aria-label="Review reasons"
          >
            {review.reasons.map((r) => (
              <li
                key={r.key}
                title={r.message}
                className={cn(
                  "shrink-0 rounded-sm px-1.5 py-0.5 font-mono text-[10px] font-semibold xl:text-[11px]",
                  r.level === "urgent"
                    ? "bg-status-urgent text-status-urgent-foreground"
                    : "bg-status-review text-status-review-foreground",
                )}
              >
                {r.short}
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          onClick={onShowHistory}
          aria-label={`${pending} unacknowledged alerts — open alert history`}
          className="flex h-9 items-center gap-1.5 rounded-md px-2 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <BellRing className="size-4" aria-hidden />
          <span className="tabular-nums">
            {pending > 0 ? (
              <>
                <span className="font-semibold text-foreground">{pending}</span>
                <span className="hidden min-[1100px]:inline"> unacknowledged</span>
              </>
            ) : (
              <span className="hidden min-[1100px]:inline">All acknowledged</span>
            )}
          </span>
        </button>
        <ControlButton className="h-9 px-3" onClick={onAckAll} disabled={pending === 0}>
          Acknowledge all
        </ControlButton>
      </div>
    </section>
  );
}
