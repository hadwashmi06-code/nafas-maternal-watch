import { useState, type FormEvent } from "react";

import type { EblEntry } from "@/hooks/use-nafas-simulation";
import { formatClock } from "@/lib/nafascare/format";
import { DEMO_THRESHOLDS } from "@/lib/nafascare/review-rules";

import { ControlButton } from "./control-button";
import { VitalTile } from "./vital-tile";

const MAX_ENTRY = 3000;

interface Props {
  total: number;
  entries: EblEntry[];
  flag: "review" | "urgent" | null;
  onAdd: (amount: number) => void;
}

export function EblTile({ total, entries, flag, onAdd }: Props) {
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const last = entries[0];

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
    <VitalTile
      label="Est. blood loss"
      unit="mL · cumulative"
      source="MANUAL"
      flag={flag}
      valueClassName="text-foreground"
      value={total}
      meta={
        last ? (
          <>
            Last: {last.kind === "preset" ? `${last.amount} mL scenario value` : `+${last.amount} mL`} ·{" "}
            <span className="font-mono">{formatClock(last.wall)}</span>
          </>
        ) : null
      }
      limits={`Demo prompts ≥${DEMO_THRESHOLDS.ebl.review} · ≥${DEMO_THRESHOLDS.ebl.urgent} mL · clinician estimate`}
    >
      <form onSubmit={onSubmit} className="mt-2 flex gap-1.5">
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
      <div className="mt-1.5 flex gap-1.5">
        {[50, 100, 250].map((n) => (
          <ControlButton key={n} size="sm" variant="ghost" className="border border-border" onClick={() => submit(n)}>
            +{n}
          </ControlButton>
        ))}
      </div>
      {error && <p className="mt-1 text-[11px] text-status-review">{error}</p>}
    </VitalTile>
  );
}
