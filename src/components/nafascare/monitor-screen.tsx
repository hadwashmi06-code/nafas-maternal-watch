import { useEffect, useState, type ReactNode } from "react";

import type { RunStatus, SimState } from "@/hooks/use-nafas-simulation";
import { EhgSynth } from "@/lib/nafascare/ehg";
import { formatShortClock } from "@/lib/nafascare/format";
import { DEMO_THRESHOLDS, type ReviewParam } from "@/lib/nafascare/review-rules";
import { SCENARIOS, SENSOR_INFO } from "@/lib/nafascare/scenarios";
import { EcgSynth, PlethSynth } from "@/lib/nafascare/waveforms";
import { cn } from "@/lib/utils";

import { SourceChip, Sparkline, VitalTile } from "./param-box";
import { SweepTrace } from "./sweep-trace";

const EHG_WINDOW_S = 24;
const FAST_WINDOW_S = 5;

function StatusOverlay({ status, small = false }: { status: RunStatus; small?: boolean }) {
  if (status === "standby" && !small) {
    return (
      <span className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-1 font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
        Standby
        <span className="text-[10px] normal-case tracking-normal">
          Press Play Demo to start the simulated stream
        </span>
      </span>
    );
  }
  if (status === "paused" && !small) {
    return (
      <span className="pointer-events-none absolute bottom-2 right-2 rounded-sm border border-status-review/60 px-1.5 py-px font-mono text-[10px] font-semibold text-status-review">
        PAUSED
      </span>
    );
  }
  return null;
}

function Readout({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <dt className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}

interface Props {
  state: SimState;
  className?: string | undefined;
}

/** EHG trace + essential vitals. Remounted on session reset (keyed by sessionId) so all traces clear. */
function MonitorBody({ state, className }: Props) {
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

  const flag = (param: ReviewParam) =>
    state.review.reasons.find((r) => r.param === param)?.level ?? null;
  const t = DEMO_THRESHOLDS;
  const p = scenario.ehg;
  const ehgSensor = state.sensors.ehg;
  const map = Math.round((state.shown.sys + 2 * state.shown.dia) / 3);
  const s = state.sensors;

  return (
    <div className={cn("flex min-h-0 flex-col gap-2", className)}>
      {/* EHG — main trace */}
      <section
        aria-label="Simulated EHG"
        className="grid min-h-[160px] flex-1 grid-cols-1 overflow-hidden rounded-md border border-border bg-panel-inset md:grid-cols-[minmax(0,1fr)_188px] xl:grid-cols-[minmax(0,1fr)_212px]"
      >
        <div className="relative min-h-[160px] overflow-hidden">
          <SweepTrace
            source={ehg}
            status={state.status}
            windowS={EHG_WINDOW_S}
            min={-1.2}
            max={1.2}
            colorVar="--signal-ehg"
            grid
            label="Simulated EHG waveform"
          />
          <div className="pointer-events-none absolute inset-x-2.5 top-1.5 flex items-center justify-between gap-2">
            <span className="font-mono text-[11px] font-semibold tracking-wider text-signal-ehg">
              SIMULATED EHG · uterine electrical activity
            </span>
            <span className="flex gap-1.5 font-mono text-[9px] text-muted-foreground">
              {[`${EHG_WINDOW_S} s`, "0.3 mV/div", "Time-compressed"].map((c) => (
                <span key={c} className="rounded-sm border border-border bg-panel-inset px-1 py-px">
                  {c}
                </span>
              ))}
            </span>
          </div>
          <p className="pointer-events-none absolute bottom-1.5 left-2.5 right-16 truncate text-[10px] text-muted-foreground">
            Research-concept signal · not a measure of blood loss · not a validated predictor or
            diagnostic for PPH
          </p>
          <StatusOverlay status={state.status} />
        </div>
        <div className="flex min-h-0 flex-col overflow-hidden border-t border-border px-3 py-2 md:border-l md:border-t-0">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold tracking-wide text-signal-ehg">
              EHG readouts
            </span>
            <SourceChip state={ehgSensor.state}>{SENSOR_INFO.ehg.short}</SourceChip>
          </div>
          <dl className="mt-1.5 grid grid-cols-2 gap-x-3 gap-y-1.5">
            <Readout label="Burst interval">
              <span className="font-numeric text-[26px] font-medium leading-tight text-signal-ehg tabular-nums">
                {p.period}
                <span className="ml-0.5 text-xs text-muted-foreground">s</span>
              </span>
            </Readout>
            <Readout label="Peak amp.">
              <span className="font-numeric text-[26px] font-medium leading-tight text-signal-ehg tabular-nums">
                {(p.amplitude * 0.9).toFixed(2)}
                <span className="ml-0.5 text-xs text-muted-foreground">mV</span>
              </span>
            </Readout>
            <Readout label="Pattern (sim)" className="col-span-2">
              <span className="text-xs font-medium">{scenario.ehgPattern}</span>
            </Readout>
            <Readout label="Signal quality" className="col-span-2">
              <span
                className={cn(
                  "text-xs font-medium",
                  ehgSensor.state === "connected" ? "text-status-ok" : "text-status-review",
                )}
              >
                {ehgSensor.note}
              </span>
            </Readout>
          </dl>
        </div>
      </section>

      {/* Essential vital signs */}
      <div className="grid shrink-0 grid-cols-2 gap-px overflow-hidden rounded-md border border-border bg-border sm:grid-cols-3 lg:h-[132px] lg:grid-cols-[1fr_1.45fr_1fr_0.9fr_0.9fr]">
        <VitalTile
          label="HR"
          unit="bpm"
          source={SENSOR_INFO.ecg.short}
          sourceState={s.ecg.state}
          colorClass="text-signal-hr"
          flag={flag("hr")}
          value={state.shown.hr}
          limits={[`≥${t.hr.review} rev`, `≥${t.hr.urgent} urg`]}
          strip={
            <SweepTrace
              source={ecg}
              status={state.status}
              windowS={FAST_WINDOW_S}
              min={-0.45}
              max={1.15}
              colorVar="--signal-hr"
              label="Simulated ECG waveform"
            />
          }
        />
        <VitalTile
          label="NIBP"
          unit="mmHg"
          source={SENSOR_INFO.nibp.short}
          sourceState={s.nibp.state}
          colorClass="text-signal-nibp"
          flag={flag("sys")}
          value={
            <>
              {state.shown.sys}
              <span className="text-muted-foreground">/</span>
              {state.shown.dia}
              <span className="ml-1.5 text-lg text-muted-foreground">({map})</span>
            </>
          }
          limits={[`SBP <${t.sys.review} rev`, `SBP <${t.sys.urgent} urg`]}
          compactLimits
          meta={`last ${formatShortClock(state.nibpWall)}`}
          strip={
            <Sparkline
              data={state.history.sys}
              className="absolute inset-0 h-full text-signal-nibp"
            />
          }
        />
        <VitalTile
          label="SpO₂"
          unit="%"
          source="Oximeter"
          sourceState={s.spo2.state}
          colorClass="text-signal-spo2"
          flag={flag("spo2")}
          value={state.shown.spo2}
          limits={[`<${t.spo2.review} rev`, `<${t.spo2.urgent} urg`]}
          strip={
            <SweepTrace
              source={pleth}
              status={state.status}
              windowS={FAST_WINDOW_S}
              min={-0.2}
              max={1.15}
              colorVar="--signal-spo2"
              label="Simulated plethysmograph waveform"
            />
          }
        />
        <VitalTile
          label="RR"
          unit="/min"
          source="ECG (impedance)"
          sourceState={s.ecg.state}
          colorClass="text-signal-rr"
          flag={flag("rr")}
          value={state.shown.rr}
          limits={[`≥${t.rr.review} rev`, `≥${t.rr.urgent} urg`]}
          strip={
            <Sparkline data={state.history.rr} className="absolute inset-0 h-full text-signal-rr" />
          }
        />
        <VitalTile
          label="Temp"
          unit="°C"
          source={SENSOR_INFO.temp.short}
          sourceState={s.temp.state}
          colorClass="text-signal-temp"
          flag={flag("temp")}
          value={state.shown.temp.toFixed(1)}
          limits={[`≥${t.temp.review.toFixed(1)} rev`, `≥${t.temp.urgent.toFixed(1)} urg`]}
          compactLimits
          strip={
            <Sparkline
              data={state.history.temp}
              className="absolute inset-0 h-full text-signal-temp"
            />
          }
        />
      </div>
    </div>
  );
}

export function MonitorScreen({ state, className }: Props) {
  return <MonitorBody key={state.sessionId} state={state} className={className} />;
}
