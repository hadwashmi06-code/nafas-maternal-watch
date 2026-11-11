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
  /** SpO₂ (%): prompt when value < threshold */
  spo2: { review: 95, urgent: 94 },
  /** Manually entered estimated blood loss (mL): prompt when value ≥ threshold */
  ebl: { review: 500, urgent: 1000 },
} as const;

export type ReviewLevel = "none" | "review" | "urgent";
export type ReviewParam = "hr" | "sys" | "spo2" | "ebl";

export interface ReviewReason {
  key: string;
  param: ReviewParam;
  level: Exclude<ReviewLevel, "none">;
  message: string;
  /** Compact form for the monitor alarm bar, e.g. "HR 126 ≥ 120" */
  short: string;
}

export interface ReviewInput {
  hr: number;
  sys: number;
  spo2: number;
  ebl: number;
}

export interface ReviewResult {
  level: ReviewLevel;
  reasons: ReviewReason[];
}

const META: Record<ReviewParam, { name: string; short: string; unit: string; op: "≥" | "<" }> = {
  hr: { name: "HR", short: "HR", unit: " bpm", op: "≥" },
  sys: { name: "Systolic BP", short: "SBP", unit: " mmHg", op: "<" },
  spo2: { name: "SpO₂", short: "SpO₂", unit: "%", op: "<" },
  ebl: { name: "Recorded EBL", short: "EBL", unit: " mL", op: "≥" },
};

function reason(param: ReviewParam, level: "review" | "urgent", value: number, threshold: number): ReviewReason {
  const m = META[param];
  return {
    key: `${param}:${level}`,
    param,
    level,
    message: `${m.name} ${value}${m.unit} ${m.op} demo threshold ${threshold}${m.unit.trim() === "%" ? "%" : param === "ebl" ? " mL" : ""}`,
    short: `${m.short} ${value} ${m.op} ${threshold}${param === "ebl" ? " mL" : ""}`,
  };
}

export function evaluateReview({ hr, sys, spo2, ebl }: ReviewInput): ReviewResult {
  const t = DEMO_THRESHOLDS;
  const reasons: ReviewReason[] = [];

  if (hr >= t.hr.urgent) reasons.push(reason("hr", "urgent", hr, t.hr.urgent));
  else if (hr >= t.hr.review) reasons.push(reason("hr", "review", hr, t.hr.review));

  if (sys < t.sys.urgent) reasons.push(reason("sys", "urgent", sys, t.sys.urgent));
  else if (sys < t.sys.review) reasons.push(reason("sys", "review", sys, t.sys.review));

  if (spo2 < t.spo2.urgent) reasons.push(reason("spo2", "urgent", spo2, t.spo2.urgent));
  else if (spo2 < t.spo2.review) reasons.push(reason("spo2", "review", spo2, t.spo2.review));

  if (ebl >= t.ebl.urgent) reasons.push(reason("ebl", "urgent", ebl, t.ebl.urgent));
  else if (ebl >= t.ebl.review) reasons.push(reason("ebl", "review", ebl, t.ebl.review));

  const level: ReviewLevel = reasons.some((r) => r.level === "urgent")
    ? "urgent"
    : reasons.length > 0
      ? "review"
      : "none";

  return { level, reasons };
}
