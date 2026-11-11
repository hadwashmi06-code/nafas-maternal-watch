import { useCallback, useEffect, useMemo, useReducer } from "react";

import { evaluateReview, type ReviewResult } from "@/lib/nafascare/review-rules";
import {
  SCENARIOS,
  SENSOR_IDS,
  SENSOR_INFO,
  type ScenarioId,
  type ScenarioVitals,
  type SensorId,
  type SensorReading,
} from "@/lib/nafascare/scenarios";

export type RunStatus = "standby" | "running" | "paused";
export type EventCategory = "SYSTEM" | "SCENARIO" | "ALERT" | "EBL" | "SENSOR" | "USER";
export type AlertSeverity = "review" | "urgent" | "technical" | "info";

export interface LogEvent {
  id: number;
  wall: number;
  elapsed: number;
  category: EventCategory;
  text: string;
}

export interface AlertItem {
  id: number;
  wall: number;
  severity: AlertSeverity;
  title: string;
  detail: string;
  acknowledged: boolean;
  ackWall?: number;
}

export interface EblEntry {
  id: number;
  wall: number;
  amount: number;
  kind: "preset" | "manual";
}

export interface SimState {
  sessionId: number;
  sessionStart: number;
  status: RunStatus;
  scenario: ScenarioId;
  elapsed: number;
  base: ScenarioVitals;
  shown: ScenarioVitals;
  nibpWall: number;
  history: { hr: number[]; spo2: number[]; sys: number[] };
  eblTotal: number;
  eblEntries: EblEntry[];
  sensors: Record<SensorId, SensorReading>;
  activeKeys: string[];
  review: ReviewResult;
  alerts: AlertItem[];
  events: LogEvent[];
  seq: number;
}

type Action =
  | { type: "start"; now: number }
  | { type: "pause"; now: number }
  | { type: "reset"; now: number; seed: number[] }
  | { type: "scenario"; id: ScenarioId; now: number }
  | { type: "tick"; now: number; rnd: [number, number, number, number] }
  | { type: "ebl"; amount: number; now: number }
  | { type: "ack"; id: number; now: number }
  | { type: "ackAll"; now: number };

export const NIBP_INTERVAL_S = 10;
const HISTORY_LEN = 120;

const pushCapped = (arr: number[], v: number, cap = HISTORY_LEN) => {
  const next = arr.length >= cap ? arr.slice(arr.length - cap + 1) : arr.slice();
  next.push(v);
  return next;
};

function addEvent(s: SimState, now: number, category: EventCategory, text: string) {
  s.seq += 1;
  s.events = [{ id: s.seq, wall: now, elapsed: s.elapsed, category, text }, ...s.events].slice(0, 300);
}

function addAlert(s: SimState, now: number, severity: AlertSeverity, title: string, detail: string) {
  s.seq += 1;
  s.alerts = [{ id: s.seq, wall: now, severity, title, detail, acknowledged: false }, ...s.alerts].slice(0, 100);
}

function applyReview(s: SimState, now: number) {
  const result = evaluateReview({
    hr: Math.round(s.base.hr),
    sys: s.shown.sys,
    spo2: Math.round(s.base.spo2),
    ebl: s.eblTotal,
  });
  const keys = result.reasons.map((r) => r.key);
  for (const r of result.reasons) {
    if (s.activeKeys.includes(r.key)) continue;
    const title = r.level === "urgent" ? "Urgent clinical review suggested" : "Clinical review suggested";
    addAlert(s, now, r.level, title, r.message);
    addEvent(s, now, "ALERT", `${title} — ${r.message}`);
  }
  if (s.activeKeys.length > 0 && keys.length === 0) {
    addAlert(s, now, "info", "Review prompts cleared", "Monitored values back within demo ranges.");
    addEvent(s, now, "ALERT", "Review prompts cleared — values within demo ranges");
  }
  s.activeKeys = keys;
  s.review = result;
}

function clone(state: SimState): SimState {
  return {
    ...state,
    base: { ...state.base },
    shown: { ...state.shown },
    history: { ...state.history },
  };
}

function createInitialState(now: number, sessionId: number, seed: number[]): SimState {
  const sc = SCENARIOS.stable;
  const jitter = (i: number, amp: number) => ((seed[i % seed.length] ?? 0.5) - 0.5) * amp;
  const hrHist = Array.from({ length: 40 }, (_, i) => Math.round(sc.vitals.hr + jitter(i, 4)));
  const spHist = Array.from({ length: 40 }, (_, i) =>
    Math.min(100, Math.round(sc.vitals.spo2 + jitter(i + 7, 2))),
  );
  const s: SimState = {
    sessionId,
    sessionStart: now,
    status: "standby",
    scenario: "stable",
    elapsed: 0,
    base: { ...sc.vitals },
    shown: { ...sc.vitals },
    nibpWall: now,
    history: { hr: hrHist, spo2: spHist, sys: [sc.vitals.sys] },
    eblTotal: sc.eblPreset,
    eblEntries: [{ id: 1, wall: now, amount: sc.eblPreset, kind: "preset" }],
    sensors: { ...sc.sensors },
    activeKeys: [],
    review: { level: "none", reasons: [] },
    alerts: [],
    events: [],
    seq: 1,
  };
  addEvent(s, now, "SYSTEM", "Monitoring session opened — simulation mode");
  addEvent(s, now, "SYSTEM", "Fictional patient record loaded (Demo Patient A)");
  addEvent(s, now, "SENSOR", "Sensors paired: EHG array (4-ch), ECG, NIBP cuff, SpO₂ probe");
  addEvent(s, now, "SCENARIO", "Demo scenario: Stable");
  addEvent(s, now, "EBL", `EBL ${sc.eblPreset} mL on record (fictional manual entry)`);
  applyReview(s, now);
  return s;
}

function reducer(state: SimState, action: Action): SimState {
  switch (action.type) {
    case "start": {
      if (state.status === "running") return state;
      const s = clone(state);
      addEvent(s, action.now, "USER", state.status === "paused" ? "Demo stream resumed" : "Demo stream started");
      s.status = "running";
      return s;
    }
    case "pause": {
      if (state.status !== "running") return state;
      const s = clone(state);
      s.status = "paused";
      addEvent(s, action.now, "USER", "Demo stream paused");
      return s;
    }
    case "reset": {
      const s = createInitialState(action.now, state.sessionId + 1, action.seed);
      addEvent(s, action.now, "USER", "Session reset — demo values restored");
      return s;
    }
    case "scenario": {
      if (action.id === state.scenario) return state;
      const s = clone(state);
      const prev = SCENARIOS[state.scenario];
      const next = SCENARIOS[action.id];
      s.scenario = action.id;
      addEvent(s, action.now, "SCENARIO", `Demo scenario changed: ${prev.label} → ${next.label}`);

      for (const id of SENSOR_IDS) {
        const a = state.sensors[id];
        const b = next.sensors[id];
        if (a.state === b.state && a.note === b.note) continue;
        addEvent(s, action.now, "SENSOR", `${SENSOR_INFO[id].label}: ${b.note}`);
        if (b.state !== "connected") {
          addAlert(s, action.now, "technical", "Sensor check suggested", `${SENSOR_INFO[id].label} — ${b.note}`);
        }
      }
      s.sensors = { ...next.sensors };

      s.eblTotal = next.eblPreset;
      s.seq += 1;
      s.eblEntries = [{ id: s.seq, wall: action.now, amount: next.eblPreset, kind: "preset" }];
      addEvent(s, action.now, "EBL", `EBL set to scenario value ${next.eblPreset} mL (fictional manual entry)`);

      if (state.status !== "running") {
        // Not streaming: apply scenario values immediately so the selection is visible.
        s.base = { ...next.vitals };
        s.shown = { ...next.vitals };
        s.nibpWall = action.now;
        s.history = {
          hr: pushCapped(s.history.hr, next.vitals.hr),
          spo2: pushCapped(s.history.spo2, next.vitals.spo2),
          sys: pushCapped(s.history.sys, next.vitals.sys),
        };
      }
      applyReview(s, action.now);
      return s;
    }
    case "tick": {
      if (state.status !== "running") return state;
      const s = clone(state);
      const [r0, r1, r2, r3] = action.rnd;
      const tgt = SCENARIOS[s.scenario].vitals;
      s.elapsed += 1;

      s.base.hr += (tgt.hr - s.base.hr) * 0.3;
      s.base.spo2 += (tgt.spo2 - s.base.spo2) * 0.3;
      s.shown.hr = Math.round(s.base.hr + (r0 - 0.5) * 4);
      s.shown.spo2 = Math.min(100, Math.round(s.base.spo2 + (r1 - 0.5) * 2));

      if (s.elapsed % NIBP_INTERVAL_S === 0) {
        s.base.sys += (tgt.sys - s.base.sys) * 0.6;
        s.base.dia += (tgt.dia - s.base.dia) * 0.6;
        s.shown.sys = Math.round(s.base.sys + (r2 - 0.5) * 4);
        s.shown.dia = Math.round(s.base.dia + (r3 - 0.5) * 4);
        s.nibpWall = action.now;
        s.history.sys = pushCapped(s.history.sys, s.shown.sys);
      }
      s.history.hr = pushCapped(s.history.hr, s.shown.hr);
      s.history.spo2 = pushCapped(s.history.spo2, s.shown.spo2);
      applyReview(s, action.now);
      return s;
    }
    case "ebl": {
      if (!Number.isInteger(action.amount) || action.amount < 1) return state;
      const s = clone(state);
      s.eblTotal += action.amount;
      s.seq += 1;
      s.eblEntries = [{ id: s.seq, wall: action.now, amount: action.amount, kind: "manual" as const }, ...s.eblEntries].slice(0, 20);
      addEvent(s, action.now, "EBL", `Manual EBL entry +${action.amount} mL (cumulative ${s.eblTotal} mL) — demo user`);
      applyReview(s, action.now);
      return s;
    }
    case "ack": {
      const target = state.alerts.find((a) => a.id === action.id);
      if (!target || target.acknowledged) return state;
      const s = clone(state);
      s.alerts = s.alerts.map((a) => (a.id === action.id ? { ...a, acknowledged: true, ackWall: action.now } : a));
      addEvent(s, action.now, "USER", `Alert acknowledged: ${target.title}`);
      return s;
    }
    case "ackAll": {
      const pending = state.alerts.filter((a) => !a.acknowledged).length;
      if (pending === 0) return state;
      const s = clone(state);
      s.alerts = s.alerts.map((a) => (a.acknowledged ? a : { ...a, acknowledged: true, ackWall: action.now }));
      addEvent(s, action.now, "USER", `${pending} alert${pending > 1 ? "s" : ""} acknowledged`);
      return s;
    }
  }
}

const randomSeed = () => Array.from({ length: 16 }, () => Math.random());

export function useNafasSimulation() {
  const [state, dispatch] = useReducer(reducer, undefined, () =>
    createInitialState(Date.now(), 1, randomSeed()),
  );

  useEffect(() => {
    if (state.status !== "running") return;
    const id = window.setInterval(() => {
      dispatch({
        type: "tick",
        now: Date.now(),
        rnd: [Math.random(), Math.random(), Math.random(), Math.random()],
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [state.status]);

  const start = useCallback(() => dispatch({ type: "start", now: Date.now() }), []);
  const pause = useCallback(() => dispatch({ type: "pause", now: Date.now() }), []);
  const reset = useCallback(() => dispatch({ type: "reset", now: Date.now(), seed: randomSeed() }), []);
  const setScenario = useCallback((id: ScenarioId) => dispatch({ type: "scenario", id, now: Date.now() }), []);
  const addEbl = useCallback((amount: number) => dispatch({ type: "ebl", amount, now: Date.now() }), []);
  const acknowledge = useCallback((id: number) => dispatch({ type: "ack", id, now: Date.now() }), []);
  const acknowledgeAll = useCallback(() => dispatch({ type: "ackAll", now: Date.now() }), []);

  const actions = useMemo(
    () => ({ start, pause, reset, setScenario, addEbl, acknowledge, acknowledgeAll }),
    [start, pause, reset, setScenario, addEbl, acknowledge, acknowledgeAll],
  );

  return { state, actions };
}
