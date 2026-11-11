import { AlertTriangle, CheckCircle2, OctagonAlert } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";

import type { RunStatus, SimState } from "@/hooks/use-nafas-simulation";
import { EhgSynth } from "@/lib/nafascare/ehg";
import { formatClock } from "@/lib/nafascare/format";
import { DEMO_THRESHOLDS, type ReviewParam, type ReviewResult } from "@/lib/nafascare/review-rules";
import { SCENARIOS } from "@/lib/nafascare/scenarios";
import { EcgSynth, PlethSynth } from "@/lib/nafascare/waveforms";
import { cn } from "@/lib/utils";

import { EblBox } from "./ebl-box";
import { ParamBox, Sparkline } from "./param-box";
import { SweepTrace } from "./sweep-trace";

const EHG_WINDOW_S = 24;
const FAST_WINDOW_S = 6;

/* ---------- Alarm / review message bar ---------- */

const ALARM = {
  none: { box: "bg-status-ok/8", icon: "text-status-ok", title: "No review prompts active" },
  review: { box: "bg-status-review/14", icon: "text-status-review", title: "Clinical review suggested" },
  urgent: { box: "bg-status-urgent/18", icon: "text-status-urgent", title: "Urgent clinical review suggested" },
} as const;

function AlarmBar({ review }: { review: ReviewResult }) {
  const st = ALARM[review.level];
  const Icon = review.level === "urgent" ? OctagonAlert : review.level === "review" ? AlertTriangle : CheckCircle2;
  return (
    <div role="status" aria-live="polite" className={cn("flex h-11 shrink-0 items-center gap-3 border-b border-border px-3", st.box)}>
      <Icon className={cn("size-4.5 shrink-0", st.icon)} aria-hidden />
      <h2 className={cn("shrink-0 text-sm font-semibold", review.level !== "none" && st.icon)}>{st.title}</h2>
      {review.level === "none" ? (
        <span className="truncate text-xs text-muted-foreground">Monitored and recorded values within configured demo ranges</span>
      ) : (
        <ul className="flex min-w-0 flex-1 gap-1.5 overflow-hidden" aria-label="Review reasons">
          {review.reasons.map((r) => (
            <li
              key={r.key}
              title={r.message}
              className={cn(
                "shrink-0 rounded-sm px-1.5 py-0.5 font-mono text-[11px] font-medium",
                r.level === "urgent" ? "bg-status-urgent text-status-urgent-foreground" : "bg-status-review text-status-review-foreground",
              )}
            >
              {r.short}
            </li>
          ))}
        </ul>
      )}
      <div className="ml-auto shrink-0 text-right text-[10px] leading-tight text-muted-foreground">
        <div className="uppercase tracking-wider">Demo thresholds · not medically validated</div>
        <div>Prompt only — assessment remains with the clinical team</div>
      </div>
    </div>
  );
}

/* ---------- Trace rows ---------- */

function TraceCell({
  status,
  label,
  labelClass,
  chips,
  children,
  className,
}: {
  status: RunStatus;
  label: string;
  labelClass: string;
  chips?: string[] | undefined;
  children: ReactNode;
  className?: string | undefined;
}) {
  return (
    <div className={cn("relative min-h-0 overflow-hidden border-b border-border", className)}>
      {children}
      <span className={cn("pointer-events-none absolute left-2.5 top-1.5 font-mono text-[10px] font-semibold tracking-wider", labelClass)}>
        {label}
      </span>
      {chips && (
        <div className="pointer-events-none absolute right-2 top-1.5 flex gap-1.5 font-mono text-[9px] text-muted-foreground">
          {chips.map((c) => (
            <span key={c} className="rounded-sm border border-border bg-panel-inset px-1 py-px">
              {c}
            </span>
          ))}
        </div>
      )}
      {status === "standby" && (
        <span className="pointer-events-none absolute inset-0 flex items-center justify-center font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
          Standby
        </span>
      )}
      {status === "paused" && (
        <span className="pointer-events-none absolute bottom-1.5 right-2 rounded-sm border border-status-review/60 px-1.5 py-px font-mono text-[10px] font-semibold text-status-review">
          PAUSED
        </span>
      )}
    </div>
  );
}

interface TracesProps {
  state: SimState;
  flag: (p: ReviewParam) => "review" | "urgent" | null;
}

/** Remounted on session reset (keyed by sessionId) so all traces clear. */
function MonitorTraces({ state, flag }: TracesProps) {
  const scenario = SCENARIOS[state.scenario];
  const hr = state.shown.hr;
  const artefact = state.sensors.spo2.state === "degraded" ? 0.35 : 0;
  const [ehg] = useState(() => new EhgSynth(scenario.ehg));
  const [ecg] = useState(() => new EcgSynth(hr));
  const [pleth] = useState(() => new PlethSynth(hr, scenario.plethAmplitude));

  useEffect(() => ehg.setTarget(scenario.ehg), [ehg, scenario.ehg]);
  useEffect(() => ecg.setRate(hr), [ecg, hr]);
  useEffect(() => {
    pleth.setRate(hr);
    pleth.setSignal(scenario.plethAmplitude, artefact);
  }, [pleth, hr, scenario.plethAmplitude, artefact]);

  const t = DEMO_THRESHOLDS;
  const ehgSensor = state.sensors.ehg;
  const p = scenario.ehg;

  return (
    <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)_240px] grid-rows-[minmax(150px,2fr)_minmax(88px,1fr)_minmax(88px,1fr)]">
      {/* EHG */}
      <TraceCell
        status={state.status}
        label="SIMULATED EHG · Ch 1–2"
        labelClass="text-signal-ehg"
        chips={[`${EHG_WINDOW_S} s`, "0.3 mV/div", "Time-compressed"]}
      >
        <SweepTrace source={ehg} status={state.status} windowS={EHG_WINDOW_S} min={-1.2} max={1.2} colorVar="--signal-ehg" grid label="Simulated EHG waveform" />
      </TraceCell>
      <section aria-label="Simulated EHG readouts" className="flex min-h-0 flex-col overflow-hidden border-b border-l border-border px-3 py-2">
        <div className="flex items-baseline justify-between text-signal-ehg">
          <span className="text-xs font-semibold tracking-wide">Simulated EHG</span>
          <span className="text-[10px] opacity-75">uterine electrical activity</span>
        </div>
        <dl className="mt-1.5 grid grid-cols-2 gap-x-3 gap-y-2">
          <div>
            <dt className="text-[10px] uppercase tracking-wider text-muted-foreground">Burst interval</dt>
            <dd className="font-numeric text-2xl font-medium leading-tight text-signal-ehg tabular-nums">
              {p.period}
              <span className="ml-0.5 text-xs text-muted-foreground">s</span>
            </dd>
          </div>
          <div>
            <dt className="text-[10px] uppercase tracking-wider text-muted-foreground">Peak amp.</dt>
            <dd className="font-numeric text-2xl font-medium leading-tight text-signal-ehg tabular-nums">
              {(p.amplitude * 0.9).toFixed(2)}
              <span className="ml-0.5 text-xs text-muted-foreground">mV</span>
            </dd>
          </div>
          <div className="col-span-2">
            <dt className="text-[10px] uppercase tracking-wider text-muted-foreground">Pattern (sim)</dt>
            <dd className="text-xs font-medium">{scenario.ehgPattern}</dd>
          </div>
          <div className="col-span-2">
            <dt className="text-[10px] uppercase tracking-wider text-muted-foreground">Signal quality</dt>
            <dd className={cn("text-xs font-medium", ehgSensor.state === "connected" ? "text-status-ok" : "text-status-review")}>
              {ehgSensor.note}
            </dd>
          </div>
        </dl>
        <p className="mt-auto pt-2 text-[10px] leading-snug text-muted-foreground">
          Synthetic research-concept signal. Not a measure of blood loss; not a validated PPH diagnostic.
        </p>
      </section>

      {/* ECG / HR */}
      <TraceCell status={state.status} label="ECG II · SIM" labelClass="text-signal-hr" chips={["25 mm/s"]}>
        <SweepTrace source={ecg} status={state.status} windowS={FAST_WINDOW_S} min={-0.45} max={1.15} colorVar="--signal-hr" label="Simulated ECG waveform" />
      </TraceCell>
      <ParamBox
        label="HR"
        unit="bpm"
        source="ECG"
        colorClass="text-signal-hr"
        flag={flag("hr")}
        value={state.shown.hr}
        limits={[`≥${t.hr.review} review`, `≥${t.hr.urgent} urgent`]}
        className="border-b border-l border-border"
      />

      {/* Pleth / SpO2 */}
      <TraceCell status={state.status} label="PLETH · SIM" labelClass="text-signal-spo2" className="border-b-0">
        <SweepTrace source={pleth} status={state.status} windowS={FAST_WINDOW_S} min={-0.2} max={1.15} colorVar="--signal-spo2" label="Simulated plethysmograph waveform" />
      </TraceCell>
      <ParamBox
        label="SpO₂"
        unit="%"
        source="PLETH"
        colorClass="text-signal-spo2"
        flag={flag("spo2")}
        value={state.shown.spo2}
        limits={[`<${t.spo2.review} review`, `<${t.spo2.urgent} urgent`]}
        className="border-l border-border"
      />
    </div>
  );
}

/* ---------- Monitor screen ---------- */

interface MonitorScreenProps {
  state: SimState;
  onAddEbl: (amount: number) => void;
  className?: string | undefined;
}

export function MonitorScreen({ state, onAddEbl, className }: MonitorScreenProps) {
  const flag = (param: ReviewParam) => state.review.reasons.find((r) => r.param === param)?.level ?? null;
  const t = DEMO_THRESHOLDS;
  const map = Math.round((state.shown.sys + 2 * state.shown.dia) / 3);

  return (
    <section aria-label="Patient monitor" className={cn("flex min-h-0 flex-col overflow-hidden rounded-md border border-border bg-panel-inset", className)}>
      <AlarmBar review={state.review} />
      <MonitorTraces key={state.sessionId} state={state} flag={flag} />

      <div className="grid shrink-0 grid-cols-1 border-t border-border md:grid-cols-[1fr_1.35fr_0.9fr]">
        <ParamBox
          label="NIBP"
          unit="mmHg"
          source="CUFF"
          colorClass="text-signal-nibp"
          size="lg"
          flag={flag("sys")}
          value={
            <>
              {state.shown.sys}
              <span className="text-muted-foreground">/</span>
              {state.shown.dia}
              <span className="ml-2 text-2xl text-muted-foreground">({map})</span>
            </>
          }
          limits={[`SBP <${t.sys.review} review`, `SBP <${t.sys.urgent} urgent`]}
          meta={
            <>
              Last cycle <span className="font-mono">{formatClock(state.nibpWall)}</span> · q10 s (demo)
            </>
          }
          className="min-h-[108px]"
        />
        <EblBox
          total={state.eblTotal}
          entries={state.eblEntries}
          flag={flag("ebl")}
          onAdd={onAddEbl}
          className="border-t border-border md:border-l md:border-t-0"
        />
        <section aria-label="Trends" className="flex flex-col gap-1 border-t border-border px-3 py-2 md:border-l md:border-t-0">
          <div className="flex items-baseline justify-between">
            <span className="text-xs font-semibold tracking-wide text-muted-foreground">Trends</span>
            <span className="text-[10px] text-muted-foreground">last 2 min</span>
          </div>
          <div className="grid grid-cols-[34px_1fr] items-center gap-x-2">
            <span className="font-mono text-[10px] text-signal-hr">HR</span>
            <Sparkline data={state.history.hr} className="text-signal-hr" />
            <span className="font-mono text-[10px] text-signal-spo2">SpO₂</span>
            <Sparkline data={state.history.spo2} className="text-signal-spo2" />
            <span className="font-mono text-[10px] text-signal-nibp">SBP</span>
            <Sparkline data={state.history.sys} className="text-signal-nibp" />
          </div>
        </section>
      </div>
    </section>
  );
}
