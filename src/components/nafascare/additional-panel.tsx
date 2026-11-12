import { ChevronDown, ChevronUp, ClipboardList } from "lucide-react";
import { useState, type FormEvent, type ReactNode } from "react";

import { MAX_ENTRY_ML, type SimActions, type SimState } from "@/hooks/use-nafas-simulation";
import { formatDuration, formatShortClock } from "@/lib/nafascare/format";
import { DEMO_PATIENT, INTERVENTIONS, SYMPTOMS } from "@/lib/nafascare/patient";
import { DEMO_THRESHOLDS, shockIndex } from "@/lib/nafascare/review-rules";
import { TONE_LABEL, type UterineTone } from "@/lib/nafascare/scenarios";
import { cn } from "@/lib/utils";

import { AlertList } from "./alert-history";
import { ControlButton } from "./control-button";
import { EventList } from "./event-log";
import { FlagTag, Sparkline, flagRing } from "./param-box";

export type AdditionalTab =
  "clinical" | "observations" | "interventions" | "trends" | "alerts" | "log";

const TABS: { id: AdditionalTab; label: string }[] = [
  { id: "clinical", label: "Clinical" },
  { id: "observations", label: "Symptoms & notes" },
  { id: "interventions", label: "Medication & interventions" },
  { id: "trends", label: "Trends" },
  { id: "alerts", label: "Alert history" },
  { id: "log", label: "Event log" },
];

const TONE_STYLE: Record<UterineTone, string> = {
  firm: "border-status-ok bg-status-ok/20 text-status-ok",
  soft: "border-status-review bg-status-review/20 text-status-review",
  not_assessed: "border-input bg-accent text-foreground",
};

function Card({
  title,
  aside,
  children,
  className,
}: {
  title: string;
  aside?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      aria-label={title}
      className={cn(
        "flex min-h-0 min-w-0 flex-col rounded-md border border-border bg-background/40 p-2.5",
        className,
      )}
    >
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <h3 className="label-caps truncate">{title}</h3>
        <div className="shrink-0">{aside}</div>
      </div>
      {children}
    </section>
  );
}

const inputClass =
  "h-9 w-full min-w-0 rounded-md border border-input bg-background px-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

function AmountForm({
  id,
  label,
  onAdd,
  presets,
}: {
  id: string;
  label: string;
  onAdd: (n: number) => void;
  presets: number[];
}) {
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const submit = (n: number) => {
    if (!Number.isInteger(n) || n < 1 || n > MAX_ENTRY_ML) {
      setError(`Whole number, 1–${MAX_ENTRY_ML} mL`);
      return;
    }
    setError(null);
    setValue("");
    onAdd(n);
  };
  return (
    <div className="space-y-1.5">
      <form
        className="flex gap-1.5"
        onSubmit={(e: FormEvent) => {
          e.preventDefault();
          submit(Number(value));
        }}
      >
        <label htmlFor={id} className="sr-only">
          {label}
        </label>
        <input
          id={id}
          type="number"
          inputMode="numeric"
          placeholder="mL"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className={cn(inputClass, "font-mono tabular-nums")}
        />
        <ControlButton type="submit" className="h-9">
          Record
        </ControlButton>
      </form>
      <div className="flex gap-1.5">
        {presets.map((n) => (
          <ControlButton
            key={n}
            variant="ghost"
            className="h-8 flex-1 border border-border px-2"
            onClick={() => submit(n)}
          >
            +{n}
          </ControlButton>
        ))}
      </div>
      {error && <p className="text-[10px] text-status-review">{error}</p>}
    </div>
  );
}

function ClinicalTab({ state, actions }: { state: SimState; actions: SimActions }) {
  const sinceBirthS = DEMO_PATIENT.deliveryOffsetS + state.elapsed;
  const urineRate = Math.round(state.urineTotal / (sinceBirthS / 3600));
  const si = shockIndex(state.shown.hr, state.shown.sys);
  const siFlag = state.review.reasons.find((r) => r.param === "si")?.level ?? null;
  const t = DEMO_THRESHOLDS.si;
  const lastUrine = state.urineEntries[0];

  return (
    <div className="grid h-full gap-2 md:grid-cols-2 lg:grid-cols-[1.05fr_1.2fr_0.8fr_1fr]">
      <Card
        title="Uterine tone"
        aside={
          <span className="hidden text-[10px] text-muted-foreground min-[1100px]:inline">
            clinician entry
          </span>
        }
      >
        <div role="radiogroup" aria-label="Uterine tone" className="grid grid-cols-3 gap-1">
          {(["firm", "soft", "not_assessed"] as const).map((v) => {
            const active = state.tone.value === v;
            return (
              <button
                key={v}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => actions.setTone(v)}
                className={cn(
                  "h-10 rounded-md border text-[11px] font-semibold leading-tight transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  active
                    ? TONE_STYLE[v]
                    : "border-border text-muted-foreground hover:bg-accent/60 hover:text-foreground",
                )}
              >
                {TONE_LABEL[v]}
              </button>
            );
          })}
        </div>
        <p className="mt-auto pt-2 text-[10px] text-muted-foreground">
          Recorded <span className="font-mono">{formatShortClock(state.tone.wall)}</span> ·{" "}
          {state.tone.by === "scenario" ? "scenario record (fictional)" : "demo clinician"}
        </p>
      </Card>

      <Card
        title="Urine output"
        aside={<span className="text-[10px] text-muted-foreground">manual</span>}
      >
        <div className="mb-1.5 flex items-baseline gap-2">
          <span className="font-numeric text-[28px] font-medium leading-none tabular-nums">
            {state.urineTotal}
          </span>
          <span className="text-xs text-muted-foreground">mL</span>
          <span className="ml-auto font-mono text-[10px] text-muted-foreground">
            ≈ {urineRate} mL/h<span className="hidden min-[1100px]:inline"> since birth</span>
          </span>
        </div>
        <AmountForm
          id="urine-input"
          label="Add urine output in mL"
          onAdd={actions.addUrine}
          presets={[50, 100, 200]}
        />
        <p className="mt-auto truncate pt-1.5 text-[10px] text-muted-foreground">
          {lastUrine
            ? `Last: ${lastUrine.preset ? `${lastUrine.amount} mL scenario record` : `+${lastUrine.amount} mL`} · ${formatShortClock(lastUrine.wall)}`
            : "No entries"}
        </p>
      </Card>

      <Card title="Shock index" className={flagRing(siFlag)}>
        <span
          className={cn(
            "font-numeric text-[34px] font-medium leading-none tabular-nums",
            siFlag === "urgent"
              ? "text-status-urgent"
              : siFlag === "review"
                ? "text-status-review"
                : "text-foreground",
          )}
        >
          {si.toFixed(2)}
        </span>
        <span className="mt-1 flex items-center gap-1.5 text-[10px] text-muted-foreground">
          {siFlag && <FlagTag level={siFlag} />}
          calculated
        </span>
        <span className="mt-1 font-mono text-[10px] text-muted-foreground">
          HR ÷ SBP = {state.shown.hr} ÷ {state.shown.sys}
        </span>
        <span className="font-mono text-[10px] text-muted-foreground">
          ≥{t.review.toFixed(2)} review · ≥{t.urgent.toFixed(2)} urgent (demo)
        </span>
        <div className="relative mt-auto h-6">
          <Sparkline
            data={state.history.si}
            className="absolute inset-0 h-full text-muted-foreground"
          />
        </div>
      </Card>

      <Card
        title="Delivery"
        aside={
          <span className="rounded-sm border border-status-review/50 px-1 text-[9px] font-semibold uppercase tracking-wider text-status-review">
            Fictional
          </span>
        }
      >
        <div className="flex items-baseline justify-between">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Since birth
          </span>
          <span className="font-numeric text-base font-medium tabular-nums">
            {formatDuration(sinceBirthS)}
          </span>
        </div>
        <dl className="mt-1 text-[11px]">
          {[
            ["Type", DEMO_PATIENT.deliveryType],
            [
              "Time of birth",
              formatShortClock(state.sessionStart - DEMO_PATIENT.deliveryOffsetS * 1000),
            ],
            ["Gestation", DEMO_PATIENT.gestation],
            ["Placenta", DEMO_PATIENT.placenta],
            ["Blood group", DEMO_PATIENT.bloodGroup],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between gap-2 py-px">
              <dt className="text-muted-foreground">{k}</dt>
              <dd className="truncate text-right font-medium">{v}</dd>
            </div>
          ))}
        </dl>
      </Card>
    </div>
  );
}

function ObservationsTab({ state, actions }: { state: SimState; actions: SimActions }) {
  const [note, setNote] = useState("");
  return (
    <div className="grid h-full gap-2 lg:grid-cols-[1.4fr_1fr]">
      <Card
        title="Symptoms observed"
        aside={
          <span className="text-[10px] text-muted-foreground">recorded only · no prompts</span>
        }
      >
        <div className="grid grid-cols-2 gap-1.5 lg:grid-cols-3 xl:grid-cols-4">
          {SYMPTOMS.map((s) => {
            const on = state.symptoms.includes(s.id);
            return (
              <button
                key={s.id}
                type="button"
                aria-pressed={on}
                onClick={() => actions.toggleSymptom(s.id)}
                className={cn(
                  "h-9 rounded-md border px-2 text-left text-[11px] font-medium leading-tight transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  on
                    ? "border-status-review/70 bg-status-review/12 text-foreground"
                    : "border-border text-muted-foreground hover:bg-accent/60 hover:text-foreground",
                )}
              >
                {s.label}
              </button>
            );
          })}
        </div>
      </Card>
      <Card title="Nursing observations">
        <form
          className="flex gap-1.5"
          onSubmit={(e) => {
            e.preventDefault();
            if (!note.trim()) return;
            actions.addNote(note);
            setNote("");
          }}
        >
          <label htmlFor="note-input" className="sr-only">
            Add nursing observation
          </label>
          <input
            id="note-input"
            maxLength={200}
            placeholder="e.g. Fundus checked, lochia moderate"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className={inputClass}
          />
          <ControlButton type="submit" className="h-9 whitespace-nowrap" disabled={!note.trim()}>
            Add note
          </ControlButton>
        </form>
        <ul className="mt-1.5 min-h-0 flex-1 divide-y divide-border overflow-y-auto">
          {state.notes.length === 0 ? (
            <li className="py-3 text-center text-[11px] text-muted-foreground">No notes yet.</li>
          ) : (
            state.notes.map((n) => (
              <li key={n.id} className="flex gap-2 py-1 text-[11px]">
                <span className="shrink-0 font-mono text-[10px] text-muted-foreground">
                  {formatShortClock(n.wall)}
                </span>
                <span>{n.text}</span>
              </li>
            ))
          )}
        </ul>
      </Card>
    </div>
  );
}

function InterventionsTab({ state, actions }: { state: SimState; actions: SimActions }) {
  const [custom, setCustom] = useState("");
  return (
    <div className="grid h-full gap-2 lg:grid-cols-[1.5fr_1fr]">
      <Card
        title="Medication & interventions"
        aside={
          <span className="text-[10px] text-muted-foreground">
            record only · no dosing guidance
          </span>
        }
      >
        <div className="grid grid-cols-2 gap-1.5 lg:grid-cols-3 xl:grid-cols-4">
          {INTERVENTIONS.map((name) => (
            <ControlButton
              key={name}
              className="h-9 justify-start whitespace-normal px-2 text-left text-[11px] leading-tight"
              onClick={() => actions.addIntervention(name)}
            >
              {name}
            </ControlButton>
          ))}
        </div>
        <form
          className="mt-1.5 flex gap-1.5"
          onSubmit={(e) => {
            e.preventDefault();
            if (!custom.trim()) return;
            actions.addIntervention(custom);
            setCustom("");
          }}
        >
          <label htmlFor="intervention-input" className="sr-only">
            Other medication or intervention
          </label>
          <input
            id="intervention-input"
            maxLength={80}
            placeholder="Other (free text)"
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
            className={inputClass}
          />
          <ControlButton type="submit" className="h-9" disabled={!custom.trim()}>
            Record
          </ControlButton>
        </form>
      </Card>
      <Card
        title="Recorded"
        aside={
          <span className="font-mono text-[10px] text-muted-foreground">
            {state.interventions.length} entries
          </span>
        }
      >
        <ul className="min-h-0 flex-1 divide-y divide-border overflow-y-auto">
          {state.interventions.length === 0 ? (
            <li className="py-3 text-center text-[11px] text-muted-foreground">
              Nothing recorded yet.
            </li>
          ) : (
            state.interventions.map((n) => (
              <li key={n.id} className="flex gap-2 py-1 text-[11px]">
                <span className="shrink-0 font-mono text-[10px] text-muted-foreground">
                  {formatShortClock(n.wall)}
                </span>
                <span className="font-medium">{n.name}</span>
                <span className="ml-auto text-[10px] text-muted-foreground">demo user</span>
              </li>
            ))
          )}
        </ul>
      </Card>
    </div>
  );
}

function TrendsTab({ state }: { state: SimState }) {
  const h = state.history;
  const rows: { label: string; unit: string; data: number[]; color: string; dp?: number }[] = [
    { label: "HR", unit: "bpm", data: h.hr, color: "text-signal-hr" },
    { label: "SBP", unit: "mmHg", data: h.sys, color: "text-signal-nibp" },
    { label: "SpO₂", unit: "%", data: h.spo2, color: "text-signal-spo2" },
    { label: "RR", unit: "/min", data: h.rr, color: "text-signal-rr" },
    { label: "Temp", unit: "°C", data: h.temp, color: "text-signal-temp", dp: 1 },
    { label: "Shock index", unit: "", data: h.si, color: "text-muted-foreground", dp: 2 },
  ];
  return (
    <div className="grid h-full grid-cols-2 gap-2 lg:grid-cols-3">
      {rows.map((r) => {
        const last = r.data[r.data.length - 1] ?? 0;
        const fmt = (v: number) => v.toFixed(r.dp ?? 0);
        return (
          <section
            key={r.label}
            aria-label={`${r.label} trend`}
            className="flex min-h-0 flex-col rounded-md border border-border bg-background/40 px-2.5 py-1.5"
          >
            <div className="flex items-baseline justify-between gap-2">
              <span className={cn("text-xs font-semibold", r.color)}>
                {r.label}{" "}
                <span className="text-[10px] font-normal text-muted-foreground">{r.unit}</span>
              </span>
              <span className="font-mono text-[10px] text-muted-foreground">
                {fmt(Math.min(...r.data))}–{fmt(Math.max(...r.data))} · now{" "}
                <span className="text-foreground">{fmt(last)}</span>
              </span>
            </div>
            <div className="relative min-h-6 flex-1">
              <Sparkline data={r.data} className={cn("absolute inset-0 h-full", r.color)} />
            </div>
          </section>
        );
      })}
    </div>
  );
}

interface Props {
  state: SimState;
  actions: SimActions;
  open: boolean;
  tab: AdditionalTab;
  onOpenChange: (open: boolean) => void;
  onTabChange: (tab: AdditionalTab) => void;
  className?: string | undefined;
}

function SummaryChip({
  label,
  children,
  tone,
}: {
  label: string;
  children: ReactNode;
  tone?: "review" | "urgent" | null | undefined;
}) {
  return (
    <span
      className={cn(
        "inline-flex h-6 shrink-0 items-center gap-1 rounded-sm border px-1.5 text-[11px]",
        tone === "urgent"
          ? "border-status-urgent/70 text-status-urgent"
          : tone === "review"
            ? "border-status-review/70 text-status-review"
            : "border-border",
      )}
    >
      <span className="text-[9px] uppercase tracking-wider text-muted-foreground">{label}</span>
      <span className="font-medium tabular-nums">{children}</span>
    </span>
  );
}

export function AdditionalPanel({
  state,
  actions,
  open,
  tab,
  onOpenChange,
  onTabChange,
  className,
}: Props) {
  const si = shockIndex(state.shown.hr, state.shown.sys);
  const siFlag = state.review.reasons.find((r) => r.param === "si")?.level ?? null;
  const pending = state.alerts.filter((a) => !a.acknowledged).length;
  const Chevron = open ? ChevronDown : ChevronUp;

  return (
    <section
      aria-label="Additional monitoring"
      className={cn(
        "flex min-h-10 flex-col overflow-hidden rounded-md border border-border bg-card",
        className,
      )}
    >
      <button
        type="button"
        aria-expanded={open}
        aria-controls="additional-body"
        onClick={() => onOpenChange(!open)}
        className="flex h-10 shrink-0 items-center gap-2 px-3 text-left transition-colors hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
      >
        <ClipboardList className="size-4 shrink-0 text-muted-foreground" aria-hidden />
        <span className="label-caps shrink-0">Additional monitoring</span>
        <span className="flex h-6 min-w-0 flex-1 flex-wrap gap-1.5 overflow-hidden pl-1">
          <SummaryChip label="Tone" tone={state.tone.value === "soft" ? "review" : null}>
            {TONE_LABEL[state.tone.value]}
          </SummaryChip>
          <SummaryChip label="Urine">{state.urineTotal} mL</SummaryChip>
          <SummaryChip label="SI" tone={siFlag}>
            {si.toFixed(2)}
          </SummaryChip>
          <SummaryChip label="Since birth">
            {formatDuration(DEMO_PATIENT.deliveryOffsetS + state.elapsed)}
          </SummaryChip>
          <SummaryChip label="Symptoms">{state.symptoms.length}</SummaryChip>
          <SummaryChip label="Interventions">{state.interventions.length}</SummaryChip>
          {pending > 0 && <SummaryChip label="Alerts">{pending} unack.</SummaryChip>}
        </span>
        <span className="flex shrink-0 items-center gap-1 text-[11px] text-muted-foreground">
          {open ? "Collapse" : "Expand"}
          <Chevron className="size-4" aria-hidden />
        </span>
      </button>

      {open && (
        <div
          id="additional-body"
          className="flex min-h-0 flex-col border-t border-border lg:h-[252px] lg:shrink"
        >
          <div
            role="tablist"
            aria-label="Additional monitoring sections"
            className="flex shrink-0 gap-0.5 overflow-x-auto border-b border-border px-2"
          >
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={tab === t.id}
                onClick={() => onTabChange(t.id)}
                className={cn(
                  "-mb-px h-9 shrink-0 border-b-2 px-2.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
                  tab === t.id
                    ? "border-primary text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground",
                )}
              >
                {t.label}
                {t.id === "alerts" && pending > 0 && (
                  <span className="ml-1.5 rounded-sm bg-status-review px-1 font-mono text-[10px] text-status-review-foreground">
                    {pending}
                  </span>
                )}
              </button>
            ))}
            {tab === "alerts" && pending > 0 && (
              <ControlButton
                size="sm"
                variant="ghost"
                className="my-auto ml-auto h-7"
                onClick={actions.acknowledgeAll}
              >
                Acknowledge all
              </ControlButton>
            )}
          </div>
          <div
            role="tabpanel"
            className={cn(
              "min-h-0 flex-1 overflow-y-auto",
              tab !== "alerts" && tab !== "log" && "p-2",
            )}
          >
            {tab === "clinical" && <ClinicalTab state={state} actions={actions} />}
            {tab === "observations" && <ObservationsTab state={state} actions={actions} />}
            {tab === "interventions" && <InterventionsTab state={state} actions={actions} />}
            {tab === "trends" && <TrendsTab state={state} />}
            {tab === "alerts" && <AlertList alerts={state.alerts} onAck={actions.acknowledge} />}
            {tab === "log" && <EventList events={state.events} />}
          </div>
        </div>
      )}
    </section>
  );
}
