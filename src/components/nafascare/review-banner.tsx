import { AlertTriangle, CheckCircle2, OctagonAlert } from "lucide-react";

import type { ReviewResult } from "@/lib/nafascare/review-rules";
import { cn } from "@/lib/utils";

const STYLE = {
  none: {
    box: "border-status-ok/35 bg-status-ok/8",
    icon: "text-status-ok",
    title: "No review prompts active",
  },
  review: {
    box: "border-status-review/70 bg-status-review/10",
    icon: "text-status-review",
    title: "Clinical review suggested",
  },
  urgent: {
    box: "border-status-urgent/80 bg-status-urgent/12",
    icon: "text-status-urgent",
    title: "Urgent clinical review suggested",
  },
} as const;

export function ReviewBanner({ review }: { review: ReviewResult }) {
  const st = STYLE[review.level];
  const Icon = review.level === "urgent" ? OctagonAlert : review.level === "review" ? AlertTriangle : CheckCircle2;

  return (
    <div role="status" aria-live="polite" className={cn("flex shrink-0 items-start gap-3 rounded-md border px-3.5 py-2.5", st.box)}>
      <Icon className={cn("mt-0.5 size-5 shrink-0", st.icon)} aria-hidden />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4">
          <h2 className="text-sm font-semibold">{st.title}</h2>
          <span className="text-[11px] text-muted-foreground">Demo thresholds · not medically validated</span>
        </div>
        {review.level === "none" ? (
          <p className="mt-0.5 text-xs text-muted-foreground">
            Monitored and recorded values are within the configured demonstration ranges.
          </p>
        ) : (
          <>
            <ul className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-xs">
              {review.reasons.map((r) => (
                <li key={r.key} className="flex items-center gap-1.5">
                  <span
                    className={cn("size-1.5 rounded-full", r.level === "urgent" ? "bg-status-urgent" : "bg-status-review")}
                    aria-hidden
                  />
                  {r.message}
                </li>
              ))}
            </ul>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Decision-support prompt only. Assessment and management remain with the clinical team.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
