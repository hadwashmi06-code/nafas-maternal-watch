/**
 * Demonstration review-prompt rules.
 * These thresholds are ILLUSTRATIVE ONLY, chosen for a prototype, and are NOT
 * medically validated. Prompts suggest review; they never diagnose.
 */
export const DEMO_THRESHOLDS = {
  /** Heart rate (bpm): prompt when value ≥ threshold */
  hr: { review: 100, urgent: 120 },
  /** Systolic BP (mmHg): prompt when value < threshold */
  sys: { review: 100, urgent: 90 },
  /** Shock index (HR ÷ systolic BP): prompt when value ≥ threshold */
  si: { review: 0.9, urgent: 1.4 },
  /** SpO₂ (%): prompt when value < threshold */
  spo2: { review: 95, urgent: 94 },
  /** Respiratory rate (breaths/min): prompt when value ≥ threshold */
  rr: { review: 21, urgent: 25 },
  /** Temperature (°C): prompt when value ≥ threshold */
  temp: { review: 38, urgent: 39 },
  /** Recorded cumulative blood loss (mL): prompt when value ≥ threshold */
  ebl: { review: 500, urgent: 1000 },
} as const;

export type ReviewLevel = "none" | "review" | "urgent";
export type ReviewParam = keyof typeof DEMO_THRESHOLDS;

export interface ReviewReason {
  key: string;
  param: ReviewParam;
  level: Exclude<ReviewLevel, "none">;
  message: string;
  /** Compact form for the alert panel, e.g. "HR 126 ≥ 120" */
  short: string;
}

export interface ReviewInput {
  hr: number;
  sys: number;
  spo2: number;
  rr: number;
  temp: number;
  ebl: number;
}

export interface ReviewResult {
  level: ReviewLevel;
  reasons: ReviewReason[];
}

/** Shock index = heart rate ÷ systolic BP, rounded to 2 decimals. */
export const shockIndex = (hr: number, sys: number) =>
  sys > 0 ? Math.round((hr / sys) * 100) / 100 : 0;

const META: Record<
  ReviewParam,
  { name: string; short: string; unit: string; dir: "high" | "low"; dp: number }
> = {
  hr: { name: "HR", short: "HR", unit: " bpm", dir: "high", dp: 0 },
  sys: { name: "Systolic BP", short: "SBP", unit: " mmHg", dir: "low", dp: 0 },
  si: { name: "Shock index", short: "SI", unit: "", dir: "high", dp: 2 },
  spo2: { name: "SpO₂", short: "SpO₂", unit: "%", dir: "low", dp: 0 },
  rr: { name: "Resp. rate", short: "RR", unit: " /min", dir: "high", dp: 0 },
  temp: { name: "Temperature", short: "Temp", unit: " °C", dir: "high", dp: 1 },
  ebl: { name: "Recorded blood loss", short: "EBL", unit: " mL", dir: "high", dp: 0 },
};

const ORDER: ReviewParam[] = ["hr", "sys", "si", "spo2", "rr", "temp", "ebl"];

export function evaluateReview(input: ReviewInput): ReviewResult {
  const values: Record<ReviewParam, number> = { ...input, si: shockIndex(input.hr, input.sys) };
  const reasons: ReviewReason[] = [];

  for (const param of ORDER) {
    const m = META[param];
    const t = DEMO_THRESHOLDS[param];
    const v = values[param];
    const hit = (th: number) => (m.dir === "high" ? v >= th : v < th);
    const level = hit(t.urgent) ? "urgent" : hit(t.review) ? "review" : null;
    if (!level) continue;
    const th = t[level];
    const op = m.dir === "high" ? "≥" : "<";
    const fv = v.toFixed(m.dp);
    const ft = th.toFixed(m.dp);
    reasons.push({
      key: `${param}:${level}`,
      param,
      level,
      message: `${m.name} ${fv}${m.unit} ${op} demo threshold ${ft}${m.unit}`,
      short: `${m.short} ${fv} ${op} ${ft}`,
    });
  }

  const level: ReviewLevel = reasons.some((r) => r.level === "urgent")
    ? "urgent"
    : reasons.length > 0
      ? "review"
      : "none";
  return { level, reasons };
}
