import type { EhgParams } from "./ehg";

/**
 * Fictional demonstration scenarios. Values are invented for a prototype and
 * are not derived from, or validated against, clinical data.
 */
export type ScenarioId = "stable" | "review" | "urgent";
export const SCENARIO_ORDER: ScenarioId[] = ["stable", "review", "urgent"];

export type SensorId = "ehg" | "ecg" | "nibp" | "spo2";
export const SENSOR_IDS: SensorId[] = ["ehg", "ecg", "nibp", "spo2"];
export type SensorState = "connected" | "degraded" | "disconnected";
export interface SensorReading {
  state: SensorState;
  note: string;
}

export const SENSOR_INFO: Record<SensorId, { label: string; detail: string }> = {
  ehg: { label: "EHG electrode array", detail: "4-ch abdominal surface" },
  ecg: { label: "ECG / heart rate", detail: "3-lead" },
  nibp: { label: "NIBP cuff", detail: "Left upper arm" },
  spo2: { label: "SpO₂ probe", detail: "Right index finger" },
};

export interface ScenarioVitals {
  hr: number;
  sys: number;
  dia: number;
  spo2: number;
}

export interface Scenario {
  id: ScenarioId;
  label: string;
  description: string;
  vitals: ScenarioVitals;
  /** Fictional cumulative estimated blood loss, as if entered manually by staff */
  eblPreset: number;
  ehg: EhgParams;
  ehgPattern: string;
  sensors: Record<SensorId, SensorReading>;
}

export const SCENARIOS: Record<ScenarioId, Scenario> = {
  stable: {
    id: "stable",
    label: "Stable",
    description: "Values within configured demo ranges",
    vitals: { hr: 78, sys: 118, dia: 76, spo2: 98 },
    eblPreset: 300,
    ehg: { amplitude: 1, period: 12, irregularity: 0.06, noise: 0.05, width: 1.9 },
    ehgPattern: "Regular bursts",
    sensors: {
      ehg: { state: "connected", note: "Good signal · 4/4 ch" },
      ecg: { state: "connected", note: "Good signal" },
      nibp: { state: "connected", note: "Cycling q10 s (demo)" },
      spo2: { state: "connected", note: "Good signal" },
    },
  },
  review: {
    id: "review",
    label: "Clinical Review",
    description: "Some values outside demo review ranges",
    vitals: { hr: 106, sys: 102, dia: 64, spo2: 96 },
    eblPreset: 650,
    ehg: { amplitude: 0.6, period: 16, irregularity: 0.28, noise: 0.08, width: 1.7 },
    ehgPattern: "Lower amplitude, irregular",
    sensors: {
      ehg: { state: "degraded", note: "Signal quality fair · 3/4 ch" },
      ecg: { state: "connected", note: "Good signal" },
      nibp: { state: "connected", note: "Cycling q10 s (demo)" },
      spo2: { state: "connected", note: "Good signal" },
    },
  },
  urgent: {
    id: "urgent",
    label: "Urgent Review",
    description: "Multiple values outside demo urgent ranges",
    vitals: { hr: 126, sys: 86, dia: 52, spo2: 92 },
    eblPreset: 1150,
    ehg: { amplitude: 0.34, period: 20, irregularity: 0.45, noise: 0.11, width: 1.5 },
    ehgPattern: "Low amplitude, irregular",
    sensors: {
      ehg: { state: "degraded", note: "Signal quality fair · 3/4 ch" },
      ecg: { state: "connected", note: "Good signal" },
      nibp: { state: "connected", note: "Cycling q10 s (demo)" },
      spo2: { state: "degraded", note: "Motion artefact — check probe" },
    },
  },
};
