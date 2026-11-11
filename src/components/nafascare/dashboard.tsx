import { useNafasSimulation } from "@/hooks/use-nafas-simulation";
import { formatClock } from "@/lib/nafascare/format";
import { DEMO_THRESHOLDS, type ReviewParam } from "@/lib/nafascare/review-rules";
import { SCENARIOS } from "@/lib/nafascare/scenarios";

import { AlertHistory } from "./alert-history";
import { ControlBar } from "./control-bar";
import { EblTile } from "./ebl-tile";
import { EhgPanel } from "./ehg-panel";
import { EventLog } from "./event-log";
import { PatientPanel, SensorPanel } from "./patient-panel";
import { ReviewBanner } from "./review-banner";
import { SimulationStrip, TopBar } from "./top-bar";
import { VitalTile } from "./vital-tile";

export function NafasDashboard() {
  const { state, actions } = useNafasSimulation();
  const scenario = SCENARIOS[state.scenario];
  const flag = (param: ReviewParam) => state.review.reasons.find((r) => r.param === param)?.level ?? null;
  const t = DEMO_THRESHOLDS;
  const map = Math.round((state.shown.sys + 2 * state.shown.dia) / 3);

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground xl:h-screen xl:overflow-hidden">
      <TopBar status={state.status} sensors={state.sensors} />
      <SimulationStrip />
      <ControlBar
        status={state.status}
        scenario={state.scenario}
        elapsed={state.elapsed}
        onPlay={actions.start}
        onPause={actions.pause}
        onReset={actions.reset}
        onScenario={actions.setScenario}
      />

      <main className="grid flex-1 gap-3 p-3 xl:min-h-0 xl:grid-cols-[260px_minmax(0,1fr)_320px]">
        <div className="flex flex-col gap-3 xl:min-h-0">
          <PatientPanel sessionStart={state.sessionStart} elapsed={state.elapsed} className="xl:flex-1" />
          <SensorPanel sensors={state.sensors} />
        </div>

        <div className="flex flex-col gap-3 xl:min-h-0">
          <ReviewBanner review={state.review} />
          <EhgPanel
            status={state.status}
            scenario={scenario}
            sensor={state.sensors.ehg}
            sessionId={state.sessionId}
            className="h-[380px] xl:h-auto xl:flex-1"
          />
          <div className="grid shrink-0 grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_1.2fr_1fr_1.4fr]">
            <VitalTile
              label="Heart rate"
              unit="bpm"
              source="ECG"
              flag={flag("hr")}
              valueClassName="text-signal-hr"
              value={state.shown.hr}
              history={state.history.hr}
              limits={`Demo prompts ≥${t.hr.review} · ≥${t.hr.urgent}`}
            />
            <VitalTile
              label="Blood pressure"
              unit="mmHg · NIBP"
              source="NIBP"
              flag={flag("sys")}
              valueClassName="text-signal-nibp"
              value={
                <>
                  {state.shown.sys}
                  <span className="text-muted-foreground">/</span>
                  {state.shown.dia}
                </>
              }
              meta={
                <>
                  MAP {map} · last cycle <span className="font-mono">{formatClock(state.nibpWall)}</span>
                </>
              }
              history={state.history.sys}
              limits={`Demo prompts SBP <${t.sys.review} · <${t.sys.urgent}`}
            />
            <VitalTile
              label="SpO₂"
              unit="%"
              source="PLETH"
              flag={flag("spo2")}
              valueClassName="text-signal-spo2"
              value={state.shown.spo2}
              history={state.history.spo2}
              limits={`Demo prompts <${t.spo2.review} · <${t.spo2.urgent}`}
            />
            <EblTile total={state.eblTotal} entries={state.eblEntries} flag={flag("ebl")} onAdd={actions.addEbl} />
          </div>
        </div>

        <div className="flex flex-col gap-3 xl:min-h-0">
          <AlertHistory
            alerts={state.alerts}
            onAck={actions.acknowledge}
            onAckAll={actions.acknowledgeAll}
            className="h-[320px] xl:h-auto xl:flex-1"
          />
          <EventLog events={state.events} className="h-[320px] xl:h-auto xl:flex-1" />
        </div>
      </main>
    </div>
  );
}
