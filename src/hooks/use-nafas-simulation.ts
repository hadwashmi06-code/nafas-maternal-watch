import { useCallback, useEffect, useMemo, useReducer } from "react";

import {
  DEMO_PATIENT,
  IMPORT_DEVICE,
  PATCH_ID,
  SYMPTOMS,
  type SymptomId,
} from "@/lib/nafascare/patient";
import { evaluateReview, shockIndex, type ReviewResult } from "@/lib/nafascare/review-rules";
import {
  SCENARIOS,
  SENSOR_IDS,
  SENSOR_INFO,
  TONE_LABEL,
  type ScenarioId,
  type ScenarioVitals,
  type SensorId,
  type SensorReading,
  type UterineTone,
} from "@/lib/nafascare/scenarios";

export type RunStatus = "standby" | "running" | "paused";
export type EventCategory =
  "SYSTEM" | "SCENARIO" | "ALERT" | "EBL" | "SENSOR" | "USER" | "OBS" | "MED";
export type AlertSeverity = "review" | "urgent" | "technical" | "info";
export type BloodLossSource = "manual" | "imported";

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
  source: BloodLossSource;
  /** True when the value is the scenario's fictional starting record */
  preset: boolean;
}

export interface UrineEntry {
  id: number;
  wall: number;
  amount: number;
  preset: boolean;
}

export interface ToneRecord {
  value: UterineTone;
  wall: number;
  by: "scenario" | "clinician";
}

export interface NoteEntry {
  id: number;
  wall: number;
  text: string;
}

export interface InterventionEntry {
  id: number;
  wall: number;
  name: string;
}

export interface PatchStatus {
  battery: number;
  electrodes: [number, number, number, number];
  rssi: number;
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
  tempWall: number;
  history: {
    hr: number[];
    spo2: number[];
    sys: number[];
    rr: number[];
    temp: number[];
    si: number[];
  };
  eblTotal: number;
  eblEntries: EblEntry[];
  urineTotal: number;
  urineEntries: UrineEntry[];
  tone: ToneRecord;
  symptoms: SymptomId[];
  notes: NoteEntry[];
  interventions: InterventionEntry[];
  patch: PatchStatus;
  sensors: Record<SensorId, SensorReading>;
  activeKeys: string[];
  review: ReviewResult;
  alerts: AlertItem[];
  events: LogEvent[];
  seq: number;
}

export type Action =
  | { type: "start"; now: number }
  | { type: "pause"; now: number }
  | { type: "reset"; now: number; seed: number[] }
  | { type: "scenario"; id: ScenarioId; now: number }
  | { type: "tick"; now: number; rnd: [number, number, number, number, number, number] }
  | { type: "ebl"; amount: number; source: BloodLossSource; now: number }
  | { type: "urine"; amount: number; now: number }
  | { type: "tone"; value: UterineTone; now: number }
  | { type: "symptom"; id: SymptomId; now: number }
  | { type: "note"; text: string; now: number }
  | { type: "intervention"; name: string; now: number }
  | { type: "ack"; id: number; now: number }
  | { type: "ackAll"; now: number };

export const NIBP_INTERVAL_S = 10;
export const TEMP_INTERVAL_S = 30;
const RR_INTERVAL_S = 4;
const BATTERY_DRAIN_S = 45;
const START_BATTERY = 86;
const HISTORY_LEN = 120;
export const MAX_ENTRY_ML = 3000;

const pushCapped = (arr: number[], v: number, cap = HISTORY_LEN) => {
  const next = arr.length >= cap ? arr.slice(arr.length - cap + 1) : arr.slice();
  next.push(v);
  return next;
};
const round1 = (v: number) => Math.round(v * 10) / 10;

function addEvent(s: SimState, now: number, category: EventCategory, text: string) {
  s.seq += 1;
  s.events = [{ id: s.seq, wall: now, elapsed: s.elapsed, category, text }, ...s.events].slice(
    0,
    300,
  );
}

function addAlert(
  s: SimState,
  now: number,
  severity: AlertSeverity,
  title: string,
  detail: string,
) {
  s.seq += 1;
  s.alerts = [
    { id: s.seq, wall: now, severity, title, detail, acknowledged: false },
    ...s.alerts,
  ].slice(0, 100);
}

function applyReview(s: SimState, now: number) {
  const result = evaluateReview({
    hr: Math.round(s.base.hr),
    sys: s.shown.sys,
    spo2: Math.round(s.base.spo2),
    rr: Math.round(s.base.rr),
    temp: s.shown.temp,
    ebl: s.eblTotal,
  });
  const keys = result.reasons.map((r) => r.key);
  for (const r of result.reasons) {
    if (s.activeKeys.includes(r.key)) continue;
    const title =
      r.level === "urgent" ? "Urgent clinical review suggested" : "Clinical review suggested";
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
    patch: { ...state.patch },
  };
}

export function createInitialState(now: number, sessionId: number, seed: number[]): SimState {
  const sc = SCENARIOS.stable;
  const v = sc.vitals;
  const jitter = (i: number, amp: number) => ((seed[i % seed.length] ?? 0.5) - 0.5) * amp;
  const hist = (fn: (i: number) => number) => Array.from({ length: 40 }, (_, i) => fn(i));
  const s: SimState = {
    sessionId,
    sessionStart: now,
    status: "standby",
    scenario: "stable",
    elapsed: 0,
    base: { ...v },
    shown: { ...v },
    nibpWall: now,
    tempWall: now,
    history: {
      hr: hist((i) => Math.round(v.hr + jitter(i, 4))),
      spo2: hist((i) => Math.min(100, Math.round(v.spo2 + jitter(i + 7, 2)))),
      // Intermittent readings hold their value between cycles, as on a real monitor.
      sys: hist((i) => Math.round(v.sys + jitter(Math.floor(i / NIBP_INTERVAL_S) + 3, 4))),
      rr: hist((i) => Math.round(v.rr + jitter(Math.floor(i / RR_INTERVAL_S) + 5, 2))),
      temp: hist((i) => round1(v.temp + jitter(Math.floor(i / TEMP_INTERVAL_S) + 9, 0.2))),
      si: hist((i) =>
        shockIndex(v.hr + jitter(i, 4), v.sys + jitter(Math.floor(i / NIBP_INTERVAL_S) + 3, 4)),
      ),
    },
    eblTotal: sc.eblPreset,
    eblEntries: [{ id: 1, wall: now, amount: sc.eblPreset, source: "manual", preset: true }],
    urineTotal: sc.urinePreset,
    urineEntries: [{ id: 1, wall: now, amount: sc.urinePreset, preset: true }],
    tone: { value: sc.tonePreset, wall: now, by: "scenario" },
    symptoms: [],
    notes: [],
    interventions: [],
    patch: { battery: START_BATTERY, electrodes: [...sc.electrodes], rssi: sc.rssi },
    sensors: { ...sc.sensors },
    activeKeys: [],
    review: { level: "none", reasons: [] },
    alerts: [],
    events: [],
    seq: 1,
  };
  addEvent(s, now, "SYSTEM", "Monitoring session opened — simulation mode");
  addEvent(s, now, "SYSTEM", `Fictional patient record loaded (${DEMO_PATIENT.name})`);
  addEvent(s, now, "SENSOR", `EHG patch ${PATCH_ID} paired (wireless, 4 electrodes)`);
  addEvent(
    s,
    now,
    "SENSOR",
    "External devices linked: ECG monitor, BP cuff, pulse oximeter, thermometer",
  );
  addEvent(s, now, "SCENARIO", "Demo scenario: Stable");
  addEvent(s, now, "EBL", `Blood loss ${sc.eblPreset} mL on record (fictional manual entry)`);
  applyReview(s, now);
  return s;
}

function validAmount(n: number) {
  return Number.isInteger(n) && n >= 1 && n <= MAX_ENTRY_ML;
}

export function reducer(state: SimState, action: Action): SimState {
  switch (action.type) {
    case "start": {
      if (state.status === "running") return state;
      const s = clone(state);
      addEvent(
        s,
        action.now,
        "USER",
        state.status === "paused" ? "Demo stream resumed" : "Demo stream started",
      );
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
          addAlert(
            s,
            action.now,
            "technical",
            "Device check suggested",
            `${SENSOR_INFO[id].label} — ${b.note}`,
          );
        }
      }
      s.sensors = { ...next.sensors };
      s.patch = { ...s.patch, electrodes: [...next.electrodes], rssi: next.rssi };

      s.eblTotal = next.eblPreset;
      s.seq += 1;
      s.eblEntries = [
        { id: s.seq, wall: action.now, amount: next.eblPreset, source: "manual", preset: true },
      ];
      addEvent(
        s,
        action.now,
        "EBL",
        `Blood loss set to scenario value ${next.eblPreset} mL (fictional manual entry)`,
      );

      s.urineTotal = next.urinePreset;
      s.seq += 1;
      s.urineEntries = [{ id: s.seq, wall: action.now, amount: next.urinePreset, preset: true }];
      s.tone = { value: next.tonePreset, wall: action.now, by: "scenario" };
      addEvent(
        s,
        action.now,
        "OBS",
        `Scenario records: uterine tone ${TONE_LABEL[next.tonePreset]}, urine output ${next.urinePreset} mL (fictional)`,
      );

      if (state.status !== "running") {
        // Not streaming: apply scenario values immediately so the selection is visible.
        s.base = { ...next.vitals };
        s.shown = { ...next.vitals };
        s.nibpWall = action.now;
        s.tempWall = action.now;
        const v = next.vitals;
        s.history = {
          hr: pushCapped(s.history.hr, v.hr),
          spo2: pushCapped(s.history.spo2, v.spo2),
          sys: pushCapped(s.history.sys, v.sys),
          rr: pushCapped(s.history.rr, v.rr),
          temp: pushCapped(s.history.temp, v.temp),
          si: pushCapped(s.history.si, shockIndex(v.hr, v.sys)),
        };
      }
      applyReview(s, action.now);
      return s;
    }
    case "tick": {
      if (state.status !== "running") return state;
      const s = clone(state);
      const [r0, r1, r2, r3, r4, r5] = action.rnd;
      const tgt = SCENARIOS[s.scenario].vitals;
      s.elapsed += 1;

      s.base.hr += (tgt.hr - s.base.hr) * 0.3;
      s.base.spo2 += (tgt.spo2 - s.base.spo2) * 0.3;
      s.base.rr += (tgt.rr - s.base.rr) * 0.3;
      s.shown.hr = Math.round(s.base.hr + (r0 - 0.5) * 4);
      s.shown.spo2 = Math.min(100, Math.round(s.base.spo2 + (r1 - 0.5) * 2));

      if (s.elapsed % RR_INTERVAL_S === 0) {
        s.shown.rr = Math.round(s.base.rr + (r4 - 0.5) * 2);
      }
      if (s.elapsed % NIBP_INTERVAL_S === 0) {
        s.base.sys += (tgt.sys - s.base.sys) * 0.6;
        s.base.dia += (tgt.dia - s.base.dia) * 0.6;
        s.shown.sys = Math.round(s.base.sys + (r2 - 0.5) * 4);
        s.shown.dia = Math.round(s.base.dia + (r3 - 0.5) * 4);
        s.nibpWall = action.now;
      }
      if (s.elapsed % TEMP_INTERVAL_S === 0) {
        s.base.temp += (tgt.temp - s.base.temp) * 0.6;
        s.shown.temp = round1(s.base.temp + (r5 - 0.5) * 0.2);
        s.tempWall = action.now;
      }
      if (s.elapsed % BATTERY_DRAIN_S === 0) {
        s.patch.battery = Math.max(5, s.patch.battery - 1);
      }
      s.history.hr = pushCapped(s.history.hr, s.shown.hr);
      s.history.spo2 = pushCapped(s.history.spo2, s.shown.spo2);
      s.history.sys = pushCapped(s.history.sys, s.shown.sys);
      s.history.rr = pushCapped(s.history.rr, s.shown.rr);
      s.history.temp = pushCapped(s.history.temp, s.shown.temp);
      s.history.si = pushCapped(s.history.si, shockIndex(s.shown.hr, s.shown.sys));
      applyReview(s, action.now);
      return s;
    }
    case "ebl": {
      if (!validAmount(action.amount)) return state;
      const s = clone(state);
      s.eblTotal += action.amount;
      s.seq += 1;
      s.eblEntries = [
        {
          id: s.seq,
          wall: action.now,
          amount: action.amount,
          source: action.source,
          preset: false,
        },
        ...s.eblEntries,
      ].slice(0, 30);
      const how =
        action.source === "imported"
          ? `imported from ${IMPORT_DEVICE}`
          : "manual entry — demo user";
      addEvent(
        s,
        action.now,
        "EBL",
        `Blood loss +${action.amount} mL, ${how} (cumulative ${s.eblTotal} mL)`,
      );
      applyReview(s, action.now);
      return s;
    }
    case "urine": {
      if (!validAmount(action.amount)) return state;
      const s = clone(state);
      s.urineTotal += action.amount;
      s.seq += 1;
      s.urineEntries = [
        { id: s.seq, wall: action.now, amount: action.amount, preset: false },
        ...s.urineEntries,
      ].slice(0, 30);
      addEvent(
        s,
        action.now,
        "OBS",
        `Urine output +${action.amount} mL (cumulative ${s.urineTotal} mL) — demo user`,
      );
      return s;
    }
    case "tone": {
      if (state.tone.value === action.value && state.tone.by === "clinician") return state;
      const s = clone(state);
      s.tone = { value: action.value, wall: action.now, by: "clinician" };
      addEvent(
        s,
        action.now,
        "OBS",
        `Uterine tone recorded: ${TONE_LABEL[action.value]} — demo clinician`,
      );
      return s;
    }
    case "symptom": {
      const info = SYMPTOMS.find((x) => x.id === action.id);
      if (!info) return state;
      const s = clone(state);
      const on = !state.symptoms.includes(action.id);
      s.symptoms = on
        ? [...state.symptoms, action.id]
        : state.symptoms.filter((x) => x !== action.id);
      addEvent(s, action.now, "OBS", `Observation ${on ? "recorded" : "cleared"}: ${info.label}`);
      return s;
    }
    case "note": {
      const text = action.text.trim().slice(0, 200);
      if (!text) return state;
      const s = clone(state);
      s.seq += 1;
      s.notes = [{ id: s.seq, wall: action.now, text }, ...s.notes].slice(0, 50);
      addEvent(s, action.now, "OBS", `Nursing note: ${text}`);
      return s;
    }
    case "intervention": {
      const name = action.name.trim().slice(0, 80);
      if (!name) return state;
      const s = clone(state);
      s.seq += 1;
      s.interventions = [{ id: s.seq, wall: action.now, name }, ...s.interventions].slice(0, 50);
      addEvent(s, action.now, "MED", `Recorded: ${name} — demo user`);
      return s;
    }
    case "ack": {
      const target = state.alerts.find((a) => a.id === action.id);
      if (!target || target.acknowledged) return state;
      const s = clone(state);
      s.alerts = s.alerts.map((a) =>
        a.id === action.id ? { ...a, acknowledged: true, ackWall: action.now } : a,
      );
      addEvent(s, action.now, "USER", `Alert acknowledged: ${target.title}`);
      return s;
    }
    case "ackAll": {
      const pending = state.alerts.filter((a) => !a.acknowledged).length;
      if (pending === 0) return state;
      const s = clone(state);
      s.alerts = s.alerts.map((a) =>
        a.acknowledged ? a : { ...a, acknowledged: true, ackWall: action.now },
      );
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
      const r = Math.random;
      dispatch({ type: "tick", now: Date.now(), rnd: [r(), r(), r(), r(), r(), r()] });
    }, 1000);
    return () => window.clearInterval(id);
  }, [state.status]);

  const start = useCallback(() => dispatch({ type: "start", now: Date.now() }), []);
  const pause = useCallback(() => dispatch({ type: "pause", now: Date.now() }), []);
  const reset = useCallback(
    () => dispatch({ type: "reset", now: Date.now(), seed: randomSeed() }),
    [],
  );
  const setScenario = useCallback(
    (id: ScenarioId) => dispatch({ type: "scenario", id, now: Date.now() }),
    [],
  );
  const addEbl = useCallback(
    (amount: number, source: BloodLossSource) =>
      dispatch({ type: "ebl", amount, source, now: Date.now() }),
    [],
  );
  const addUrine = useCallback(
    (amount: number) => dispatch({ type: "urine", amount, now: Date.now() }),
    [],
  );
  const setTone = useCallback(
    (value: UterineTone) => dispatch({ type: "tone", value, now: Date.now() }),
    [],
  );
  const toggleSymptom = useCallback(
    (id: SymptomId) => dispatch({ type: "symptom", id, now: Date.now() }),
    [],
  );
  const addNote = useCallback(
    (text: string) => dispatch({ type: "note", text, now: Date.now() }),
    [],
  );
  const addIntervention = useCallback(
    (name: string) => dispatch({ type: "intervention", name, now: Date.now() }),
    [],
  );
  const acknowledge = useCallback(
    (id: number) => dispatch({ type: "ack", id, now: Date.now() }),
    [],
  );
  const acknowledgeAll = useCallback(() => dispatch({ type: "ackAll", now: Date.now() }), []);

  const actions = useMemo(
    () => ({
      start,
      pause,
      reset,
      setScenario,
      addEbl,
      addUrine,
      setTone,
      toggleSymptom,
      addNote,
      addIntervention,
      acknowledge,
      acknowledgeAll,
    }),
    [
      start,
      pause,
      reset,
      setScenario,
      addEbl,
      addUrine,
      setTone,
      toggleSymptom,
      addNote,
      addIntervention,
      acknowledge,
      acknowledgeAll,
    ],
  );

  return { state, actions };
}

export type SimActions = ReturnType<typeof useNafasSimulation>["actions"];
