import { useState, type FormEvent } from "react";

import type { EblEntry } from "@/hooks/use-nafas-simulation";
import { formatClock } from "@/lib/nafascare/format";
import { DEMO_THRESHOLDS } from "@/lib/nafascare/review-rules";
import { cn } from "@/lib/utils";

import { ControlButton } from "./control-button";
import { FlagTag } from "./param-box";

const MAX_ENTRY = 3000;

interface Props {
  total: number;
  entries: EblEntry[];
  flag: "review" | "urgent" | null;
  onAdd: (amount: number) => void;
  className?: string | undefined;
}

export function EblBox({ total, entries, flag, onAdd, className }: Props) {
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const last = entries[0];
  const t = DEMO_THRESHOLDS.ebl;

  const submit = (amount: number) => {
    if (!Number.isInteger(amount) || amount < 1 || amount > MAX_ENTRY) {
      setError(`Enter a whole number, 1–${MAX_ENTRY} mL`);
      return;
    }
    setError(null);
    setValue("");
    onAdd(amount);
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    submit(Number(value));
  };

  return (
    <section
      aria-label="Estimated blood loss"
      className={cn(
        "flex min-w-0 gap-3 px-3 py-2 transition-colors",
        flag === "urgent" && "bg-status-urgent/10 ring-1 ring-inset ring-status-urgent",
        flag === "review" && "bg-status-review/8 ring-1 ring-inset ring-status-review",
        className,
      )}
    >
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold tracking-wide">EBL</span>
          <span className="text-[10px] text-muted-foreground">mL · cumulative · manual</span>
          {flag && <FlagTag level={flag} />}
        </div>
        <div className="flex flex-1 items-center gap-3">
          <span className="font-numeric text-5xl font-medium leading-none tabular-nums">{total}</span>
          <div className="font-mono text-[10px] leading-snug text-muted-foreground">
            <div>≥{t.review} review</div>
            <div>≥{t.urgent} urgent</div>
          </div>
        </div>
        <div className="truncate text-[11px] text-muted-foreground">
          {last
            ? `Last: ${last.kind === "preset" ? `${last.amount} mL scenario value` : `+${last.amount} mL`} · ${formatClock(last.wall)}`
            : "No entries"}
        </div>
      </div>

      <div className="flex w-[168px] shrink-0 flex-col justify-center gap-1.5">
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Clinician estimate</span>
        <form onSubmit={onSubmit} className="flex gap-1.5">
          <label htmlFor="ebl-input" className="sr-only">
            Add estimated blood loss in mL
          </label>
          <input
            id="ebl-input"
            type="number"
            inputMode="numeric"
            min={1}
            max={MAX_ENTRY}
            placeholder="mL"
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              if (error) setError(null);
            }}
            className="h-7 w-full min-w-0 rounded-md border border-input bg-background px-2 font-mono text-xs tabular-nums placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <ControlButton type="submit" size="sm" variant="secondary" className="h-7">
            Record
          </ControlButton>
        </form>
        <div className="flex gap-1.5">
          {[50, 100, 250].map((n) => (
            <ControlButton key={n} size="sm" variant="ghost" className="flex-1 border border-border" onClick={() => submit(n)}>
              +{n}
            </ControlButton>
          ))}
        </div>
        {error && <p className="text-[10px] text-status-review">{error}</p>}
      </div>
    </section>
  );
}
