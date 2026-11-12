import type { EhgParams } from "./ehg";

/**
 * Fictional demonstration scenarios. Values are invented for a prototype and
 * are not derived from, or validated against, clinical data.
 */
export type ScenarioId = "stable" | "review" | "urgent";
export const SCENARIO_ORDER: ScenarioId[] = ["stable", "review", "urgent"];

/** The EHG patch plus the external hospital devices feeding the dashboard. */
export type SensorId = "ehg" | "ecg" | "nibp" | "spo2" | "temp";
export const SENSOR_IDS: SensorId[] = ["ehg", "ecg", "nibp", "spo2", "temp"];
export const EXTERNAL_DEVICE_IDS: SensorId[] = ["ecg", "nibp", "spo2", "temp"];
export type SensorState = "connected" | "degraded" | "disconnected";
export interface SensorReading {
  state: SensorState;
  note: string;
}

export const SENSOR_INFO: Record<
  SensorId,
  { label: string; short: string; detail: string; provides: string }
> = {
  ehg: {
    label: "EHG abdominal patch",
    short: "EHG patch",
    detail: "4 electrodes · wireless",
    provides: "Uterine activity",
  },
  ecg: {
    label: "ECG / heart-rate monitor",
    short: "ECG monitor",
    detail: "3-lead",
    provides: "HR · RR",
  },
  nibp: {
    label: "Blood pressure cuff",
    short: "BP cuff",
    detail: "Left upper arm",
    provides: "BP",
  },
  spo2: {
    label: "Pulse oximeter",
    short: "Pulse oximeter",
    detail: "Right index finger",
    provides: "SpO₂",
  },
  temp: { label: "Thermometer", short: "Thermometer", detail: "Tympanic", provides: "Temp" },
};

export type UterineTone = "firm" | "soft" | "not_assessed";
export const TONE_LABEL: Record<UterineTone, string> = {
  firm: "Firm",
  soft: "Soft",
  not_assessed: "Not assessed",
};

export interface ScenarioVitals {
  hr: number;
  sys: number;
  dia: number;
  spo2: number;
  /** Respiratory rate, breaths/min */
  rr: number;
  /** Temperature, °C */
  temp: number;
}

export interface Scenario {
  id: ScenarioId;
  label: string;
  description: string;
  vitals: ScenarioVitals;
  /** Fictional cumulative blood loss, as if recorded manually by staff */
  eblPreset: number;
  /** Fictional cumulative urine output since birth (mL) */
  urinePreset: number;
  /** Fictional clinician-entered uterine tone */
  tonePreset: UterineTone;
  ehg: EhgParams;
  ehgPattern: string;
  /** Relative pleth waveform amplitude (display only) */
  plethAmplitude: number;
  /** EHG patch electrode signal quality, % per electrode (fictional) */
  electrodes: [number, number, number, number];
  /** Patch wireless signal strength, dBm (fictional) */
  rssi: number;
  sensors: Record<SensorId, SensorReading>;
}

const DEVICE_OK: Omit<Record<SensorId, SensorReading>, "ehg"> = {
  ecg: { state: "connected", note: "Good signal" },
  nibp: { state: "connected", note: "Cycling q10 s (demo)" },
  spo2: { state: "connected", note: "Good signal" },
  temp: { state: "connected", note: "Reading q30 s (demo)" },
};

export const SCENARIOS: Record<ScenarioId, Scenario> = {
  stable: {
    id: "stable",
    label: "Stable",
    description: "Values within configured demo ranges",
    vitals: { hr: 78, sys: 118, dia: 76, spo2: 98, rr: 16, temp: 36.8 },
    eblPreset: 300,
    urinePreset: 240,
    tonePreset: "firm",
    ehg: { amplitude: 1, period: 12, irregularity: 0.06, noise: 0.05, width: 1.9 },
    ehgPattern: "Regular bursts",
    plethAmplitude: 1,
    electrodes: [96, 93, 95, 91],
    rssi: -54,
    sensors: { ehg: { state: "connected", note: "Good signal · 4/4 electrodes" }, ...DEVICE_OK },
  },
  review: {
    id: "review",
    label: "Clinical Review",
    description: "Some values outside demo review ranges",
    vitals: { hr: 106, sys: 102, dia: 64, spo2: 96, rr: 21, temp: 37.2 },
    eblPreset: 650,
    urinePreset: 110,
    tonePreset: "soft",
    ehg: { amplitude: 0.6, period: 16, irregularity: 0.28, noise: 0.08, width: 1.7 },
    ehgPattern: "Lower amplitude, irregular",
    plethAmplitude: 0.8,
    electrodes: [90, 84, 88, 38],
    rssi: -63,
    sensors: { ehg: { state: "degraded", note: "Signal fair · 3/4 electrodes" }, ...DEVICE_OK },
  },
  urgent: {
    id: "urgent",
    label: "Urgent Review",
    description: "Multiple values outside demo urgent ranges",
    vitals: { hr: 126, sys: 86, dia: 52, spo2: 92, rr: 26, temp: 37.4 },
    eblPreset: 1150,
    urinePreset: 40,
    tonePreset: "soft",
    ehg: { amplitude: 0.34, period: 20, irregularity: 0.45, noise: 0.11, width: 1.5 },
    ehgPattern: "Low amplitude, irregular",
    plethAmplitude: 0.55,
    electrodes: [86, 79, 83, 34],
    rssi: -66,
    sensors: {
      ehg: { state: "degraded", note: "Signal fair · 3/4 electrodes" },
      ...DEVICE_OK,
      spo2: { state: "degraded", note: "Motion artefact — check probe" },
    },
  },
};
