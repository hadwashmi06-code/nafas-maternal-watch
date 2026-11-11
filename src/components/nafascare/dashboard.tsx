import { useNafasSimulation } from "@/hooks/use-nafas-simulation";

import { AlertHistory } from "./alert-history";
import { EventLog } from "./event-log";
import { MonitorScreen } from "./monitor-screen";
import { Sidebar } from "./sidebar";
import { SimulationStrip, TopBar } from "./top-bar";

export function NafasDashboard() {
  const { state, actions } = useNafasSimulation();

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground xl:h-screen xl:overflow-hidden">
      <TopBar status={state.status} sensors={state.sensors} />
      <SimulationStrip />

      <main className="grid flex-1 gap-3 p-3 xl:min-h-0 xl:grid-cols-[224px_minmax(0,1fr)]">
        <Sidebar
          sessionStart={state.sessionStart}
          sensors={state.sensors}
          status={state.status}
          scenario={state.scenario}
          elapsed={state.elapsed}
          onPlay={actions.start}
          onPause={actions.pause}
          onReset={actions.reset}
          onScenario={actions.setScenario}
        />

        <div className="flex flex-col gap-3 xl:min-h-0">
          <MonitorScreen state={state} onAddEbl={actions.addEbl} className="min-h-[640px] xl:min-h-0 xl:flex-1" />
          <div className="grid shrink-0 gap-3 lg:grid-cols-2">
            <AlertHistory
              alerts={state.alerts}
              onAck={actions.acknowledge}
              onAckAll={actions.acknowledgeAll}
              className="h-[196px]"
            />
            <EventLog events={state.events} className="h-[196px]" />
          </div>
        </div>
      </main>
    </div>
  );
}
