import { useState } from "react";

import { useNafasSimulation } from "@/hooks/use-nafas-simulation";

import { AdditionalPanel, type AdditionalTab } from "./additional-panel";
import { AlertPanel } from "./alert-panel";
import { BloodLossPanel } from "./blood-loss-panel";
import { DemoControls } from "./demo-controls";
import { DevicePanel } from "./device-panel";
import { MonitorScreen } from "./monitor-screen";
import { SimulationStrip, TopBar } from "./top-bar";

/**
 * Single-screen layout tuned for iPad landscape (1024–1194 px wide) and up.
 * Below the lg breakpoint it stacks and scrolls.
 */
export function NafasDashboard() {
  const { state, actions } = useNafasSimulation();
  const [moreOpen, setMoreOpen] = useState(false);
  const [moreTab, setMoreTab] = useState<AdditionalTab>("clinical");
  const eblFlag = state.review.reasons.find((r) => r.param === "ebl")?.level ?? null;

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground lg:h-dvh lg:overflow-hidden">
      <TopBar status={state.status} elapsed={state.elapsed} />
      <SimulationStrip />

      <main className="grid flex-1 gap-2 p-2 lg:min-h-0 lg:grid-cols-[minmax(0,1fr)_272px] xl:grid-cols-[minmax(0,1fr)_304px]">
        <div className="flex min-w-0 flex-col gap-2 lg:min-h-0">
          <AlertPanel
            review={state.review}
            alerts={state.alerts}
            onAckAll={actions.acknowledgeAll}
            onShowHistory={() => {
              setMoreTab("alerts");
              setMoreOpen(true);
            }}
          />
          <MonitorScreen state={state} className="lg:min-h-[300px] lg:flex-1" />
          <AdditionalPanel
            state={state}
            actions={actions}
            open={moreOpen}
            tab={moreTab}
            onOpenChange={setMoreOpen}
            onTabChange={setMoreTab}
          />
        </div>

        <aside
          aria-label="Documentation, devices and demo controls"
          className="flex flex-col gap-2 lg:min-h-0 lg:overflow-y-auto"
        >
          <BloodLossPanel
            key={state.sessionId}
            total={state.eblTotal}
            entries={state.eblEntries}
            flag={eblFlag}
            onAdd={actions.addEbl}
          />
          <DevicePanel status={state.status} patch={state.patch} sensors={state.sensors} />
          <DemoControls
            status={state.status}
            scenario={state.scenario}
            elapsed={state.elapsed}
            onPlay={actions.start}
            onPause={actions.pause}
            onReset={actions.reset}
            onScenario={actions.setScenario}
            className="lg:mt-auto"
          />
        </aside>
      </main>
    </div>
  );
}
