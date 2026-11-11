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

function reason(param: ReviewParam, level: "review" | "urgent", message: string): ReviewReason {
  return { key: `${param}:${level}`, param, level, message };
}

export function evaluateReview({ hr, sys, spo2, ebl }: ReviewInput): ReviewResult {
  const t = DEMO_THRESHOLDS;
  const reasons: ReviewReason[] = [];

  if (hr >= t.hr.urgent) reasons.push(reason("hr", "urgent", `HR ${hr} bpm ≥ demo threshold ${t.hr.urgent}`));
  else if (hr >= t.hr.review) reasons.push(reason("hr", "review", `HR ${hr} bpm ≥ demo threshold ${t.hr.review}`));

  if (sys < t.sys.urgent) reasons.push(reason("sys", "urgent", `Systolic BP ${sys} mmHg < demo threshold ${t.sys.urgent}`));
  else if (sys < t.sys.review) reasons.push(reason("sys", "review", `Systolic BP ${sys} mmHg < demo threshold ${t.sys.review}`));

  if (spo2 < t.spo2.urgent) reasons.push(reason("spo2", "urgent", `SpO₂ ${spo2}% < demo threshold ${t.spo2.urgent}%`));
  else if (spo2 < t.spo2.review) reasons.push(reason("spo2", "review", `SpO₂ ${spo2}% < demo threshold ${t.spo2.review}%`));

  if (ebl >= t.ebl.urgent) reasons.push(reason("ebl", "urgent", `Recorded EBL ${ebl} mL ≥ demo threshold ${t.ebl.urgent} mL`));
  else if (ebl >= t.ebl.review) reasons.push(reason("ebl", "review", `Recorded EBL ${ebl} mL ≥ demo threshold ${t.ebl.review} mL`));

  const level: ReviewLevel = reasons.some((r) => r.level === "urgent")
    ? "urgent"
    : reasons.length > 0
      ? "review"
      : "none";

  return { level, reasons };
}
