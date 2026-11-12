import { Droplet } from "lucide-react";
import { useState, type FormEvent } from "react";

import { MAX_ENTRY_ML, type BloodLossSource, type EblEntry } from "@/hooks/use-nafas-simulation";
import { formatShortClock } from "@/lib/nafascare/format";
import { IMPORT_DEVICE } from "@/lib/nafascare/patient";
import { DEMO_THRESHOLDS } from "@/lib/nafascare/review-rules";
import { cn } from "@/lib/utils";

import { ControlButton } from "./control-button";
import { FlagTag, flagRing } from "./param-box";
import { Panel } from "./panel";

const SOURCE_LABEL: Record<BloodLossSource, string> = {
  manual: "Manual record",
  imported: "Imported device",
};

interface Props {
  total: number;
  entries: EblEntry[];
  flag: "review" | "urgent" | null;
  onAdd: (amount: number, source: BloodLossSource) => void;
  className?: string | undefined;
}

export function BloodLossPanel({ total, entries, flag, onAdd, className }: Props) {
  const [value, setValue] = useState("");
  const [source, setSource] = useState<BloodLossSource>("manual");
  const [error, setError] = useState<string | null>(null);
  const t = DEMO_THRESHOLDS.ebl;
  const manual = entries.filter((e) => e.source === "manual").reduce((a, e) => a + e.amount, 0);
  const imported = total - manual;

  const submit = (amount: number) => {
    if (!Number.isInteger(amount) || amount < 1 || amount > MAX_ENTRY_ML) {
      setError(`Enter a whole number, 1–${MAX_ENTRY_ML} mL`);
      return;
    }
    setError(null);
    setValue("");
    onAdd(amount, source);
  };
  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    submit(Number(value));
  };

  return (
    <Panel
      aria-label="Cumulative blood loss"
      title="Blood loss"
      icon={<Droplet className="size-3.5" aria-hidden />}
      actions={
        flag ? (
          <FlagTag level={flag} />
        ) : (
          <span className="text-[10px] text-muted-foreground">cumulative</span>
        )
      }
      className={cn(flag && "border-transparent", className)}
      bodyClassName={cn("flex flex-col gap-2 px-3 py-2", flagRing(flag))}
    >
      <div className="flex items-end justify-between gap-2">
        <div className="font-numeric text-[44px] font-medium leading-none tabular-nums text-signal-ebl">
          {total}
          <span className="ml-1 text-base text-muted-foreground">mL</span>
        </div>
        <div className="pb-0.5 text-right font-mono text-[9px] leading-snug text-muted-foreground">
          <div>≥{t.review} review</div>
          <div>≥{t.urgent} urgent</div>
        </div>
      </div>
      <dl className="-mt-1 grid grid-cols-2 gap-x-2 text-[11px]">
        <div className="flex items-baseline justify-between gap-1 border-l-2 border-signal-ebl/60 pl-1.5">
          <dt className="text-[10px] text-muted-foreground">Manual</dt>
          <dd className="font-mono tabular-nums">{manual} mL</dd>
        </div>
        <div className="flex items-baseline justify-between gap-1 border-l-2 border-signal-spo2/60 pl-1.5">
          <dt className="text-[10px] text-muted-foreground">Imported</dt>
          <dd className="font-mono tabular-nums">{imported} mL</dd>
        </div>
      </dl>

      <div
        role="radiogroup"
        aria-label="Source of next blood loss entry"
        className="grid grid-cols-2 gap-1 rounded-md border border-border p-0.5"
      >
        {(["manual", "imported"] as const).map((s) => (
          <button
            key={s}
            type="button"
            role="radio"
            aria-checked={source === s}
            onClick={() => setSource(s)}
            className={cn(
              "h-8 rounded-sm text-[11px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              source === s
                ? "bg-accent text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {SOURCE_LABEL[s]}
          </button>
        ))}
      </div>
      <form onSubmit={onSubmit} className="flex gap-1.5">
        <label htmlFor="ebl-input" className="sr-only">
          Add blood loss in mL ({SOURCE_LABEL[source]})
        </label>
        <input
          id="ebl-input"
          type="number"
          inputMode="numeric"
          min={1}
          max={MAX_ENTRY_ML}
          placeholder={source === "manual" ? "Estimate, mL" : `From scale, mL`}
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            if (error) setError(null);
          }}
          className="h-9 w-full min-w-0 rounded-md border border-input bg-background px-2 font-mono text-sm tabular-nums placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <ControlButton type="submit" className="h-9">
          Record
        </ControlButton>
      </form>
      <div className="grid grid-cols-3 gap-1.5">
        {[50, 100, 250].map((n) => (
          <ControlButton
            key={n}
            variant="ghost"
            className="h-8 border border-border"
            onClick={() => submit(n)}
          >
            +{n}
          </ControlButton>
        ))}
      </div>
      {error ? (
        <p className="text-[10px] text-status-review">{error}</p>
      ) : (
        <LastEntry entry={entries[0]} />
      )}
    </Panel>
  );
}

function LastEntry({ entry }: { entry: EblEntry | undefined }) {
  if (!entry) return <p className="text-[10px] text-muted-foreground">No entries</p>;
  const what = entry.preset
    ? `${entry.amount} mL scenario record (manual)`
    : entry.source === "imported"
      ? `+${entry.amount} mL imported · ${IMPORT_DEVICE}`
      : `+${entry.amount} mL manual record`;
  return (
    <p className="truncate text-[10px] text-muted-foreground">
      Last: {what} · <span className="font-mono">{formatShortClock(entry.wall)}</span>
    </p>
  );
}
